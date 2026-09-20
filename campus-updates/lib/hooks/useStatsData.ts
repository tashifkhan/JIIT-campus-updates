import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePlacementYear } from "@/components/PlacementYearProvider";
import {
	getBranchRangesForYear,
	getBranchTotalsForYear,
	getEnrollmentRangesForYear,
	getExcludedBranchesForYear,
	getStudentCountsForYear,
	getTotalStudentsForYear,
	getBatchConfig,
} from "@/lib/batch-config";
import {
	Placement,
	StudentWithPlacement,
	getStudentPackage,
} from "@/lib/stats";

// Default-year flattened ranges (back-compat for existing imports).
// Year-aware callers should use getBranch(enrollment, year).
export const ENROLLMENT_BRANCH_RANGES = getBranchRangesForYear("202526");

export const BRANCHES_LIMIT = 3;
export const COMPANIES_LIMIT = 6;
// Default excluded branches; per-year value comes from getExcludedBranchesForYear(year).
const DEFAULT_EXCLUDED_BRANCHES = getExcludedBranchesForYear("202526");

const branchRangesCache = new Map<string, ReturnType<typeof getBranchRangesForYear>>();

function rangesForYear(year?: string | null) {
	const key = String(year || "202526");
	let cached = branchRangesCache.get(key);
	if (!cached) {
		cached = getBranchRangesForYear(key);
		branchRangesCache.set(key, cached);
	}
	return cached;
}

export function useStatsData() {
	const { year } = usePlacementYear();
	const {
		data,
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: ["placement-offers", year],
		queryFn: async () => {
			const res = await fetch(
				`/api/placement-offers?year=${encodeURIComponent(year)}`,
				{ cache: "no-store" },
			);
			const json = await res.json();
			if (!json.ok) throw new Error(json.error || "Failed to load");
			return json.data as Placement[];
		},
	});

	const placements: Placement[] = useMemo(
		() => (Array.isArray(data) ? (data as any) : []),
		[data],
	);

	const enrollmentRanges = useMemo(() => getEnrollmentRangesForYear(year), [year]);
	const studentCounts = useMemo(() => getStudentCountsForYear(year), [year]);
	const excludedBranches = useMemo(() => getExcludedBranchesForYear(year), [year]);
	const batchConfig = useMemo(() => getBatchConfig(year), [year]);
	const totalStudents = useMemo(() => getTotalStudentsForYear(year), [year]);

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
				(s) => !excludedBranches.has(getBranch(s.enrollment_number, year)),
			),
		[allStudents, excludedBranches, year],
	);

	// Branch totals (for denominator) — per placement year.
	const branchTotalCounts = useMemo(() => getBranchTotalsForYear(year), [year]);

	return {
		placements,
		allStudents,
		includedStudents,
		branchTotalCounts,
		loading,
		EXCLUDED_BRANCHES: excludedBranches,
		enrollmentRanges,
		studentCounts,
		batchConfig,
		totalStudents,
		year,
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

export function getBranch(enrollment: string, year?: string | null): string {
	if (!enrollment) return "Other";
	const hasAlpha = /[A-Za-z]/.test(enrollment);
	const digits = (enrollment.match(/\d+/g) || []).join("");
	if (hasAlpha || digits.length === 9) return "JUIT";
	if (digits.startsWith("24")) return "MTech";
	if (!digits) return "Other";
	const num = Number(digits);
	if (!Number.isFinite(num)) return "Other";
	const ranges = year ? rangesForYear(year) : ENROLLMENT_BRANCH_RANGES;
	for (const r of ranges) {
		if (num >= r.start && num < r.end) return r.branch;
	}
	return "Other";
}

// Re-export for callers that want the default-year set directly.
export { DEFAULT_EXCLUDED_BRANCHES as LEGACY_EXCLUDED_BRANCHES };
