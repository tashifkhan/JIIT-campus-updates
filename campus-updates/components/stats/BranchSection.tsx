"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
	Building,
	Calendar,
	ChevronUp,
	ChevronDown,
	IndianRupee,
	Trophy,
	Target,
	TrendingUp,
} from "lucide-react";
import type { Placement, StudentWithPlacement } from "@/lib/stats";
import { formatDate, formatPackage, formatPercent } from "@/lib/stats";

type BranchStats = Record<
	string,
	{
		count: number;
		packages: number[];
		avgPackage: number;
		highest: number;
		median: number;
	}
>;

type Props = {
	BRANCHES_LIMIT: number;
	branchStats: BranchStats;
	branchTotalCounts: Record<string, number>;
	getBranchStudents: (branchName: string) => StudentWithPlacement[];
	enrollmentRanges: any;
	studentCounts: any;
	placements: Placement[];
};

// Reusable card component for individual branch stats
function BranchCard({
	branch,
	stats,
	totalForBranch,
	uniqueCount,
	pct,
	onClick,
}: {
	branch: string;
	stats: any;
	totalForBranch: number;
	uniqueCount: number;
	pct: number | null;
	onClick: () => void;
}) {
	return (
		<Card
			className="border card-theme cursor-pointer hover:shadow-lg shadow-sm transition-all duration-300 active:scale-[0.98] bg-card border-border/60 group h-full"
			onClick={onClick}
		>
			<CardContent className="p-5 flex flex-col h-full justify-between gap-4">
				<div>
					<div className="flex items-start justify-between mb-2">
						<div className="space-y-1">
							<h3 className="font-bold text-lg text-foreground flex items-center gap-2">
								{branch}
							</h3>
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
								<Users className="w-3.5 h-3.5" />
								<span>
									{uniqueCount}
									{stats.count !== uniqueCount && (
										<span className="opacity-75"> ({stats.count} offers)</span>
									)}
									{totalForBranch ? (
										<>
											{" "}
											<span className="opacity-50">/</span> {totalForBranch}
										</>
									) : null}
								</span>
							</div>
						</div>
						<div className="flex flex-col items-end">
							<span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
								{pct ? formatPercent(pct) : "N/A"}
							</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
						<div>
							<div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
								<IndianRupee className="w-3 h-3" /> Average
							</div>
							<div className="flex items-baseline gap-1">
								<span className="text-xl font-bold text-foreground">
									{formatPackage(stats.avgPackage).replace(" LPA", "")}
								</span>
								<span className="text-xs font-medium text-muted-foreground">
									LPA
								</span>
							</div>
						</div>
						<div>
							<div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
								<TrendingUp className="w-3 h-3" /> Median
							</div>
							<div className="flex items-baseline gap-1">
								<span className="text-xl font-bold text-foreground">
									{formatPackage(stats.median).replace(" LPA", "")}
								</span>
								<span className="text-xs font-medium text-muted-foreground">
									LPA
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="pt-3 border-t border-border/50 flex items-center justify-between">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Trophy className="w-3.5 h-3.5 text-yellow-500/80" />
						<span className="font-medium">Highest:</span>
						<span className="text-foreground font-bold">
							{formatPackage(stats.highest)}
						</span>
					</div>
					<Badge
						variant="outline"
						className="text-[10px] h-5 border-0 bg-primary/10 text-primary hover:bg-primary/20 pointer-events-none group-hover:pointer-events-auto transition-colors"
					>
						Details &rarr;
					</Badge>
				</div>
			</CardContent>
		</Card>
	);
}

