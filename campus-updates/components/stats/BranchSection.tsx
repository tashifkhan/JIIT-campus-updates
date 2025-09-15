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
	Building,
	Calendar,
	ChevronDown,
	ChevronUp,
	GraduationCap,
	MapPin,
	TrendingUp,
	Users,
} from "lucide-react";
import {
	Placement,
	StudentWithPlacement,
	formatDate,
	formatPackage,
	formatPercent,
} from "@/lib/stats";

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
						<GraduationCap
							className="w-5 h-5 mr-2"
							style={{ color: "var(--accent-color)" }}
						/>
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
															<div
																className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
																style={{
																	backgroundColor: "var(--accent-color)",
																}}
															>
																{branch.charAt(0)}
															</div>
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
															<div
																className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
																style={{
																	backgroundColor: "var(--accent-color)",
																}}
															>
																{branch.charAt(0)}
															</div>
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
														<div
															className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
															style={{ backgroundColor: "var(--accent-color)" }}
														>
															{branch.charAt(0)}
														</div>
														{branch} Details
													</DialogTitle>
												</div>
												<div className="hidden sm:block">
													<DialogTitle
														className="text-xl sm:text-2xl font-bold flex items-center gap-3"
														style={{ color: "var(--text-color)" }}
													>
														<div
															className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold"
															style={{ backgroundColor: "var(--accent-color)" }}
														>
															{branch.charAt(0)}
														</div>
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
																			<GraduationCap
																				className="w-4 h-4"
																				style={{ color: "var(--accent-color)" }}
																			/>
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
