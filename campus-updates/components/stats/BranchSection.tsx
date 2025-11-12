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
		<Card className="card-theme">
			<CardHeader>
				<CardTitle
					className="flex items-center justify-between"
					style={{ color: "var(--text-color)" }}
				>
					<div className="flex items-center gap-2">
						Branch-wise Placements
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{Object.keys(branchStats).length === 0 ? (
					<div
						className="text-center py-6"
						style={{ color: "var(--label-color)" }}
					>
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

								return branchesToShow.map(([branch, stats]) => (
									<Dialog
										key={branch}
										open={isBranchModalOpen && selectedBranch === branch}
										onOpenChange={(open) => {
											setIsBranchModalOpen(open);
											if (!open) setSelectedBranch(null);
										}}
									>
										<Card
											className="border card-theme cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
											style={{
												backgroundColor: "var(--primary-color)",
												borderColor: "var(--border-color)",
											}}
											onClick={() => {
												setSelectedBranch(branch);
												setIsBranchModalOpen(true);
											}}
										>
											<CardContent className="p-4">
												<div className="sm:hidden">
													<div className="flex items-center justify-between mb-3">
														<div className="flex items-center gap-3">
															<div>
																<h3
																	className="font-bold text-base leading-tight"
																	style={{ color: "var(--text-color)" }}
																>
																	{branch}
																</h3>
																{(() => {
																	const totalForBranch =
																		branchTotalCounts[branch] || 0;
																	const pct =
																		totalForBranch > 0
																			? (stats.count / totalForBranch) * 100
																			: null;
																	return (
																		<p
																			className="text-xs"
																			style={{ color: "var(--label-color)" }}
																		>
																			{stats.count} placed
																			{totalForBranch ? (
																				<>
																					{" "}
																					of {totalForBranch} •{" "}
																					{formatPercent(pct)}
																				</>
																			) : null}
																		</p>
																	);
																})()}
															</div>
														</div>
														<div className="text-right">
															<div
																className="text-lg font-bold"
																style={{ color: "var(--success-dark)" }}
															>
																{formatPackage((stats as any).avgPackage)}
															</div>
															<p
																className="text-xs"
																style={{ color: "var(--label-color)" }}
															>
																Average
															</p>
														</div>
													</div>

													<div className="grid grid-cols-2 gap-2">
														<div
															className="text-center p-2 rounded bg-opacity-50"
															style={{ backgroundColor: "var(--card-bg)" }}
														>
															<div
																className="text-sm font-bold"
																style={{ color: "var(--success-dark)" }}
															>
																{formatPackage((stats as any).median)}
															</div>
															<p
																className="text-xs"
																style={{ color: "var(--label-color)" }}
															>
																Median
															</p>
														</div>
														<div
															className="text-center p-2 rounded bg-opacity-50"
															style={{ backgroundColor: "var(--card-bg)" }}
														>
															<div
																className="text-sm font-bold"
																style={{ color: "var(--success-dark)" }}
															>
																{formatPackage((stats as any).highest)}
															</div>
															<p
																className="text-xs"
																style={{ color: "var(--label-color)" }}
															>
																Highest
															</p>
														</div>
													</div>
												</div>

												<div className="hidden sm:block">
													<div className="flex items-center justify-between mb-3">
														<div className="flex items-center gap-3">
															<div>
																<h3
																	className="font-bold text-lg"
																	style={{ color: "var(--text-color)" }}
																>
																	{branch}
																</h3>
																{(() => {
																	const totalForBranch =
																		branchTotalCounts[branch] || 0;
																	const pct =
																		totalForBranch > 0
																			? (stats.count / totalForBranch) * 100
																			: null;
																	return (
																		<p
																			className="text-xs"
																			style={{ color: "var(--label-color)" }}
																		>
																			{stats.count} placed
																			{totalForBranch ? (
																				<>
																					{" "}
																					of {totalForBranch} •{" "}
																					{formatPercent(pct)}
																				</>
																			) : null}
																		</p>
																	);
																})()}
															</div>
														</div>
														<div className="text-right">
															<Badge
																variant="secondary"
																className="px-2 py-1 text-xs font-semibold"
																style={{
																	backgroundColor: "var(--accent-color)",
																	color: "white",
																}}
															>
																Avg: {formatPackage((stats as any).avgPackage)}
															</Badge>
														</div>
													</div>
													<div className="space-y-2">
														<div className="flex justify-between items-center">
															<span
																className="text-sm"
																style={{ color: "var(--label-color)" }}
															>
																Median:
															</span>
															<span
																className="font-bold text-sm"
																style={{ color: "var(--success-dark)" }}
															>
																{formatPackage((stats as any).median)}
															</span>
														</div>
														<div className="flex justify-between items-center">
															<span
																className="text-sm"
																style={{ color: "var(--label-color)" }}
															>
																Highest:
															</span>
															<span
																className="font-bold text-sm"
																style={{ color: "var(--success-dark)" }}
															>
																{formatPackage((stats as any).highest)}
															</span>
														</div>
													</div>
												</div>
											</CardContent>
										</Card>

										<DialogContent className="w-full sm:w-[95vw] md:w-[98vw] lg:w-screen sm:max-w-[95vw] md:max-w-[98vw] lg:max-w-screen max-h-[95vh] sm:rounded-lg overflow-hidden">
											<DialogHeader className="pb-2 sm:pb-4">
												<div className="sm:hidden">
													<DialogTitle
														className="text-lg font-bold flex items-center gap-2"
														style={{ color: "var(--text-color)" }}
													>
														{branch} Details
													</DialogTitle>
												</div>
												<div className="hidden sm:block">
													<DialogTitle
														className="text-xl sm:text-2xl font-bold flex items-center gap-3"
														style={{ color: "var(--text-color)" }}
													>
														{branch} - Detailed Analytics
													</DialogTitle>
												</div>
											</DialogHeader>
											<div className="mt-1 sm:mt-2 space-y-4 sm:space-y-6 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
												{/* Summary tiles */}
												<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
													{(() => {
														const totalForBranch =
															branchTotalCounts[branch] || 0;
														const pct =
															totalForBranch > 0
																? (stats.count / totalForBranch) * 100
																: null;
														return (
															<div
																className="border rounded-lg p-2 sm:p-4 text-center card-theme"
																style={{
																	backgroundColor: "var(--primary-color)",
																	borderColor: "var(--border-color)",
																}}
															>
																<div
																	className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2"
																	style={{ color: "var(--text-color)" }}
																>
																	{stats.count}
																	{totalForBranch ? (
																		<span
																			className="text-base sm:text-xl font-medium ml-1"
																			style={{ color: "var(--label-color)" }}
																		>
																			/ {totalForBranch}
																		</span>
																	) : null}
																</div>
																<p
																	className="text-xs sm:text-sm font-medium"
																	style={{ color: "var(--label-color)" }}
																>
																	{totalForBranch
																		? "Placed / Total"
																		: "Students"}
																	{totalForBranch ? (
																		<span
																			className="block font-semibold"
																			style={{ color: "var(--success-dark)" }}
																		>
																			{formatPercent(pct)}
																		</span>
																	) : null}
																</p>
															</div>
														);
													})()}
													<div
														className="border rounded-lg p-2 sm:p-4 text-center card-theme"
														style={{
															backgroundColor: "var(--primary-color)",
															borderColor: "var(--border-color)",
														}}
													>
														<div
															className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2"
															style={{ color: "var(--success-dark)" }}
														>
															{formatPackage((stats as any).avgPackage)}
														</div>
														<p
															className="text-xs sm:text-sm font-medium"
															style={{ color: "var(--label-color)" }}
														>
															Average
														</p>
													</div>
													<div
														className="border rounded-lg p-2 sm:p-4 text-center card-theme"
														style={{
															backgroundColor: "var(--primary-color)",
															borderColor: "var(--border-color)",
														}}
													>
														<div
															className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2"
															style={{ color: "var(--success-dark)" }}
														>
															{formatPackage((stats as any).median)}
														</div>
														<p
															className="text-xs sm:text-sm font-medium"
															style={{ color: "var(--label-color)" }}
														>
															Median
														</p>
													</div>
													<div
														className="border rounded-lg p-2 sm:p-4 text-center card-theme"
														style={{
															backgroundColor: "var(--primary-color)",
															borderColor: "var(--border-color)",
														}}
													>
														<div
															className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2"
															style={{ color: "var(--success-dark)" }}
														>
															{formatPackage((stats as any).highest)}
														</div>
														<p
															className="text-xs sm:text-sm font-medium"
															style={{ color: "var(--label-color)" }}
														>
															Highest
														</p>
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
														total?: number | null;
														pct?: number | null;
														avg?: number;
														median?: number;
													};

													const computeStatsFor = (
														filterFn: (n: number) => boolean
													): {
														placed: number;
														avg: number;
														median: number;
													} => {
														const filtered = students.filter((s) => {
															const n = toNum(s.enrollment_number);
															return Number.isFinite(n) && filterFn(n);
														});
														const pkgs: number[] = [];
														filtered.forEach((s) => {
															const plc =
																s.placement ||
																(placements.find(
																	(p) => p.company === s.company
																) as Placement);
															const pkg = plc ? pkgFrom(s, plc) : null;
															if (pkg != null && pkg > 0) pkgs.push(pkg);
														});
														const placed = filtered.length;
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
														return { placed, avg, median };
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
																	const { placed, avg, median } =
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
																	const { placed, avg, median } =
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
																		total,
																		pct,
																		avg,
																		median,
																	});
																}
															}
														);
													}

													// Don't show subsections if there's only one (it's redundant)
													if (!subs.length || subs.length === 1) return null;

													const pctBarColor = (pct?: number | null) => {
														if (pct == null) return "var(--accent-color)";
														if (pct >= 60) return "var(--success-dark)";
														if (pct >= 40) return "var(--accent-color)";
														return "#6b7280"; // neutral
													};

													return (
														<div className="mt-2 sm:mt-6">
															<h4
																className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2"
																style={{ color: "var(--text-color)" }}
															>
																Branch Specializations
															</h4>

															{/* Single row, dynamic columns, horizontal scroll if needed */}
															<div className="overflow-x-auto">
																<div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-3 sm:gap-4 min-w-max">
																	{subs
																		.sort(
																			(a, b) => (b.total ?? 0) - (a.total ?? 0)
																		)
																		.map((sc, idx) => (
																			<div
																				key={idx}
																				className="border rounded-xl p-3 sm:p-4 card-theme group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
																				style={{
																					backgroundColor:
																						"var(--primary-color)",
																					borderColor: "var(--border-color)",
																				}}
																			>
																				<div className="flex items-start justify-between gap-3">
																					<div className="min-w-0">
																						<h5
																							className="font-semibold text-base sm:text-lg truncate"
																							style={{
																								color: "var(--text-color)",
																							}}
																						>
																							{sc.label}
																						</h5>
																						{sc.pct != null ? (
																							<div className="mt-2">
																								<div
																									className="h-2 rounded-full overflow-hidden"
																									style={{
																										backgroundColor:
																											"var(--card-bg)",
																									}}
																									aria-hidden
																								>
																									<div
																										className="h-full rounded-full transition-all"
																										style={{
																											width: `${Math.min(
																												100,
																												Math.max(0, sc.pct || 0)
																											)}%`,
																											backgroundColor:
																												pctBarColor(sc.pct),
																										}}
																									/>
																								</div>
																								<div className="mt-1 text-[11px] sm:text-xs font-medium">
																									<span
																										style={{
																											color:
																												"var(--label-color)",
																										}}
																									>
																										Placement rate:
																									</span>{" "}
																									<span
																										className="font-semibold"
																										style={{
																											color:
																												"var(--text-color)",
																										}}
																									>
																										{formatPercent(sc.pct)}
																									</span>
																								</div>
																							</div>
																						) : (
																							<p
																								className="text-[11px] sm:text-xs mt-1"
																								style={{
																									color: "var(--label-color)",
																								}}
																							>
																								Placed: {sc.placed}
																							</p>
																						)}
																					</div>
																					{sc.total ? (
																						<Badge
																							className="px-2 py-1 text-xs sm:text-sm font-semibold shadow-sm"
																							style={{
																								backgroundColor:
																									"var(--accent-color)",
																								color: "white",
																							}}
																						>
																							<span className="font-semibold">
																								{sc.placed}
																							</span>
																							<span className="ml-1 text-[8px] sm:text-xs font-medium opacity-90">
																								/ {sc.total}
																							</span>
																						</Badge>
																					) : null}
																				</div>

																				<div className="grid grid-cols-2 gap-2 mt-3 sm:mt-4">
																					<div
																						className="rounded-lg p-2"
																						style={{
																							backgroundColor: "var(--card-bg)",
																						}}
																					>
																						<p
																							className="text-[11px] sm:text-xs"
																							style={{
																								color: "var(--label-color)",
																							}}
																						>
																							Average
																						</p>
																						<p
																							className="text-sm sm:text-base font-semibold"
																							style={{
																								color: "var(--success-dark)",
																							}}
																						>
																							{formatPackage(sc.avg || 0)}
																						</p>
																					</div>
																					<div
																						className="rounded-lg p-2"
																						style={{
																							backgroundColor: "var(--card-bg)",
																						}}
																					>
																						<p
																							className="text-[11px] sm:text-xs"
																							style={{
																								color: "var(--label-color)",
																							}}
																						>
																							Median
																						</p>
																						<p
																							className="text-sm sm:text-base font-semibold"
																							style={{
																								color: "var(--success-dark)",
																							}}
																						>
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
												<div className="flex-1 overflow-hidden">
													<div className="flex items-center justify-between mb-4">
														<h3
															className="text-lg font-bold flex items-center gap-2"
															style={{ color: "var(--text-color)" }}
														>
															<Users
																className="w-5 h-5"
																style={{ color: "var(--accent-color)" }}
															/>
															Student Details
														</h3>
														<Badge
															variant="outline"
															className="text-sm"
															style={{
																borderColor: "var(--border-color)",
																color: "var(--text-color)",
															}}
														>
															{getBranchStudents(branch).length} students
														</Badge>
													</div>

													<div className="overflow-auto max-h-96">
														<div className="hidden sm:block">
															<Table>
																<TableHeader>
																	<TableRow>
																		<TableHead
																			style={{ color: "var(--text-color)" }}
																		>
																			Name
																		</TableHead>
																		<TableHead
																			style={{ color: "var(--text-color)" }}
																		>
																			Enrollment
																		</TableHead>
																		<TableHead
																			style={{ color: "var(--text-color)" }}
																		>
																			Email
																		</TableHead>
																		<TableHead
																			style={{ color: "var(--text-color)" }}
																		>
																			Company
																		</TableHead>
																		<TableHead
																			style={{ color: "var(--text-color)" }}
																		>
																			Role
																		</TableHead>
																		<TableHead
																			style={{ color: "var(--text-color)" }}
																		>
																			Package
																		</TableHead>
																		<TableHead
																			style={{ color: "var(--text-color)" }}
																		>
																			Joining Date
																		</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{getBranchStudents(branch).map(
																		(student, idx) => (
																			<TableRow key={idx}>
																				<TableCell
																					style={{ color: "var(--text-color)" }}
																				>
																					{student.name}
																				</TableCell>
																				<TableCell
																					style={{
																						color: "var(--label-color)",
																					}}
																				>
																					{student.enrollment_number}
																				</TableCell>
																				<TableCell
																					style={{
																						color: "var(--label-color)",
																					}}
																				>
																					{student.email ||
																						`${student.enrollment_number}@${
																							/[A-Za-z]/.test(
																								student.enrollment_number || ""
																							)
																								? "mail.juit.ac.in"
																								: "mail.jiit.ac.in"
																						}`}
																				</TableCell>
																				<TableCell
																					style={{
																						color: "var(--label-color)",
																					}}
																				>
																					{student.company}
																				</TableCell>
																				<TableCell
																					style={{
																						color: "var(--label-color)",
																					}}
																				>
																					{student.role || "N/A"}
																				</TableCell>
																				<TableCell
																					style={{
																						color: "var(--success-dark)",
																					}}
																				>
																					{(() => {
																						const plc =
																							student.placement ||
																							(placements.find(
																								(p) =>
																									p.company === student.company
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
																				<TableCell
																					style={{
																						color: "var(--label-color)",
																					}}
																				>
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
															{getBranchStudents(branch).map((student, idx) => (
																<div
																	key={idx}
																	className="border rounded-xl p-4 card-theme"
																	style={{
																		backgroundColor: "var(--primary-color)",
																		borderColor: "var(--border-color)",
																	}}
																>
																	<div className="flex items-start justify-between mb-3">
																		<div className="flex-1">
																			<h4
																				className="font-bold text-base"
																				style={{ color: "var(--text-color)" }}
																			>
																				{student.name}
																			</h4>
																			<p
																				className="text-sm font-mono"
																				style={{ color: "var(--label-color)" }}
																			>
																				{student.enrollment_number}
																			</p>
																		</div>
																		<div className="text-right">
																			<div
																				className="text-lg font-bold"
																				style={{ color: "var(--success-dark)" }}
																			>
																				{(() => {
																					const plc =
																						student.placement ||
																						(placements.find(
																							(p) =>
																								p.company === student.company
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
																	<div className="space-y-2">
																		<div className="flex items-center gap-2">
																			<Building
																				className="w-4 h-4"
																				style={{ color: "var(--accent-color)" }}
																			/>
																			<span
																				className="font-semibold text-sm"
																				style={{ color: "var(--text-color)" }}
																			>
																				{student.company}
																			</span>
																		</div>
																		<div className="flex items-center gap-2">

																			<span
																				className="text-sm"
																				style={{ color: "var(--label-color)" }}
																			>
																				{student.role || "N/A"}
																			</span>
																		</div>
																		{student.joining_date && (
																			<div className="flex items-center gap-2">
																				<Calendar
																					className="w-4 h-4"
																					style={{
																						color: "var(--accent-color)",
																					}}
																				/>
																				<span
																					className="text-sm"
																					style={{
																						color: "var(--label-color)",
																					}}
																				>
																					{formatDate(student.joining_date)}
																				</span>
																			</div>
																		)}
																	</div>
																</div>
															))}
														</div>
													</div>
												</div>
											</div>
										</DialogContent>
									</Dialog>
								));
							})()}
						</div>

						{Object.entries(branchStats).length > BRANCHES_LIMIT && (
							<div className="text-center mt-6">
								<Button
									variant="outline"
									onClick={() => setShowAllBranches(!showAllBranches)}
									style={{
										borderColor: "var(--border-color)",
										color: "var(--text-color)",
									}}
									className="hover-theme"
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
		// lazy load to avoid circular dep: paste minimal logic
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