export default function BranchSection({
	BRANCHES_LIMIT,
	branchStats,
	branchTotalCounts,
	getBranchStudents,
	enrollmentRanges,
	studentCounts,
	placements,
}: Props) {
	const [showAllBranches, setShowAllBranches] = useState(false);
	const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
	const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

	return (
		<Card className="card-theme bg-card border-border">
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-foreground">
					<div className="flex items-center gap-2">Branch-wise Placements</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{Object.keys(branchStats).length === 0 ? (
					<div className="text-center py-6 text-muted-foreground">
						No branch data for current filters.
					</div>
				) : (
					<>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{(() => {
								const branchEntries = Object.entries(branchStats).sort(
									(a, b) => b[1].count - a[1].count
								);
								const branchesToShow = showAllBranches
									? branchEntries
									: branchEntries.slice(0, BRANCHES_LIMIT);

								return branchesToShow.map(([branch, stats]) => {
									const totalForBranch = branchTotalCounts[branch] || 0;
									const uniqueCount = (stats as any).uniqueCount || stats.count;
									const pct =
										totalForBranch > 0
											? (uniqueCount / totalForBranch) * 100
											: null;

									return (
										<Dialog
											key={branch}
											open={isBranchModalOpen && selectedBranch === branch}
											onOpenChange={(open) => {
												setIsBranchModalOpen(open);
												if (!open) setSelectedBranch(null);
											}}
										>
											<BranchCard
												branch={branch}
												stats={stats}
												totalForBranch={totalForBranch}
												uniqueCount={uniqueCount}
												pct={pct}
												onClick={() => {
													setSelectedBranch(branch);
													setIsBranchModalOpen(true);
												}}
											/>

											<DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none m-0 p-0 border-none flex flex-col bg-background">
												<DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b border-border shrink-0">
													<div className="sm:hidden">
														<DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
															{branch} Details
														</DialogTitle>
													</div>
													<div className="hidden sm:block">
														<DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-foreground">
															{branch} - Detailed Analytics
														</DialogTitle>
													</div>
												</DialogHeader>
												<div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
													{/* Summary tiles */}
													<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
														<div className="border rounded-xl p-4 sm:p-5 card-theme bg-card border-border flex flex-col justify-between">
															<div>
																<p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
																	<Target className="w-3.5 h-3.5" /> Placement
																	Rate
																</p>
																<div className="mt-2 text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">
																	{uniqueCount}
																	{totalForBranch ? (
																		<span className="text-base sm:text-xl font-medium ml-1 text-muted-foreground">
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

														<div className="border rounded-xl p-4 sm:p-5 card-theme bg-card border-border flex flex-col justify-between">
															<p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
																<IndianRupee className="w-3.5 h-3.5" /> Average
															</p>
															<div className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">
																{formatPackage((stats as any).avgPackage)}
															</div>
														</div>

														<div className="border rounded-xl p-4 sm:p-5 card-theme bg-card border-border flex flex-col justify-between">
															<p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
																<TrendingUp className="w-3.5 h-3.5" /> Median
															</p>
															<div className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">
																{formatPackage((stats as any).median)}
															</div>
														</div>

														<div className="border rounded-xl p-4 sm:p-5 card-theme bg-card border-border flex flex-col justify-between">
															<p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
																<Trophy className="w-3.5 h-3.5" /> Highest
															</p>
															<div className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">
																{formatPackage((stats as any).highest)}
															</div>
														</div>
													</div>

													{/* Branch Specializations (batches or sub-branches) */}
													{(() => {
														const toNum = (enr?: string) => {
															if (!enr) return NaN;
															const d = (enr.match(/\d+/g) || []).join("");
															return d ? Number(d) : NaN;
														};
														const students = getBranchStudents(branch);
														const ranges = (enrollmentRanges as any)?.[branch];
														if (!ranges || typeof ranges !== "object")
															return null;

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
															filterFn: (n: number) => boolean
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

															const studentMaxPackages: Map<string, number> =
																new Map();
															const uniqueEnrollments = new Set<string>();

															filtered.forEach((s) => {
																if (s.enrollment_number) {
																	uniqueEnrollments.add(s.enrollment_number);
																	const plc =
																		s.placement ||
																		(placements.find(
																			(p) => p.company === s.company
																		) as Placement);
																	const pkg = plc ? pkgFrom(s, plc) : null;
																	if (pkg != null && pkg > 0) {
																		const currentMax =
																			studentMaxPackages.get(
																				s.enrollment_number
																			) || 0;
																		if (pkg > currentMax) {
																			studentMaxPackages.set(
																				s.enrollment_number,
																				pkg
																			);
																		}
																	}
																}
															});

															const pkgs: number[] = [];
															studentMaxPackages.forEach((pkg) =>
																pkgs.push(pkg)
															);

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
														if (branch === "Intg. MTech") {
															Object.entries(ranges).forEach(
																([subBranch, entry]: any) => {
																	if (
																		entry &&
																		typeof entry.start === "number" &&
																		typeof entry.end === "number"
																	) {
																		const { placed, totalOffers, avg, median } =
																			computeStatsFor(
																				(n) => n >= entry.start && n < entry.end
																			);
																		const total: number | null =
																			studentCounts?.["Intg. MTech"] &&
																			typeof studentCounts["Intg. MTech"][
																				subBranch
																			] === "number"
																				? (studentCounts["Intg. MTech"][
																						subBranch
																				  ] as number)
																				: null;
																		const pct =
																			total && total > 0
																				? (placed / total) * 100
																				: null;
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
																}
															);
														} else {
															Object.entries(ranges).forEach(
																([batchKey, entry]: any) => {
																	if (
																		entry &&
																		typeof entry.start === "number" &&
																		typeof entry.end === "number"
																	) {
																		const { placed, totalOffers, avg, median } =
																			computeStatsFor(
																				(n) => n >= entry.start && n < entry.end
																			);
																		const total: number | null =
																			studentCounts?.[branch] &&
																			typeof studentCounts[branch][batchKey] ===
																				"number"
																				? (studentCounts[branch][
																						batchKey
																				  ] as number)
																				: null;
																		const pct =
																			total && total > 0
																				? (placed / total) * 100
																				: null;
																		subs.push({
																			label: `${branch} - ${batchKey}`,
																			placed,
																			totalOffers,
																			total,
																			pct,
																			avg,
																			median,
																		});
																	}
																}
															);
														}

														if (!subs.length || subs.length === 1) return null;

														return (
															<div className="mt-2 sm:mt-6">
																<h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-foreground">
																	Branch Specializations
																</h4>

																<div className="overflow-x-auto">
																	<div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-3 sm:gap-4 min-w-max">
																		{subs
																			.sort(
																				(a, b) =>
																					(b.total ?? 0) - (a.total ?? 0)
																			)
																			.map((sc, idx) => (
																				<div
																					key={idx}
																					className="border rounded-xl p-4 card-theme group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 bg-card border-border"
																				>
																					<div className="flex items-start justify-between gap-3 mb-3">
																						<div className="min-w-0">
																							<h5 className="font-semibold text-base truncate text-foreground">
																								{sc.label}
																							</h5>
																							<div className="mt-2">
																								<div className="h-1.5 rounded-full overflow-hidden bg-muted w-full min-w-[120px]">
																									<div
																										className={`h-full rounded-full transition-all bg-primary`}
																										style={{
																											width: `${Math.min(
																												100,
																												Math.max(0, sc.pct || 0)
																											)}%`,
																										}}
																									/>
																								</div>
																								<div className="mt-1.5 flex items-center justify-between text-xs">
																									<span className="text-muted-foreground">
																										{sc.placed} /{" "}
																										{sc.total || "?"}
																									</span>
																									<span className="font-bold text-foreground">
																										{formatPercent(sc.pct)}
																									</span>
																								</div>
																							</div>
																						</div>
																					</div>

																					<div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
																						<div>
																							<p className="text-[10px] uppercase text-muted-foreground font-medium">
																								Average
																							</p>
																							<p className="text-sm font-bold text-foreground">
																								{formatPackage(sc.avg || 0)}
																							</p>
																						</div>
																						<div className="text-right">
																							<p className="text-[10px] uppercase text-muted-foreground font-medium">
																								Median
																							</p>
																							<p className="text-sm font-bold text-foreground">
																								{formatPackage(sc.median || 0)}
																							</p>
																						</div>
																					</div>
																				</div>
																			))}
																	</div>
																</div>
															</div>
														);
													})()}

													{/* Student list */}
													<div className="flex-1">
														<div className="flex items-center justify-between mb-4">
															<h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
																<Users className="w-5 h-5 text-primary" />
																Student Details
															</h3>
															<Badge
																variant="outline"
																className="text-sm border-border text-foreground"
															>
																{getBranchStudents(branch).length} offers
															</Badge>
														</div>

														<div className="">
															<div className="hidden sm:block">
																<Table>
																	<TableHeader>
																		<TableRow>
																			<TableHead className="text-foreground">
																				Name
																			</TableHead>
																			<TableHead className="text-foreground">
																				Enrollment
																			</TableHead>

																			<TableHead className="text-foreground">
																				Company
																			</TableHead>
																			<TableHead className="text-foreground">
																				Role
																			</TableHead>
																			<TableHead className="text-foreground">
																				Package
																			</TableHead>
																			<TableHead className="text-foreground">
																				Joining Date
																			</TableHead>
																		</TableRow>
																	</TableHeader>
																	<TableBody>
																		{getBranchStudents(branch).map(
																			(student, idx) => (
																				<TableRow key={idx}>
																					<TableCell className="font-medium text-foreground">
																						{student.name}
																					</TableCell>
																					<TableCell className="text-muted-foreground font-mono text-xs">
																						{student.enrollment_number}
																					</TableCell>

																					<TableCell className="text-foreground">
																						{student.company}
																					</TableCell>
																					<TableCell className="text-muted-foreground">
																						{student.role || "-"}
																					</TableCell>
																					<TableCell className="text-green-600 font-bold">
																						{(() => {
																							const plc =
																								student.placement ||
																								(placements.find(
																									(p) =>
																										p.company ===
																										student.company
																								) as Placement);
																							const pkg = plc
																								? plc.roles && plc.roles.length
																									? pkgFrom(student, plc)
																									: null
																								: null;
																							return pkg
																								? formatPackage(pkg)
																								: "TBD";
																						})()}
																					</TableCell>
																					<TableCell className="text-muted-foreground">
																						{formatDate(student.joining_date)}
																					</TableCell>
																				</TableRow>
																			)
																		)}
																	</TableBody>
																</Table>
															</div>

															{/* Mobile list */}
															<div className="space-y-3 sm:hidden">
																{getBranchStudents(branch).map(
																	(student, idx) => (
																		<div
																			key={idx}
																			className="border rounded-xl p-4 card-theme bg-card border-border"
																		>
																			<div className="flex items-start justify-between mb-3">
																				<div className="flex-1">
																					<h4 className="font-bold text-base text-foreground">
																						{student.name}
																					</h4>
																					<p className="text-sm font-mono text-muted-foreground">
																						{student.enrollment_number}
																					</p>
																				</div>
																				<div className="text-right">
																					<div className="text-lg font-bold text-green-600">
																						{(() => {
																							const plc =
																								student.placement ||
																								(placements.find(
																									(p) =>
																										p.company ===
																										student.company
																								) as Placement);
																							const pkg = plc
																								? plc.roles && plc.roles.length
																									? pkgFrom(student, plc)
																									: null
																								: null;
																							return pkg
																								? formatPackage(pkg)
																								: "TBD";
																						})()}
																					</div>
																				</div>
																			</div>
																			<div className="space-y-2 text-sm">
																				<div className="flex items-center gap-2">
																					<Building className="w-4 h-4 text-primary" />
																					<span className="font-semibold text-foreground">
																						{student.company}
																					</span>
																				</div>
																				<div className="flex items-center gap-2 text-muted-foreground">
																					<BriefcaseIcon className="w-4 h-4" />
																					<span>{student.role || "N/A"}</span>
																				</div>
																				{student.joining_date && (
																					<div className="flex items-center gap-2 text-muted-foreground">
																						<Calendar className="w-4 h-4" />
																						<span>
																							{formatDate(student.joining_date)}
																						</span>
																					</div>
																				)}
																			</div>
																		</div>
																	)
																)}
															</div>
														</div>
													</div>
												</div>
											</DialogContent>
										</Dialog>
									);
								});
							})()}
						</div>

						{Object.entries(branchStats).length > BRANCHES_LIMIT && (
							<div className="text-center mt-6">
								<Button
									variant="outline"
									onClick={() => setShowAllBranches(!showAllBranches)}
									className="hover-theme gap-2 border-border text-foreground hover:bg-muted"
								>
									{showAllBranches ? (
										<>
											<ChevronUp className="w-4 h-4 mr-2" />
											Show Less Branches
										</>
									) : (
										<>
											<ChevronDown className="w-4 h-4 mr-2" />
											Show All {Object.entries(branchStats).length} Branches
										</>
									)}
								</Button>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);

	function pkgFrom(student: StudentWithPlacement, plc: Placement) {
		if (student.package != null) return student.package;
		const exact = plc.roles.find((r) => r.role === student.role);
		if (exact && exact.package != null) return exact.package;
		const viable = plc.roles.filter((r) => r.package != null);
		if (viable.length === 1) return viable[0].package as number;
		if (viable.length > 1)
			return Math.max(...viable.map((r) => r.package as number));
		return null;
	}
}

function BriefcaseIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
			<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
		</svg>
	);
}
