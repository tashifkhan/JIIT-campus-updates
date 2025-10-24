"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import FiltersSheet from "@/components/stats/FiltersSheet";
import ExportCsvButton from "@/components/stats/ExportCsvButton";
import SummaryCards from "@/components/stats/SummaryCards";
import BranchSection from "@/components/stats/BranchSection";
import CompanySection from "@/components/stats/CompanySection";
import PlacedStudentsSection from "@/components/stats/PlacedStudentsSection";
import PlacementDistributionChart from "@/components/stats/PlacementDistributionChart";
import enrollmentRanges from "./enrollmemt_range.json";
import studentCounts from "./student_count.json";
import {
	Placement,
	StudentWithPlacement,
	getStudentPackage,
} from "@/lib/stats";

const BRANCHES_LIMIT = 3;
const COMPANIES_LIMIT = 6;
// Flattened index of enrollment ranges -> branch, built from JSON once
const ENROLLMENT_BRANCH_RANGES: Array<{
	branch: string;
	start: number;
	end: number;
}> = buildBranchRangesFromJson(enrollmentRanges as any);

export default function StatsPage() {
	const { data, isLoading: loading } = useQuery({
		queryKey: ["placement-offers"],
		queryFn: async () => {
			const res = await fetch("/api/placement-offers", { cache: "no-store" });
			const json = await res.json();
			if (!json.ok) throw new Error(json.error || "Failed to load");
			return json.data as Placement[];
		},
	});

	const placements: Placement[] = Array.isArray(data) ? (data as any) : [];

	// Filters
	// Secret unlock state (supports ?shh and hidden click unlock)
	const [unlocked, setUnlocked] = useState<boolean>(() => {
		try {
			return typeof window !== "undefined" && !!localStorage.getItem("shh");
		} catch {
			return false;
		}
	});
	const [secretClicks, setSecretClicks] = useState(0);

	useEffect(() => {
		// Support unlocking via ?shh query parameter and then clean it from the URL
		try {
			if (typeof window === "undefined") return;
			const params = new URLSearchParams(window.location.search);
			if (params.has("shh")) {
				try {
					localStorage.setItem("shh", "1");
				} catch {
					/* ignore */
				}
				setUnlocked(true);
				params.delete("shh");
				const newUrl = `${window.location.pathname}${
					params.toString() ? `?${params.toString()}` : ""
				}${window.location.hash || ""}`;
				window.history.replaceState({}, "", newUrl);
			}
		} catch {
			// ignore
		}
	}, []);

	const handleSecretClick = () => {
		setSecretClicks((c) => {
			const next = c + 1;
			if (next >= 7) {
				try {
					localStorage.setItem("shh", "1");
				} catch {
					/* ignore */
				}
				if (typeof window !== "undefined") window.location.reload();
			}
			return next;
		});
	};

	// If locked, show the service-unavailable / hidden page
	if (!unlocked) {
		return (
			<>
				<main
					role="main"
					className="min-h-screen flex items-center justify-center font-sans"
				>
					<div className="p-8 md:p-10 rounded-[14px] border border-black/10 dark:border-white/10 shadow-[0_2px_24px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900">
						<h1 className="m-0 mb-2 text-2xl md:text-3xl">
							Service unavailable Permanently
						</h1>
						<p className="m-0 mb-1 text-base opacity-80">
							This site will not be accessible.
						</p>
						<p className="m-0 text-sm opacity-70">
							As per the instructions of the{" "}
							<span onClick={handleSecretClick}>JIIT</span> Administration.
						</p>
					</div>
				</main>
			</>
		);
	}

	// Filters
	const [showFilters, setShowFilters] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [packageRange, setPackageRange] = useState<[number, number]>([0, 100]);

	// Filter options
	const availableCompanies = useMemo(
		() => Array.from(new Set(placements.map((p) => p.company))).sort(),
		[placements]
	);
	const availableRoles = useMemo(
		() =>
			Array.from(
				new Set(
					placements.flatMap(
						(p) => p.roles?.map((r) => r.role).filter(Boolean) || []
					)
				)
			).sort(),
		[placements]
	);
	const availableLocations = useMemo(
		() =>
			Array.from(
				new Set(
					placements
						.flatMap((p) => p.job_location || [])
						.filter(Boolean) as string[]
				)
			).sort(),
		[placements]
	);

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
				}))
			),
		[placements]
	);

	const hasActiveFilters =
		searchQuery !== "" ||
		selectedCompanies.length > 0 ||
		selectedRoles.length > 0 ||
		selectedLocations.length > 0 ||
		packageRange[0] !== 0 ||
		packageRange[1] !== 100;

	const filteredStudents: StudentWithPlacement[] = useMemo(() => {
		return allStudents.filter((student) => {
			const plc = student.placement;

			// search
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				const ok =
					(student.name || "").toLowerCase().includes(q) ||
					(student.enrollment_number || "").toLowerCase().includes(q) ||
					(student.role || "").toLowerCase().includes(q) ||
					(student.company || "").toLowerCase().includes(q);
				if (!ok) return false;
			}

			if (
				selectedCompanies.length &&
				!selectedCompanies.includes(student.company)
			)
				return false;

			if (selectedRoles.length && !selectedRoles.includes(student.role))
				return false;

			if (
				selectedLocations.length &&
				!selectedLocations.some((loc) => (plc.job_location || []).includes(loc))
			)
				return false;

			const pkg = getStudentPackage(student, plc);
			if (pkg != null) {
				if (pkg < packageRange[0] || pkg > packageRange[1]) return false;
			}
			return true;
		});
	}, [
		allStudents,
		searchQuery,
		selectedCompanies,
		selectedRoles,
		selectedLocations,
		packageRange,
	]);

	// Overall stats
	const totalStudentsPlaced = allStudents.length;
	const uniqueCompanies = useMemo(
		() => new Set(allStudents.map((s) => s.company)).size,
		[allStudents]
	);
	// Exclude these branches when computing average/median package
	const EXCLUDED_BRANCHES = new Set(["JUIT", "Other", "MTech"]);
	const allPackages = useMemo(() => {
		const pkgs: number[] = [];
		allStudents.forEach((s) => {
			const branch = getBranch(s.enrollment_number);
			// skip excluded branches (JUIT, Other, MTech)
			if (EXCLUDED_BRANCHES.has(branch)) return;
			const v = getStudentPackage(s, s.placement);
			if (v != null && v > 0) pkgs.push(v);
		});
		return pkgs;
	}, [allStudents]);
	const averagePackage = allPackages.length
		? allPackages.reduce((a, c) => a + c, 0) / allPackages.length
		: 0;
	const highestPackage = allPackages.length ? Math.max(...allPackages) : 0;
	const medianPackage = (() => {
		if (!allPackages.length) return 0;
		const s = [...allPackages].sort((a, b) => a - b);
		return s.length % 2
			? s[(s.length - 1) >> 1]
			: (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
	})();

	// Filtered stats
	const filteredPackages = useMemo(() => {
		const pkgs: number[] = [];
		filteredStudents.forEach((s) => {
			const branch = getBranch(s.enrollment_number);
			if (EXCLUDED_BRANCHES.has(branch)) return;
			const v = getStudentPackage(s, s.placement);
			if (v != null && v > 0) pkgs.push(v);
		});
		return pkgs;
	}, [filteredStudents]);
	const filteredAveragePackage = filteredPackages.length
		? filteredPackages.reduce((a, c) => a + c, 0) / filteredPackages.length
		: 0;
	const filteredHighestPackage = filteredPackages.length
		? Math.max(...filteredPackages)
		: 0;
	const filteredMedianPackage = (() => {
		if (!filteredPackages.length) return 0;
		const s = [...filteredPackages].sort((a, b) => a - b);
		return s.length % 2
			? s[(s.length - 1) >> 1]
			: (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
	})();
	const filteredUniqueCompanies = useMemo(
		() => new Set(filteredStudents.map((s) => s.company)).size,
		[filteredStudents]
	);

	// Company stats
	const companyStats = useMemo(() => {
		const acc: Record<
			string,
			{
				profiles: Set<string>;
				packages: number[];
				studentsCount: number;
				avgPackage: number;
			}
		> = {};
		allStudents.forEach((s) => {
			const name = s.company;
			if (!acc[name])
				acc[name] = {
					profiles: new Set(),
					packages: [],
					studentsCount: 0,
					avgPackage: 0,
				};
			acc[name].studentsCount += 1;
			s.roles?.forEach((r) => acc[name].profiles.add(r.role));
			const v = getStudentPackage(s, s.placement);
			if (v != null && v > 0) acc[name].packages.push(v);
		});
		Object.keys(acc).forEach((k) => {
			const pkgs = acc[k].packages;
			acc[k].avgPackage = pkgs.length
				? pkgs.reduce((a, c) => a + c, 0) / pkgs.length
				: 0;
		});
		return acc as any;
	}, [allStudents]);

	const filteredCompanyStats = useMemo(() => {
		const acc: Record<
			string,
			{
				profiles: Set<string>;
				packages: number[];
				studentsCount: number;
				avgPackage: number;
			}
		> = {};
		filteredStudents.forEach((s) => {
			const name = s.company;
			if (!acc[name])
				acc[name] = {
					profiles: new Set(),
					packages: [],
					studentsCount: 0,
					avgPackage: 0,
				};
			acc[name].studentsCount += 1;
			s.roles?.forEach((r) => acc[name].profiles.add(r.role));
			const v = getStudentPackage(s, s.placement);
			if (v != null && v > 0) acc[name].packages.push(v);
		});
		Object.keys(acc).forEach((k) => {
			const pkgs = acc[k].packages;
			acc[k].avgPackage = pkgs.length
				? pkgs.reduce((a, c) => a + c, 0) / pkgs.length
				: 0;
		});
		return acc as any;
	}, [filteredStudents]);

	// Branch statistics
	const branchStats = useMemo(() => {
		const acc: Record<
			string,
			{
				count: number;
				packages: number[];
				avgPackage: number;
				highest: number;
				median: number;
			}
		> = {};
		filteredStudents.forEach((s) => {
			const b = getBranch(s.enrollment_number);
			if (!acc[b])
				acc[b] = {
					count: 0,
					packages: [],
					avgPackage: 0,
					highest: 0,
					median: 0,
				};
			acc[b].count += 1;
			const v = getStudentPackage(s, s.placement);
			if (v != null && v > 0) acc[b].packages.push(v);
		});
		Object.keys(acc).forEach((b) => {
			const pkgs = acc[b].packages;
			acc[b].avgPackage = pkgs.length
				? pkgs.reduce((a, c) => a + c, 0) / pkgs.length
				: 0;
			acc[b].highest = pkgs.length ? Math.max(...pkgs) : 0;
			const s = [...pkgs].sort((a, c) => a - c);
			acc[b].median = s.length
				? s.length % 2
					? s[(s.length - 1) >> 1]
					: (s[s.length / 2 - 1] + s[s.length / 2]) / 2
				: 0;
		});
		return acc;
	}, [filteredStudents]);

	// Branch totals (for denominator)
	const branchTotalCounts = useMemo(() => {
		const totals: Record<string, number> = {};
		try {
			Object.entries(studentCounts as any).forEach(([branch, counts]) => {
				if (counts && typeof counts === "object") {
					const sum = Object.values(counts).reduce(
						(a: number, c: any) => a + Number(c || 0),
						0
					);
					totals[branch] = sum;
				} else if (typeof counts === "number") {
					totals[branch] = counts;
				}
			});
		} catch {}
		return totals;
	}, []);
	const branchesWithTotals = useMemo(
		() => new Set(Object.keys(branchTotalCounts)),
		[branchTotalCounts]
	);
	const overallTotalStudentsExclJUIT = useMemo(
		() => Object.values(branchTotalCounts).reduce((a, c) => a + c, 0),
		[branchTotalCounts]
	);
	const totalPlacedInCountedBranches = useMemo(() => {
		return placements.reduce((sum, p) => {
			const inc = p.students_selected.filter((s) =>
				branchesWithTotals.has(getBranch(s.enrollment_number))
			).length;
			return sum + inc;
		}, 0);
	}, [placements, branchesWithTotals]);
	const filteredPlacedInCountedBranches = useMemo(
		() =>
			filteredStudents.filter((s) =>
				branchesWithTotals.has(getBranch(s.enrollment_number))
			).length,
		[filteredStudents, branchesWithTotals]
	);
	const overallPlacementPct = overallTotalStudentsExclJUIT
		? (totalPlacedInCountedBranches / overallTotalStudentsExclJUIT) * 100
		: 0;
	const filteredOverallPlacementPct = overallTotalStudentsExclJUIT
		? (filteredPlacedInCountedBranches / overallTotalStudentsExclJUIT) * 100
		: 0;

	// Helpers
	const sortStudentsList = (students: StudentWithPlacement[]) =>
		[...students].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
	const getCompanyStudents = (companyName: string) => {
		const base = hasActiveFilters ? filteredStudents : allStudents;
		return sortStudentsList(base.filter((s) => s.company === companyName));
	};
	const getBranchStudents = (branchName: string) => {
		const base = hasActiveFilters ? filteredStudents : allStudents;
		return sortStudentsList(
			base.filter((s) => getBranch(s.enrollment_number) === branchName)
		);
	};

	const exportToCSV = () => {
		const rows: string[][] = [];
		rows.push([
			"Student Name",
			"Enrollment Number",
			"Email",
			"Company",
			"Role",
			"Package",
			"Job Location",
			"Joining Date",
		]);
		filteredStudents.forEach((student) => {
			const v = getStudentPackage(student, student.placement);
			rows.push([
				student.name,
				student.enrollment_number,
				student.email ||
					`${student.enrollment_number}@${
						/[A-Za-z]/.test(student.enrollment_number || "")
							? "mail.juit.ac.in"
							: "mail.jiit.ac.in"
					}`,
				student.company,
				student.role || "N/A",
				v ? `₹${v.toFixed(1)} LPA` : "TBD",
				student.job_location?.join(", ") || "N/A",
				student.joining_date || "TBD",
			]);
		});
		const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `placement_statistics_${
			new Date().toISOString().split("T")[0]
		}.csv`;
		link.click();
	};

	if (loading) {
		return (
			<Layout>
				<div className="max-w-7xl mx-auto space-y-8">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
						{[...Array(4)].map((_, i) => (
							<Card key={i} className="animate-pulse card-theme">
								<CardContent className="p-6">
									<div
										className="h-8 rounded mb-2"
										style={{ backgroundColor: "var(--primary-color)" }}
									/>
									<div
										className="h-4 rounded w-1/2"
										style={{ backgroundColor: "var(--primary-color)" }}
									/>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</Layout>
		);
	}

	const sourceCompanyStats = hasActiveFilters
		? filteredCompanyStats
		: companyStats;
	const companyEntries = Object.entries(sourceCompanyStats).sort(([a], [b]) =>
		a.localeCompare(b)
	);

	const clearFilters = () => {
		setSearchQuery("");
		setSelectedCompanies([]);
		setSelectedRoles([]);
		setSelectedLocations([]);
		setPackageRange([0, 100]);
	};

	return (
		<Layout>
			<div className="max-w-7xl mx-auto space-y-8">
				<div className="text-center mb-8">
					<div className="text-center sm:text-left">
						<h1
							className="text-2xl text-center lg:text-3xl font-bold mb-2"
							style={{ color: "var(--text-color)" }}
						>
							Placement Statistics
						</h1>
						<p className="text-center" style={{ color: "var(--label-color)" }}>
							Campus placement data and analytics
						</p>
					</div>
				</div>

				{/* Filters */}
				<FiltersSheet
					open={showFilters}
					onOpenChange={setShowFilters}
					hasActiveFilters={hasActiveFilters}
					totals={{
						students: filteredStudents.length,
						totalStudents: totalStudentsPlaced,
						companies: filteredUniqueCompanies,
						totalCompanies: uniqueCompanies,
					}}
					options={{
						companies: availableCompanies,
						roles: availableRoles,
						locations: availableLocations as string[],
					}}
					state={{
						searchQuery,
						selectedCompanies,
						selectedRoles,
						selectedLocations,
						packageRange,
					}}
					setState={(next) => {
						if (next.searchQuery !== undefined)
							setSearchQuery(next.searchQuery);
						if (next.selectedCompanies !== undefined)
							setSelectedCompanies(next.selectedCompanies);
						if (next.selectedRoles !== undefined)
							setSelectedRoles(next.selectedRoles);
						if (next.selectedLocations !== undefined)
							setSelectedLocations(next.selectedLocations);
						if (next.packageRange !== undefined)
							setPackageRange(next.packageRange);
					}}
					clearFilters={clearFilters}
				/>

				{/* Export CSV */}
				<ExportCsvButton onClick={exportToCSV} />

				{/* Summary cards */}
				<SummaryCards
					placement={{
						placed: filteredPlacedInCountedBranches,
						total: overallTotalStudentsExclJUIT,
						pct: filteredOverallPlacementPct,
						overallPct: overallPlacementPct,
					}}
					packages={{
						avg: filteredAveragePackage,
						median: filteredMedianPackage,
						highest: filteredHighestPackage,
						overallAvg: averagePackage,
						overallMedian: medianPackage,
						overallHighest: highestPackage,
					}}
					companies={{
						filtered: filteredUniqueCompanies,
						total: uniqueCompanies,
					}}
				/>

				{/* Branches */}
				<BranchSection
					BRANCHES_LIMIT={BRANCHES_LIMIT}
					branchStats={branchStats as any}
					branchTotalCounts={branchTotalCounts}
					getBranchStudents={getBranchStudents}
					enrollmentRanges={enrollmentRanges}
					studentCounts={studentCounts}
					placements={placements}
				/>

				{/* Placement Distribution Chart */}
				<PlacementDistributionChart
					students={filteredStudents}
					getBranch={getBranch}
				/>

				{/* Companies */}
				<CompanySection
					COMPANIES_LIMIT={COMPANIES_LIMIT}
					companyEntries={companyEntries as any}
					filteredUniqueCompanies={filteredUniqueCompanies}
					uniqueCompanies={uniqueCompanies}
					hasActiveFilters={hasActiveFilters}
					placements={placements}
					getCompanyStudents={getCompanyStudents}
					getCompanyFallbackPackage={(company) => {
						const plc = placements.find((p) => p.company === company);
						if (!plc) return 0;
						const viable = plc.roles.filter((r) => r.package != null);
						return viable.length
							? Math.max(...viable.map((r) => r.package as number))
							: 0;
					}}
				/>

				{/* Placed students */}
				<PlacedStudentsSection
					filteredStudents={filteredStudents}
					totalStudentsPlaced={totalStudentsPlaced}
					filteredHighestPackage={filteredHighestPackage}
					highestPackage={highestPackage}
					filteredAveragePackage={filteredAveragePackage}
					averagePackage={averagePackage}
					filteredUniqueCompanies={filteredUniqueCompanies}
					uniqueCompanies={uniqueCompanies}
				/>
			</div>
		</Layout>
	);
}

// Build branch ranges index from JSON
function buildBranchRangesFromJson(
	json: any
): Array<{ branch: string; start: number; end: number }> {
	const ranges: Array<{ branch: string; start: number; end: number }> = [];
	if (!json || typeof json !== "object") return ranges;
	Object.entries(json).forEach(([branch, data]) => {
		if (branch === "Intg. MTech" && data && typeof data === "object") {
			// Intg. MTech nested per sub-branch
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
			// Regular branches with batch keys (e.g., "62", "128")
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
	// Sort by start asc for early exit
	ranges.sort((a, b) => a.start - b.start);
	return ranges;
}

// Branch resolver based on enrollment number falling within known ranges
function getBranch(enrollment: string): string {
	if (!enrollment) return "Other";
	const hasAlpha = /[A-Za-z]/.test(enrollment);
	const digits = (enrollment.match(/\d+/g) || []).join("");
	// JUIT rule: alpha present or 9-digit numeric id
	if (hasAlpha || digits.length === 9) return "JUIT";
	// MTech rule: first two digits are 24
	if (digits.startsWith("24")) return "MTech";
	if (!digits) return "Other";
	const num = Number(digits);
	if (!Number.isFinite(num)) return "Other";
	// Match against configured ranges (including Intg. MTech and others)
	for (const r of ENROLLMENT_BRANCH_RANGES) {
		if (num >= r.start && num < r.end) return r.branch;
	}
	return "Other";
}
