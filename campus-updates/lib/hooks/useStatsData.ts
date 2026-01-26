import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import enrollmentRanges from "@/app/stats/enrollmemt_range.json";
import studentCounts from "@/app/stats/student_count.json";
import {
	Placement,
	StudentWithPlacement,
	getStudentPackage,
} from "@/lib/stats";

// Flattened index of enrollment ranges -> branch
export const ENROLLMENT_BRANCH_RANGES: Array<{
	branch: string;
	start: number;
	end: number;
}> = buildBranchRangesFromJson(enrollmentRanges as any);

export const BRANCHES_LIMIT = 3;
export const COMPANIES_LIMIT = 6;
// Exclude these branches from all calculations and displays
const EXCLUDED_BRANCHES = new Set(["JUIT", "Other", "MTech"]);

export function useStatsData() {
	const {
		data,
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: ["placement-offers"],
		queryFn: async () => {
			const res = await fetch("/api/placement-offers", { cache: "no-store" });
			const json = await res.json();
			if (!json.ok) throw new Error(json.error || "Failed to load");
			return json.data as Placement[];
		},
	});

	const placements: Placement[] = useMemo(
		() => (Array.isArray(data) ? (data as any) : []),
		[data],
	);

	// Secret unlock state
	const [unlocked, setUnlocked] = useState<boolean>(() => {
		try {
			return typeof window !== "undefined" && !!localStorage.getItem("shh");
		} catch {
			return false;
		}
	});

	useEffect(() => {
		try {
			if (typeof window === "undefined") return;
			const params = new URLSearchParams(window.location.search);
			if (params.has("shh")) {
				try {
					localStorage.setItem("shh", "1");
				} catch {}
				setUnlocked(true);
				params.delete("shh");
				const newUrl = `${window.location.pathname}${
					params.toString() ? `?${params.toString()}` : ""
				}${window.location.hash || ""}`;
				window.history.replaceState({}, "", newUrl);
			}
		} catch {}
	}, []);

	// Flattened students (+ placement context)
	const allStudents: StudentWithPlacement[] = useMemo(
		() =>
			placements.flatMap((placement) =>
				placement.students_selected.map((student) => ({
					...student,
					company: placement.company,
					roles: placement.roles,
					joining_date: placement.joining_date || undefined,
					job_location: placement.job_location,
					placement,
				})),
			),
		[placements],
	);

	const includedStudents = useMemo(
		() =>
			allStudents.filter(
				(s) => !EXCLUDED_BRANCHES.has(getBranch(s.enrollment_number)),
			),
		[allStudents],
	);

	// Branch totals (for denominator) - exclude JUIT, Other, MTech
	const branchTotalCounts = useMemo(() => {
		const totals: Record<string, number> = {};
		try {
			Object.entries(studentCounts as any).forEach(([branch, counts]) => {
				if (EXCLUDED_BRANCHES.has(branch)) return;
				if (counts && typeof counts === "object") {
					const sum = Object.values(counts).reduce(
						(a: number, c: any) => a + Number(c || 0),
						0,
					);
					totals[branch] = sum;
				} else if (typeof counts === "number") {
					totals[branch] = counts;
				}
			});
		} catch {}
		return totals;
	}, []);

	return {
		placements,
		allStudents,
		includedStudents,
		branchTotalCounts,
		loading,
		unlocked,
		setUnlocked,
		EXCLUDED_BRANCHES,
		enrollmentRanges,
		studentCounts,
	};
}

// Helpers moved here so they can be exported
export function buildBranchRangesFromJson(
	json: any,
): Array<{ branch: string; start: number; end: number }> {
	const ranges: Array<{ branch: string; start: number; end: number }> = [];
	if (!json || typeof json !== "object") return ranges;
	Object.entries(json).forEach(([branch, data]) => {
		if (branch === "Intg. MTech" && data && typeof data === "object") {
			Object.values(data as any).forEach((sub: any) => {
				if (
					sub &&
					typeof sub.start === "number" &&
					typeof sub.end === "number"
				) {
					ranges.push({
						branch: "Intg. MTech",
						start: sub.start,
						end: sub.end,
					});
				}
			});
		} else if (data && typeof data === "object") {
			Object.values(data as any).forEach((entry: any) => {
				if (
					entry &&
					typeof entry.start === "number" &&
					typeof entry.end === "number"
				) {
					ranges.push({ branch, start: entry.start, end: entry.end });
				}
			});
		}
	});
	ranges.sort((a, b) => a.start - b.start);
	return ranges;
}

export function getBranch(enrollment: string): string {
	if (!enrollment) return "Other";
	const hasAlpha = /[A-Za-z]/.test(enrollment);
	const digits = (enrollment.match(/\d+/g) || []).join("");
	if (hasAlpha || digits.length === 9) return "JUIT";
	if (digits.startsWith("24")) return "MTech";
	if (!digits) return "Other";
	const num = Number(digits);
	if (!Number.isFinite(num)) return "Other";
	for (const r of ENROLLMENT_BRANCH_RANGES) {
		if (num >= r.start && num < r.end) return r.branch;
	}
	return "Other";
}
