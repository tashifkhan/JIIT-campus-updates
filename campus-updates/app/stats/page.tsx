"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import FiltersSheet from "@/components/stats/FiltersSheet";
import ExportCsvButton from "@/components/stats/ExportCsvButton";
import SummaryCards from "@/components/stats/SummaryCards";
import BranchSection from "@/components/stats/BranchSection";
import CompanySection from "@/components/stats/CompanySection";
// import PlacedStudentsSection from "@/components/stats/PlacedStudentsSection";
import PlacementDistributionChart from "@/components/stats/PlacementDistributionChart";
import PlacementTimeline from "@/components/stats/PlacementTimeline";
import OfficialPlacements from "@/components/stats/OfficialPlacements";
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

	const placements: Placement[] = useMemo(
		() => (Array.isArray(data) ? (data as any) : []),
		[data]
	);

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

	// Filters - must be before any conditional returns (React hooks rules)
	const [showFilters, setShowFilters] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [packageRange, setPackageRange] = useState<[number, number]>([0, 100]);

	// Exclude these branches from all calculations and displays
	const EXCLUDED_BRANCHES = useMemo(
		() => new Set(["JUIT", "Other", "MTech"]),
		[]
	);

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

	// Filter out excluded branches from all students
	const includedStudents = useMemo(
		() =>
			allStudents.filter(
				(s) => !EXCLUDED_BRANCHES.has(getBranch(s.enrollment_number))
			),
		[allStudents, EXCLUDED_BRANCHES]
	);

	const hasActiveFilters =
		searchQuery !== "" ||
		selectedCompanies.length > 0 ||
		selectedRoles.length > 0 ||
		selectedLocations.length > 0 ||
		packageRange[0] !== 0 ||
		packageRange[1] !== 100;

	const filteredStudents: StudentWithPlacement[] = useMemo(() => {
		return includedStudents.filter((student) => {
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
		includedStudents,
		searchQuery,
		selectedCompanies,
		selectedRoles,
		selectedLocations,
		packageRange,
	]);

	// Overall stats (excluding JUIT, Other, MTech)
	// Track unique students (by enrollment number) and total offers
	const uniqueStudentsPlaced = useMemo(() => {
		const uniqueEnrollments = new Set<string>();
		includedStudents.forEach((s) => {
			if (s.enrollment_number) {
				uniqueEnrollments.add(s.enrollment_number);
			}
		});
		return uniqueEnrollments.size;
	}, [includedStudents]);

	const totalOffers = includedStudents.length; // Total number of offers (including multiple offers per student)
	const totalStudentsPlaced = uniqueStudentsPlaced; // For backward compatibility

	const uniqueCompanies = useMemo(
		() => new Set(allStudents.map((s) => s.company)).size,
		[allStudents]
	);

	const allPackages = useMemo(() => {
		const pkgs: number[] = [];
		const studentMaxPackages: Map<string, number> = new Map();

		// Track highest package per unique student
		includedStudents.forEach((s) => {
			if (!s.enrollment_number) return;
			const v = getStudentPackage(s, s.placement);
			if (v != null && v > 0) {
				const currentMax = studentMaxPackages.get(s.enrollment_number) || 0;
				if (v > currentMax) {
					studentMaxPackages.set(s.enrollment_number, v);
				}
			}
		});

		// Convert to array for calculations
		studentMaxPackages.forEach((pkg) => pkgs.push(pkg));
		return pkgs;
	}, [includedStudents]);
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

	// Filtered stats (already filtered to exclude JUIT, Other, MTech via filteredStudents)
	const filteredUniqueStudentsPlaced = useMemo(() => {
		const uniqueEnrollments = new Set<string>();
		filteredStudents.forEach((s) => {
			if (s.enrollment_number) {
				uniqueEnrollments.add(s.enrollment_number);
			}
		});
		return uniqueEnrollments.size;
	}, [filteredStudents]);

	const filteredTotalOffers = filteredStudents.length;

	const filteredPackages = useMemo(() => {
		const pkgs: number[] = [];
		const studentMaxPackages: Map<string, number> = new Map();

		// Track highest package per unique student
		filteredStudents.forEach((s) => {
			if (!s.enrollment_number) return;
			const v = getStudentPackage(s, s.placement);
			if (v != null && v > 0) {
				const currentMax = studentMaxPackages.get(s.enrollment_number) || 0;
				if (v > currentMax) {
					studentMaxPackages.set(s.enrollment_number, v);
				}
			}
		});

		// Convert to array for calculations
		studentMaxPackages.forEach((pkg) => pkgs.push(pkg));
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

	// Company stats (using ALL students including JUIT, Other, MTech)
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
				uniqueCount: number;
				packages: number[];
				avgPackage: number;
				highest: number;
				median: number;
			}
		> = {};

		// Track unique enrollments per branch and their highest packages
		const branchEnrollments: Record<string, Set<string>> = {};
		const branchStudentMaxPackages: Record<string, Map<string, number>> = {};

		filteredStudents.forEach((s) => {
			const b = getBranch(s.enrollment_number);
			if (!acc[b])
				acc[b] = {
					count: 0,
					uniqueCount: 0,
					packages: [],
					avgPackage: 0,
					highest: 0,
					median: 0,
				};
			if (!branchEnrollments[b]) {
				branchEnrollments[b] = new Set();
			}
			if (!branchStudentMaxPackages[b]) {
				branchStudentMaxPackages[b] = new Map();
			}

			acc[b].count += 1; // Total offers
			if (s.enrollment_number) {
				branchEnrollments[b].add(s.enrollment_number);

				// Track highest package per student in this branch
				const v = getStudentPackage(s, s.placement);
				if (v != null && v > 0) {
					const currentMax =
						branchStudentMaxPackages[b].get(s.enrollment_number) || 0;
					if (v > currentMax) {
						branchStudentMaxPackages[b].set(s.enrollment_number, v);
					}
				}
			}
		});

		// Calculate statistics using unique students' highest packages
		Object.keys(acc).forEach((b) => {
			acc[b].uniqueCount = branchEnrollments[b]?.size || 0;

			// Get all max packages for unique students in this branch
			const pkgs: number[] = [];
			branchStudentMaxPackages[b]?.forEach((pkg) => pkgs.push(pkg));

			acc[b].packages = pkgs;
			acc[b].avgPackage = pkgs.length
				? pkgs.reduce((a, c) => a + c, 0) / pkgs.length
				: 0;
			acc[b].highest = pkgs.length ? Math.max(...pkgs) : 0;
			const sortedPkgs = [...pkgs].sort((a, c) => a - c);
			acc[b].median = sortedPkgs.length
				? sortedPkgs.length % 2
					? sortedPkgs[(sortedPkgs.length - 1) >> 1]
					: (sortedPkgs[sortedPkgs.length / 2 - 1] +
							sortedPkgs[sortedPkgs.length / 2]) /
					  2
				: 0;
		});
		return acc;
	}, [filteredStudents]);

	// Branch totals (for denominator) - exclude JUIT, Other, MTech
	const branchTotalCounts = useMemo(() => {
		const totals: Record<string, number> = {};
		try {
			Object.entries(studentCounts as any).forEach(([branch, counts]) => {
				// Skip excluded branches
				if (EXCLUDED_BRANCHES.has(branch)) return;

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
		} catch {
			/* ignore */
		}
		return totals;
	}, [EXCLUDED_BRANCHES]);
	const branchesWithTotals = useMemo(
		() => new Set(Object.keys(branchTotalCounts)),
		[branchTotalCounts]
	);
	const overallTotalStudentsExclJUIT = useMemo(
		() => Object.values(branchTotalCounts).reduce((a, c) => a + c, 0),
		[branchTotalCounts]
	);
	const totalPlacedInCountedBranches = useMemo(() => {
		const uniqueEnrollments = new Set<string>();
		placements.forEach((p) => {
			p.students_selected.forEach((s) => {
				const branch = getBranch(s.enrollment_number);
				if (
					branchesWithTotals.has(branch) &&
					!EXCLUDED_BRANCHES.has(branch) &&
					s.enrollment_number
				) {
					uniqueEnrollments.add(s.enrollment_number);
				}
			});
		});
		return uniqueEnrollments.size;
	}, [placements, branchesWithTotals, EXCLUDED_BRANCHES]);

	const filteredPlacedInCountedBranches = useMemo(() => {
		const uniqueEnrollments = new Set<string>();
		filteredStudents.forEach((s) => {
			if (
				branchesWithTotals.has(getBranch(s.enrollment_number)) &&
				s.enrollment_number
			) {
				uniqueEnrollments.add(s.enrollment_number);
			}
		});
		return uniqueEnrollments.size;
	}, [filteredStudents, branchesWithTotals]);
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
		const base = hasActiveFilters ? filteredStudents : includedStudents;
		return sortStudentsList(
			base.filter((s) => getBranch(s.enrollment_number) === branchName)
		);
	};

	const exportToCSV = () => {
		const rows: string[][] = [];
		rows.push([
			"Student Name",
			"Enrollment Number",
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

	// If locked, show the service-unavailable / hidden page
	if (!unlocked) {
		return (
			<>
				<main
					role="main"
					className="min-h-screen flex items-center justify-center font-sans"
				>
					<div className="p-8 md:p-10 rounded-[14px] border border-border shadow-[0_2px_24px_rgba(0,0,0,0.06)] bg-card">
						<h1 className="m-0 mb-2 text-2xl md:text-3xl text-foreground">
							Service unavailable Permanently
						</h1>
						<p className="m-0 mb-1 text-base text-muted-foreground">
							This site will not be accessible.
						</p>
						<p className="m-0 text-sm opacity-70 text-muted-foreground">
							As per the instructions of the{" "}
							<span onClick={handleSecretClick} className="cursor-pointer">
								JIIT
							</span>{" "}
							Administration.
						</p>
					</div>
				</main>
			</>
		);
	}

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto space-y-8">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
					{[...Array(4)].map((_, i) => (
						<Card key={i} className="animate-pulse card-theme">
							<CardContent className="p-6">
								<div className="h-8 rounded mb-2 bg-primary" />
								<div className="h-4 rounded w-1/2 bg-primary" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto space-y-8">
			<div className="text-center mb-8">
				<div className="text-center sm:text-left">
					<h1 className="text-2xl text-center lg:text-3xl font-bold mb-2 text-foreground">
						Placement Statistics
					</h1>
					<p className="text-center text-muted-foreground">
						Campus placement data and analytics
					</p>
				</div>
			</div>

			{/* Official placement data banner */}
			<OfficialPlacements />
			{/* End official placement data banner */}

			{/* Divider between official and unofficial data */}
			<div className="relative my-8">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-border"></div>
				</div>
				<div className="relative flex justify-center text-sm">
					<span className="px-4 py-2 bg-card text-muted-foreground font-medium rounded-lg border border-border">
						Unofficial Data (May contain errors)
					</span>
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
					if (next.searchQuery !== undefined) setSearchQuery(next.searchQuery);
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
				offers={{
					filteredUniqueStudents: filteredUniqueStudentsPlaced,
					totalUniqueStudents: uniqueStudentsPlaced,
					filteredTotalOffers: filteredTotalOffers,
					totalOffers: totalOffers,
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

			{/* Placement Timeline */}
			<PlacementTimeline
				placements={
					hasActiveFilters
						? Array.from(new Set(filteredStudents.map((s) => s.placement)))
						: placements
				}
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
			{/*<PlacedStudentsSection
				filteredStudents={hasActiveFilters ? filteredStudents : allStudents}
				totalStudentsPlaced={allStudents.length}
				filteredHighestPackage={filteredHighestPackage}
				highestPackage={highestPackage}
				filteredAveragePackage={filteredAveragePackage}
				averagePackage={averagePackage}
				filteredUniqueCompanies={filteredUniqueCompanies}
				uniqueCompanies={uniqueCompanies}
			/> */}
		</div>
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
