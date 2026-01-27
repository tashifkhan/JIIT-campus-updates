"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStatsData, getBranch } from "@/lib/hooks/useStatsData";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Users,
	ArrowLeftIcon,
	Target,
	IndianRupee,
	TrendingUp,
	Trophy,
	Search,
	ArrowUp,
	ArrowDown,
	ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Placement,
	formatPackage,
	formatPercent,
	StudentWithPlacement,
	getStudentPackage,
} from "@/lib/stats";
import React from "react";

// Reusing helper function for calculating package
const pkgFrom = (s: StudentWithPlacement, p: Placement) => {
	// If the student has a specific package override, use it
	if (s.package != null) return s.package;
	// Otherwise look for role match
	if (s.role && p.roles) {
		const r = p.roles.find((x) => x.role === s.role);
		if (r && r.package) return r.package;
	}
	// Fallback to highest package in the placement
	const viable = p.roles?.filter((r) => r.package != null) || [];
	return viable.length
		? Math.max(...viable.map((r) => r.package as number))
		: 0;
};

export default function BranchStatsPage({
	params,
}: {
	params: Promise<{ branch: string }>;
}) {
	const { branch } = React.use(params);
	const decodedBranch = decodeURIComponent(branch);
	const router = useRouter();

	const {
		placements,
		includedStudents,
		branchTotalCounts,
		enrollmentRanges,
		studentCounts,
	} = useStatsData();

	// We essentially need to replicate the calculation for a single branch from BranchSection
	const getBranchStudents = (branchName: string) => {
		// Use includedStudents (filtered) or allStudents? Use included for consistency
		return includedStudents
			.filter((s) => getBranch(s.enrollment_number) === branchName)
			.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
	};

	const students = getBranchStudents(decodedBranch);

	// Calculate Stats
	const uniqueEnrollments = new Set<string>();
	const studentMaxPackages: Map<string, number> = new Map();
	let totalOffers = 0;

	students.forEach((s) => {
		totalOffers++;
		if (s.enrollment_number) {
			uniqueEnrollments.add(s.enrollment_number);
			const v = getStudentPackage(s, s.placement);
			if (v != null && v > 0) {
				const currentMax = studentMaxPackages.get(s.enrollment_number) || 0;
				if (v > currentMax) {
					studentMaxPackages.set(s.enrollment_number, v);
				}
			}
		}
	});

	const uniqueCount = uniqueEnrollments.size;
	const totalForBranch = branchTotalCounts[decodedBranch] || 0;
	const pct = totalForBranch > 0 ? (uniqueCount / totalForBranch) * 100 : null;

	const pkgs: number[] = [];
	studentMaxPackages.forEach((pkg) => pkgs.push(pkg));

	const avgPackage = pkgs.length
		? pkgs.reduce((a, c) => a + c, 0) / pkgs.length
		: 0;
	const highest = pkgs.length ? Math.max(...pkgs) : 0;

	const sortedPkgs = [...pkgs].sort((a, c) => a - c);
	const median = sortedPkgs.length
		? sortedPkgs.length % 2
			? sortedPkgs[(sortedPkgs.length - 1) >> 1]
			: (sortedPkgs[sortedPkgs.length / 2 - 1] +
					sortedPkgs[sortedPkgs.length / 2]) /
				2
		: 0;

	const stats = {
		count: totalOffers,
		uniqueCount,
		avgPackage,
		median,
		highest,
	};

	// Local state for list
	const [query, setQuery] = useState("");
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	} | null>(null);

	const handleSort = (key: string) => {
		let direction: "asc" | "desc" = "asc";
		if (
			sortConfig &&
			sortConfig.key === key &&
			sortConfig.direction === "asc"
		) {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const filteredList = (() => {
		let displayedStudents = students;

		if (query) {
			const q = query.toLowerCase();
			displayedStudents = displayedStudents.filter(
				(s) =>
					s.name.toLowerCase().includes(q) ||
					(s.enrollment_number || "").toLowerCase().includes(q) ||
					s.company.toLowerCase().includes(q) ||
					(s.role || "").toLowerCase().includes(q),
			);
		}
		if (sortConfig) {
			displayedStudents = [...displayedStudents].sort((a, b) => {
				if (sortConfig.key === "package") {
					const plcA =
						a.placement ||
						(placements.find((p) => p.company === a.company) as Placement);
					const pkgA = plcA ? pkgFrom(a, plcA) : 0;

					const plcB =
						b.placement ||
						(placements.find((p) => p.company === b.company) as Placement);
					const pkgB = plcB ? pkgFrom(b, plcB) : 0;

					return sortConfig.direction === "asc"
						? (pkgA || 0) - (pkgB || 0)
						: (pkgB || 0) - (pkgA || 0);
				}

				const valA = (a as any)[sortConfig.key] || "";
				const valB = (b as any)[sortConfig.key] || "";
				return sortConfig.direction === "asc"
					? String(valA).localeCompare(String(valB))
					: String(valB).localeCompare(String(valA));
			});
		}
		return displayedStudents;
	})();

	return (
		<div className="min-h-screen bg-background pb-12">
			{/* Top Navigation */}
			<div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
				<div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
					<Button
						variant="ghost"
						onClick={() => router.back()}
						className="hover:bg-accent/50 -ml-2"
					>
						<ArrowLeftIcon className="w-5 h-5 mr-2 text-muted-foreground" />
						<span className="text-muted-foreground font-medium">Back</span>
					</Button>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 pt-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold flex items-center gap-3 text-foreground mb-4">
						{decodedBranch} Analytics
					</h1>

					{/* Stats Cards */}
					<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
						<div className="border rounded-xl p-5 card-theme bg-card border-border flex flex-col justify-between">
							<div>
								<p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
									<Target className="w-3.5 h-3.5" /> Placement Rate
								</p>
								<div className="mt-2 text-2xl md:text-3xl font-bold text-foreground">
									{uniqueCount}
									{totalForBranch ? (
										<span className="text-lg md:text-xl font-medium ml-1 text-muted-foreground">
											/ {totalForBranch}
										</span>
									) : null}
								</div>
							</div>
							{totalForBranch ? (
								<div className="mt-2 text-sm font-bold text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-full">
									{formatPercent(pct)} Placed
								</div>
							) : null}
						</div>

						<div className="border rounded-xl p-5 card-theme bg-card border-border flex flex-col justify-between">
							<p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
								<IndianRupee className="w-3.5 h-3.5" /> Average
							</p>
							<div className="text-2xl md:text-3xl font-bold text-foreground">
								{formatPackage(stats.avgPackage)}
							</div>
						</div>

						<div className="border rounded-xl p-5 card-theme bg-card border-border flex flex-col justify-between">
							<p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
								<TrendingUp className="w-3.5 h-3.5" /> Median
							</p>
							<div className="text-2xl md:text-3xl font-bold text-foreground">
								{formatPackage(stats.median)}
							</div>
						</div>

						<div className="border rounded-xl p-5 card-theme bg-card border-border flex flex-col justify-between">
							<p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
								<Trophy className="w-3.5 h-3.5" /> Highest
							</p>
							<div className="text-2xl md:text-3xl font-bold text-foreground">
								{formatPackage(stats.highest)}
							</div>
						</div>
					</div>

					{/* Branch Breakdown / Distribution (Restored) */}
					{(() => {
						const toNum = (enr?: string) => {
							if (!enr) return NaN;
							const d = (enr.match(/\d+/g) || []).join("");
							return d ? Number(d) : NaN;
						};
						const ranges = (enrollmentRanges as any)?.[decodedBranch];
						if (!ranges || typeof ranges !== "object") return null;

						type SubStat = {
							label: string;
							placed: number;
							totalOffers?: number;
							total?: number | null;
							pct?: number | null;
							avg?: number;
							median?: number;
						};

						const computeStatsFor = (
							filterFn: (n: number) => boolean,
						): {
							placed: number;
							totalOffers: number;
							avg: number;
							median: number;
						} => {
							const filtered = students.filter((s) => {
								const n = toNum(s.enrollment_number);
								return Number.isFinite(n) && filterFn(n);
							});

							const totalOffers = filtered.length;

							const studentMaxPackages: Map<string, number> = new Map();
							const uniqueEnrollments = new Set<string>();

							filtered.forEach((s) => {
								if (s.enrollment_number) {
									uniqueEnrollments.add(s.enrollment_number);
									const plc =
										s.placement ||
										(placements.find(
											(p) => p.company === s.company,
										) as Placement);
									const pkg = plc ? pkgFrom(s, plc) : null;
									if (pkg != null && pkg > 0) {
										const currentMax =
											studentMaxPackages.get(s.enrollment_number) || 0;
										if (pkg > currentMax) {
											studentMaxPackages.set(s.enrollment_number, pkg);
										}
									}
								}
							});

							const pkgs: number[] = [];
							studentMaxPackages.forEach((pkg) => pkgs.push(pkg));

							const placed = uniqueEnrollments.size;
							const avg = pkgs.length
								? pkgs.reduce((a, c) => a + c, 0) / pkgs.length
								: 0;
							const sorted = [...pkgs].sort((a, b) => a - b);
							const median = sorted.length
								? sorted.length % 2
									? sorted[(sorted.length - 1) >> 1]
									: (sorted[sorted.length / 2 - 1] +
											sorted[sorted.length / 2]) /
										2
								: 0;
							return { placed, totalOffers, avg, median };
						};

						const subs: SubStat[] = [];
						if (decodedBranch === "Intg. MTech") {
							Object.entries(ranges).forEach(([subBranch, entry]: any) => {
								if (
									entry &&
									typeof entry.start === "number" &&
									typeof entry.end === "number"
								) {
									const { placed, totalOffers, avg, median } = computeStatsFor(
										(n) => n >= entry.start && n < entry.end,
									);
									const sc = studentCounts as Record<string, any>;
									const total: number | null =
										sc?.["Intg. MTech"] &&
										typeof sc["Intg. MTech"][subBranch] === "number"
											? (sc["Intg. MTech"][subBranch] as number)
											: null;
									const pct =
										total && total > 0 ? (placed / total) * 100 : null;
									subs.push({
										label: `Intg. MTech - ${subBranch}`,
										placed,
										totalOffers,
										total,
										pct,
										avg,
										median,
									});
								}
							});
						} else {
							Object.entries(ranges).forEach(([batchKey, entry]: any) => {
								if (
									entry &&
									typeof entry.start === "number" &&
									typeof entry.end === "number"
								) {
									const { placed, totalOffers, avg, median } = computeStatsFor(
										(n) => n >= entry.start && n < entry.end,
									);
									const sc = studentCounts as Record<string, any>;
									const total: number | null =
										sc?.[decodedBranch] &&
										typeof sc[decodedBranch][batchKey] === "number"
											? (sc[decodedBranch][batchKey] as number)
											: null;
									const pct =
										total && total > 0 ? (placed / total) * 100 : null;
									subs.push({
										label: `${decodedBranch} - ${batchKey}`,
										placed,
										totalOffers,
										total,
										pct,
										avg,
										median,
									});
								}
							});
						}

						if (!subs.length || subs.length === 1) return null;

						return (
							<div className="mb-8">
								<h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
									Specialization Distribution
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
									{subs
										.sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
										.map((sc, idx) => (
											<div
												key={idx}
												className="border rounded-xl p-5 card-theme bg-card/60 border-border shadow-sm hover:shadow-md transition-shadow"
											>
												<div className="flex items-start justify-between gap-3 mb-4">
													<div>
														<h5 className="font-bold text-lg text-foreground">
															{sc.label}
														</h5>
														<div className="mt-3">
															<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
																<div
																	className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
																	style={{
																		width: `${Math.min(
																			100,
																			Math.max(0, sc.pct || 0),
																		)}%`,
																	}}
																/>
															</div>
															<div className="mt-2 flex items-center justify-between gap-2 text-xs font-medium">
																<span className="text-muted-foreground whitespace-nowrap">
																	{sc.placed} placed / {sc.total || "?"}
																</span>
																<span className="text-foreground font-bold">
																	{formatPercent(sc.pct)}
																</span>
															</div>
														</div>
													</div>
												</div>

												<div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
													<div>
														<p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
															Average
														</p>
														<p className="text-base font-bold text-foreground mt-0.5">
															{formatPackage(sc.avg || 0)}
														</p>
													</div>
													<div className="text-right">
														<p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
															Median
														</p>
														<p className="text-base font-bold text-foreground mt-0.5">
															{formatPackage(sc.median || 0)}
														</p>
													</div>
												</div>
											</div>
										))}
								</div>
							</div>
						);
					})()}

					{/* Students List */}
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
								<Users className="w-5 h-5 text-primary" />
								Student Details
								<Badge variant="secondary" className="ml-2">
									{filteredList.length} offers
								</Badge>
							</h3>
							<div className="relative w-full sm:w-72">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Search className="h-4 w-4 text-muted-foreground" />
								</div>
								<Input
									placeholder="Search name, company..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="pl-10 h-10 bg-background"
								/>
							</div>
						</div>

						{/* Desktop Table */}
						<div className="hidden sm:block border rounded-xl overflow-hidden bg-card shadow-sm">
							<Table>
								<TableHeader className="bg-muted/30">
									<TableRow className="hover:bg-transparent">
										<TableHead
											className="cursor-pointer hover:text-primary transition-colors h-12 group"
											onClick={() => handleSort("name")}
										>
											<div className="flex items-center">
												Name
												{sortConfig?.key === "name" ? (
													sortConfig.direction === "asc" ? (
														<ArrowUp className="ml-1 h-4 w-4" />
													) : (
														<ArrowDown className="ml-1 h-4 w-4" />
													)
												) : (
													<ArrowUpDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100" />
												)}
											</div>
										</TableHead>
										<TableHead
											className="cursor-pointer hover:text-primary transition-colors h-12 group"
											onClick={() => handleSort("enrollment_number")}
										>
											<div className="flex items-center">
												Enrollment
												{sortConfig?.key === "enrollment_number" ? (
													sortConfig.direction === "asc" ? (
														<ArrowUp className="ml-1 h-4 w-4" />
													) : (
														<ArrowDown className="ml-1 h-4 w-4" />
													)
												) : (
													<ArrowUpDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100" />
												)}
											</div>
										</TableHead>
										<TableHead
											className="cursor-pointer hover:text-primary transition-colors h-12 group"
											onClick={() => handleSort("company")}
										>
											<div className="flex items-center">
												Company
												{sortConfig?.key === "company" ? (
													sortConfig.direction === "asc" ? (
														<ArrowUp className="ml-1 h-4 w-4" />
													) : (
														<ArrowDown className="ml-1 h-4 w-4" />
													)
												) : (
													<ArrowUpDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100" />
												)}
											</div>
										</TableHead>
										<TableHead
											className="cursor-pointer hover:text-primary transition-colors h-12 group"
											onClick={() => handleSort("role")}
										>
											<div className="flex items-center">
												Role
												{sortConfig?.key === "role" ? (
													sortConfig.direction === "asc" ? (
														<ArrowUp className="ml-1 h-4 w-4" />
													) : (
														<ArrowDown className="ml-1 h-4 w-4" />
													)
												) : (
													<ArrowUpDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100" />
												)}
											</div>
										</TableHead>
										<TableHead
											className="cursor-pointer hover:text-primary transition-colors h-12 text-right group"
											onClick={() => handleSort("package")}
										>
											<div className="flex items-center justify-end">
												Package
												{sortConfig?.key === "package" ? (
													sortConfig.direction === "asc" ? (
														<ArrowUp className="ml-1 h-4 w-4" />
													) : (
														<ArrowDown className="ml-1 h-4 w-4" />
													)
												) : (
													<ArrowUpDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100" />
												)}
											</div>
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((student, idx) => (
										<TableRow
											key={idx}
											className="hover:bg-muted/30 transition-colors"
										>
											<TableCell className="font-semibold text-foreground py-3">
												{student.name}
											</TableCell>
											<TableCell className="text-muted-foreground font-mono text-xs py-3">
												{student.enrollment_number}
											</TableCell>
											<TableCell className="py-3">{student.company}</TableCell>
											<TableCell className="text-muted-foreground py-3">
												{student.role || "-"}
											</TableCell>
											<TableCell className="text-right py-3">
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
													{(() => {
														const plc =
															student.placement ||
															(placements.find(
																(p) => p.company === student.company,
															) as Placement);
														const pkg = plc ? pkgFrom(student, plc) : null;
														return pkg ? formatPackage(pkg) : "TBD";
													})()}
												</span>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Mobile List */}
						<div className="sm:hidden space-y-3">
							{filteredList.map((student, idx) => (
								<div
									key={idx}
									className="border rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-shadow"
								>
									<div className="flex justify-between items-start mb-3">
										<div>
											<h4 className="font-bold text-foreground">
												{student.name}
											</h4>
											<p className="text-xs text-muted-foreground font-mono mt-0.5">
												{student.enrollment_number}
											</p>
										</div>
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
											{(() => {
												const plc =
													student.placement ||
													(placements.find(
														(p) => p.company === student.company,
													) as Placement);
												const pkg = plc ? pkgFrom(student, plc) : null;
												return pkg ? formatPackage(pkg) : "TBD";
											})()}
										</span>
									</div>
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>
											<span className="text-xs text-muted-foreground block mb-0.5">
												Company
											</span>
											<span className="font-medium">{student.company}</span>
										</div>
										<div className="text-right">
											<span className="text-xs text-muted-foreground block mb-0.5">
												Role
											</span>
											<span className="font-medium">{student.role || "-"}</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
