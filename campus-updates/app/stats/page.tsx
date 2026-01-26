"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import SummaryCards from "@/components/stats/SummaryCards";
import BranchSection from "@/components/stats/BranchSection";
import CompanySection from "@/components/stats/CompanySection";
import PlacementDistributionChart from "@/components/stats/PlacementDistributionChart";
import PlacementTimeline from "@/components/stats/PlacementTimeline";
import OfficialPlacements from "@/components/stats/OfficialPlacements";
import ExpandingSearch from "@/components/stats/ExpandingSearch";
import { StudentWithPlacement, getStudentPackage } from "@/lib/stats";
import {
	useStatsData,
	getBranch,
	BRANCHES_LIMIT,
	COMPANIES_LIMIT,
} from "@/lib/hooks/useStatsData";

export default function StatsPage() {
	const {
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
	} = useStatsData();

	// Filters - must be before any conditional returns (React hooks rules)
	const [searchQuery, setSearchQuery] = useState("");
	const [secretClicks, setSecretClicks] = useState(0);

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

	const hasActiveFilters = searchQuery !== "";

	const filteredStudents: StudentWithPlacement[] = useMemo(() => {
		return includedStudents.filter((student) => {
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
			return true;
		});
	}, [includedStudents, searchQuery]);

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
		[allStudents],
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
		[filteredStudents],
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

	const branchesWithTotals = useMemo(
		() => new Set(Object.keys(branchTotalCounts)),
		[branchTotalCounts],
	);
	const overallTotalStudentsExclJUIT = useMemo(
		() => Object.values(branchTotalCounts).reduce((a, c) => a + c, 0),
		[branchTotalCounts],
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
			base.filter((s) => getBranch(s.enrollment_number) === branchName),
		);
	};

	const sourceCompanyStats = hasActiveFilters
		? filteredCompanyStats
		: companyStats;
	const companyEntries = Object.entries(sourceCompanyStats).sort(([a], [b]) =>
		a.localeCompare(b),
	);

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

			{/* Filter Search */}
			<ExpandingSearch
				value={searchQuery}
				onChange={setSearchQuery}
				placeholder="Search students, companies, roles..."
			/>

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
		</div>
	);
}
