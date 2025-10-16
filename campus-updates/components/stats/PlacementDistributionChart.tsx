"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, LineChart } from "lucide-react";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	LineChart as RechartsLineChart,
	Line,
} from "recharts";
import type { StudentWithPlacement } from "@/lib/stats";
import { getStudentPackage } from "@/lib/stats";

type Props = {
	students: StudentWithPlacement[];
	getBranch: (enrollment: string) => string;
};

// Color palette for branches - vibrant and distinguishable colors
const BRANCH_COLORS: Record<string, string> = {
	CSE: "#3b82f6", // blue
	ECE: "#f59e0b", // amber
	IT: "#10b981", // emerald
	"Intg. MTech": "#ec4899", // pink
	Biotech: "#14b8a6", // teal
	MTech: "#6366f1", // indigo
	JUIT: "#84cc16", // lime
	Other: "#64748b", // slate
};

const DEFAULT_COLOR = "#94a3b8"; // slate-400

// Helper to get color for branch (case-insensitive and handles variations)
const getBranchColor = (branch: string): string => {
	// Direct match first
	if (BRANCH_COLORS[branch]) return BRANCH_COLORS[branch];

	// Try exact match ignoring extra spaces
	const normalized = branch.trim().replace(/\s+/g, " ");
	if (BRANCH_COLORS[normalized]) return BRANCH_COLORS[normalized];

	// Check all keys
	const matchingKey = Object.keys(BRANCH_COLORS).find(
		(key) => key.toLowerCase() === branch.toLowerCase().trim()
	);

	return matchingKey ? BRANCH_COLORS[matchingKey] : DEFAULT_COLOR;
};

export default function PlacementDistributionChart({
	students,
	getBranch,
}: Props) {
	// Get all unique branches from students
	const availableBranches = useMemo(() => {
		const branches = new Set<string>();
		students.forEach((s) => {
			const branch = getBranch(s.enrollment_number);
			if (branch && branch !== "Other") {
				branches.add(branch);
			}
		});
		return Array.from(branches).sort();
	}, [students, getBranch]);

	// State for selected branches (initially all selected)
	const [selectedBranches, setSelectedBranches] = useState<Set<string>>(
		new Set(availableBranches)
	);

	// State for chart type (area or line)
	const [chartType, setChartType] = useState<"area" | "line">("area");

	// State for branch-specific view
	const [showBranchSpecific, setShowBranchSpecific] = useState(false);

	// Toggle branch selection
	const toggleBranch = (branch: string) => {
		setSelectedBranches((prev) => {
			const next = new Set(prev);
			if (next.has(branch)) {
				next.delete(branch);
			} else {
				next.add(branch);
			}
			return next;
		});
	};

	// Select/Deselect all branches
	const toggleAllBranches = () => {
		if (selectedBranches.size === availableBranches.length) {
			setSelectedBranches(new Set());
		} else {
			setSelectedBranches(new Set(availableBranches));
		}
	};

	// Prepare data for the chart
	const chartData = useMemo(() => {
		if (selectedBranches.size === 0) return [];

		// More granular package ranges for detailed distribution
		const packageRanges = [
			{ label: "0-3", min: 0, max: 3 },
			{ label: "3-4", min: 3, max: 4 },
			{ label: "4-5", min: 4, max: 5 },
			{ label: "5-6", min: 5, max: 6 },
			{ label: "6-7", min: 6, max: 7 },
			{ label: "7-8", min: 7, max: 8 },
			{ label: "8-9", min: 8, max: 9 },
			{ label: "9-10", min: 9, max: 10 },
			{ label: "10-12", min: 10, max: 12 },
			{ label: "12-15", min: 12, max: 15 },
			{ label: "15-18", min: 15, max: 18 },
			{ label: "18-20", min: 18, max: 20 },
			{ label: "20-25", min: 20, max: 25 },
			{ label: "25-30", min: 25, max: 30 },
			{ label: "30-35", min: 30, max: 35 },
			{ label: "35-40", min: 35, max: 40 },
			{ label: "40-50", min: 40, max: 50 },
			{ label: "50+", min: 50, max: Infinity },
		];

		// Initialize data structure
		const data = packageRanges.map((range) => {
			const point: any = { range: range.label, Overall: 0 };
			selectedBranches.forEach((branch) => {
				point[branch] = 0;
			});
			return point;
		});

		// Count students in each package range per branch
		// Overall always includes ALL students regardless of selection
		students.forEach((student) => {
			const branch = getBranch(student.enrollment_number);
			const pkg = getStudentPackage(student, student.placement);
			if (pkg == null || pkg <= 0) return;

			// Find the appropriate range
			const rangeIndex = packageRanges.findIndex(
				(r) => pkg >= r.min && pkg < r.max
			);
			if (rangeIndex >= 0) {
				// Always add to Overall (all students)
				data[rangeIndex].Overall = (data[rangeIndex].Overall || 0) + 1;

				// Only add to branch-specific if selected
				if (selectedBranches.has(branch)) {
					data[rangeIndex][branch] = (data[rangeIndex][branch] || 0) + 1;
				}
			}
		});

		return data;
	}, [students, selectedBranches, getBranch]);

	// Calculate statistics
	const stats = useMemo(() => {
		// Overall stats (ALL students)
		const allPackages = students
			.map((s) => getStudentPackage(s, s.placement))
			.filter((p): p is number => p != null && p > 0);

		const overallAvgPackage =
			allPackages.length > 0
				? allPackages.reduce((a, b) => a + b, 0) / allPackages.length
				: 0;

		// Selected branches stats
		if (selectedBranches.size === 0) {
			return {
				total: students.length,
				avgPackage: overallAvgPackage,
				branches: 0,
				overallTotal: students.length,
				overallAvg: overallAvgPackage,
			};
		}

		const filteredStudents = students.filter((s) =>
			selectedBranches.has(getBranch(s.enrollment_number))
		);

		const packages = filteredStudents
			.map((s) => getStudentPackage(s, s.placement))
			.filter((p): p is number => p != null && p > 0);

		const avgPackage =
			packages.length > 0
				? packages.reduce((a, b) => a + b, 0) / packages.length
				: 0;

		return {
			total: filteredStudents.length,
			avgPackage,
			branches: selectedBranches.size,
			overallTotal: students.length,
			overallAvg: overallAvgPackage,
		};
	}, [students, selectedBranches, getBranch]);

	// Custom tooltip
	const CustomTooltip = ({ active, payload, label }: any) => {
		if (!active || !payload || !payload.length) return null;

		return (
			<div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
				<p className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
					Package Range: ₹{label} LPA
				</p>
				<div className="space-y-1">
					{payload
						.sort((a: any, b: any) => b.value - a.value)
						.map((entry: any, index: number) => (
							<div
								key={index}
								className="flex items-center justify-between gap-3"
							>
								<div className="flex items-center gap-2">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: entry.color }}
									/>
									<span className="text-sm text-slate-700 dark:text-slate-300">
										{entry.name}
									</span>
								</div>
								<span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
									{entry.value}
								</span>
							</div>
						))}
				</div>
			</div>
		);
	};

	return (
		<Card className="card-theme">
			<CardHeader>
				<CardTitle
					className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4"
					style={{ color: "var(--text-color)" }}
				>
					<div className="flex items-center gap-2">
						<TrendingUp
							className="w-5 h-5 sm:w-6 sm:h-6"
							style={{ color: "var(--accent-color)" }}
						/>
						<span className="text-base sm:text-lg lg:text-xl">
							Placement Distribution Across Packages
						</span>
					</div>
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
						<div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
							<div className="flex items-center gap-1.5 sm:gap-2">
								<span style={{ color: "var(--label-color)" }}>Students:</span>
								<span
									className="font-semibold"
									style={{ color: "var(--text-color)" }}
								>
									{stats.total}
								</span>
							</div>
							<div className="flex items-center gap-1.5 sm:gap-2">
								<span style={{ color: "var(--label-color)" }}>
									Avg Package:
								</span>
								<span
									className="font-semibold"
									style={{ color: "var(--text-color)" }}
								>
									₹{stats.avgPackage.toFixed(1)} LPA
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<Button
								variant={chartType === "area" ? "default" : "outline"}
								size="sm"
								onClick={() => setChartType("area")}
								className="h-7 sm:h-8 text-xs sm:text-sm"
							>
								<BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
								<span className="hidden sm:inline">Area</span>
							</Button>
							<Button
								variant={chartType === "line" ? "default" : "outline"}
								size="sm"
								onClick={() => setChartType("line")}
								className="h-7 sm:h-8 text-xs sm:text-sm"
							>
								<LineChart className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
								<span className="hidden sm:inline">Line</span>
							</Button>
							<Button
								variant={showBranchSpecific ? "default" : "outline"}
								size="sm"
								onClick={() => setShowBranchSpecific(!showBranchSpecific)}
								className="h-7 sm:h-8 text-xs sm:text-sm"
								title={
									showBranchSpecific
										? "Show combined view"
										: "Show individual branch graphs"
								}
							>
								<TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
								<span className="hidden sm:inline">
									{showBranchSpecific ? "Combined" : "Individual"}
								</span>
							</Button>
						</div>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Branch selector badges */}
				<div className="mb-4 sm:mb-6">
					<div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
						<div className="flex items-center gap-2">
							<p
								className="text-xs sm:text-sm font-semibold"
								style={{ color: "var(--text-color)" }}
							>
								Select Branches:
							</p>
							<span
								className="text-xs px-2 py-0.5 rounded-full"
								style={{
									backgroundColor: "var(--accent-color)20",
									color: "var(--accent-color)",
								}}
							>
								{selectedBranches.size}/{availableBranches.length}
							</span>
						</div>
						<button
							onClick={toggleAllBranches}
							className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-md transition-all hover:scale-105 active:scale-95"
							style={{
								backgroundColor: "var(--accent-color)15",
								color: "var(--accent-color)",
							}}
						>
							{selectedBranches.size === availableBranches.length
								? "Clear All"
								: "Select All"}
						</button>
					</div>
					{/* Horizontal scroll container for mobile */}
					<div className="relative">
						<div className="overflow-x-auto pb-2 -mx-2 px-2 sm:overflow-visible scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
							<div className="flex sm:flex-wrap gap-2 min-w-max sm:min-w-0">
								{availableBranches.map((branch) => {
									const isSelected = selectedBranches.has(branch);
									const color = getBranchColor(branch);

									return (
										<button
											key={branch}
											onClick={() => toggleBranch(branch)}
											className="group relative transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
										>
											<Badge
												variant={isSelected ? "default" : "outline"}
												className="cursor-pointer text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap font-medium shadow-sm hover:shadow-md transition-all"
												style={
													isSelected
														? {
																backgroundColor: color,
																borderColor: color,
																color: "white",
																border: "2px solid",
														  }
														: {
																borderColor: `${color}80`,
																color: color,
																backgroundColor: `${color}08`,
																border: "2px solid",
														  }
												}
											>
												<div
													className="w-2 h-2 rounded-full mr-1.5 sm:mr-2 transition-transform group-hover:scale-125"
													style={{
														backgroundColor: isSelected ? "white" : color,
														boxShadow: isSelected
															? `0 0 0 2px ${color}`
															: "none",
													}}
												/>
												{branch}
											</Badge>
										</button>
									);
								})}
							</div>
						</div>
						{/* Scroll indicator for mobile */}
						<div className="sm:hidden absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none" />
					</div>
				</div>

				{/* Chart */}
				{selectedBranches.size === 0 ? (
					<div
						className="text-center py-8 sm:py-12"
						style={{ color: "var(--label-color)" }}
					>
						<p className="text-sm sm:text-base lg:text-lg px-4">
							Select at least one branch to view the distribution
						</p>
					</div>
				) : chartData.length === 0 ? (
					<div
						className="text-center py-8 sm:py-12"
						style={{ color: "var(--label-color)" }}
					>
						<p className="text-sm sm:text-base lg:text-lg">
							No placement data available
						</p>
					</div>
				) : showBranchSpecific ? (
					// Individual branch graphs
					<div className="space-y-6">
						{Array.from(selectedBranches)
							.sort()
							.map((branch) => {
								const color = getBranchColor(branch);
								const branchStudents = students.filter(
									(s) => getBranch(s.enrollment_number) === branch
								);
								const branchPackages = branchStudents
									.map((s) => getStudentPackage(s, s.placement))
									.filter((p): p is number => p != null && p > 0);

								const avgPkg =
									branchPackages.length > 0
										? branchPackages.reduce((a, b) => a + b, 0) /
										  branchPackages.length
										: 0;

								return (
									<div
										key={branch}
										className="rounded-lg border-2 p-3 sm:p-4"
										style={{
											borderColor: color,
											backgroundColor: `${color}05`,
										}}
									>
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2">
												<div
													className="w-3 h-3 rounded-full"
													style={{ backgroundColor: color }}
												/>
												<h3
													className="font-semibold text-sm sm:text-base"
													style={{ color: "var(--text-color)" }}
												>
													{branch}
												</h3>
											</div>
											<div className="text-right text-xs sm:text-sm">
												<span style={{ color: "var(--label-color)" }}>
													{branchStudents.length} students
												</span>
												<span
													className="ml-2 font-semibold"
													style={{ color: "var(--text-color)" }}
												>
													₹{avgPkg.toFixed(1)} LPA
												</span>
											</div>
										</div>
										<div className="w-full h-[250px] sm:h-[300px]">
											<ResponsiveContainer width="100%" height="100%">
												{chartType === "area" ? (
													<AreaChart
														data={chartData}
														margin={{
															top: 10,
															right: 10,
															left: -20,
															bottom: 0,
														}}
													>
														<defs>
															<linearGradient
																id={`gradient-${branch}`}
																x1="0"
																y1="0"
																x2="0"
																y2="1"
															>
																<stop
																	offset="5%"
																	stopColor={color}
																	stopOpacity={0.8}
																/>
																<stop
																	offset="95%"
																	stopColor={color}
																	stopOpacity={0.1}
																/>
															</linearGradient>
														</defs>
														<CartesianGrid
															strokeDasharray="3 3"
															className="stroke-slate-200 dark:stroke-slate-700"
															opacity={0.3}
														/>
														<XAxis
															dataKey="range"
															className="text-[10px] sm:text-xs"
															tick={{ fill: "var(--label-color)" }}
															angle={-45}
															textAnchor="end"
															height={60}
														/>
														<YAxis
															className="text-[10px] sm:text-xs"
															tick={{ fill: "var(--label-color)" }}
															width={35}
														/>
														<Tooltip content={<CustomTooltip />} />
														<Area
															type="monotone"
															dataKey={branch}
															stroke={color}
															strokeWidth={3}
															fill={`url(#gradient-${branch})`}
															fillOpacity={1}
															name={branch}
															animationDuration={1000}
														/>
													</AreaChart>
												) : (
													<RechartsLineChart
														data={chartData}
														margin={{
															top: 10,
															right: 10,
															left: -20,
															bottom: 0,
														}}
													>
														<CartesianGrid
															strokeDasharray="3 3"
															className="stroke-slate-200 dark:stroke-slate-700"
															opacity={0.3}
														/>
														<XAxis
															dataKey="range"
															className="text-[10px] sm:text-xs"
															tick={{ fill: "var(--label-color)" }}
															angle={-45}
															textAnchor="end"
															height={60}
														/>
														<YAxis
															className="text-[10px] sm:text-xs"
															tick={{ fill: "var(--label-color)" }}
															width={35}
														/>
														<Tooltip content={<CustomTooltip />} />
														<Line
															type="monotone"
															dataKey={branch}
															stroke={color}
															strokeWidth={3}
															dot={{ r: 4, fill: color }}
															activeDot={{ r: 6 }}
															name={branch}
															animationDuration={1000}
														/>
													</RechartsLineChart>
												)}
											</ResponsiveContainer>
										</div>
									</div>
								);
							})}
					</div>
				) : (
					// Combined graph
					<div className="w-full h-[300px] sm:h-[400px] lg:h-[500px]">
						<ResponsiveContainer width="100%" height="100%">
							{chartType === "area" ? (
								<AreaChart
									data={chartData}
									margin={{
										top: 10,
										right: 10,
										left: -20,
										bottom: 0,
									}}
								>
									<defs>
										{Array.from(selectedBranches).map((branch) => {
											const color = getBranchColor(branch);
											return (
												<linearGradient
													key={branch}
													id={`color-${branch}`}
													x1="0"
													y1="0"
													x2="0"
													y2="1"
												>
													<stop
														offset="5%"
														stopColor={color}
														stopOpacity={0.8}
													/>
													<stop
														offset="95%"
														stopColor={color}
														stopOpacity={0.1}
													/>
												</linearGradient>
											);
										})}
										{/* Overall gradient with theme-aware styling */}
										<linearGradient
											id="color-Overall"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="currentColor"
												stopOpacity={0.4}
											/>
											<stop
												offset="95%"
												stopColor="currentColor"
												stopOpacity={0.05}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-slate-200 dark:stroke-slate-700"
										opacity={0.3}
									/>
									<XAxis
										dataKey="range"
										className="text-[10px] sm:text-xs"
										tick={{ fill: "var(--label-color)" }}
										angle={-45}
										textAnchor="end"
										height={60}
									/>
									<YAxis
										className="text-[10px] sm:text-xs"
										tick={{ fill: "var(--label-color)" }}
										width={35}
									/>
									<Tooltip content={<CustomTooltip />} />
									<Legend
										wrapperStyle={{
											paddingTop: "10px",
											fontSize: "11px",
										}}
										iconType="circle"
										iconSize={8}
									/>
									{/* Render branch areas */}
									{Array.from(selectedBranches)
										.sort()
										.map((branch) => {
											const color = getBranchColor(branch);
											return (
												<Area
													key={branch}
													type="monotone"
													dataKey={branch}
													stroke={color}
													strokeWidth={2}
													fill={`url(#color-${branch})`}
													fillOpacity={1}
													name={branch}
													animationDuration={1000}
												/>
											);
										})}
									{/* Overall line with theme-aware styling */}
									<Area
										type="monotone"
										dataKey="Overall"
										stroke="var(--text-color)"
										strokeWidth={3}
										strokeDasharray="5 5"
										fill="url(#color-Overall)"
										fillOpacity={0.8}
										name="Overall (All Students)"
										animationDuration={1000}
										className="[stroke:var(--text-color)]"
									/>
								</AreaChart>
							) : (
								<RechartsLineChart
									data={chartData}
									margin={{
										top: 10,
										right: 10,
										left: -20,
										bottom: 0,
									}}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-slate-200 dark:stroke-slate-700"
										opacity={0.3}
									/>
									<XAxis
										dataKey="range"
										className="text-[10px] sm:text-xs"
										tick={{ fill: "var(--label-color)" }}
										angle={-45}
										textAnchor="end"
										height={60}
									/>
									<YAxis
										className="text-[10px] sm:text-xs"
										tick={{ fill: "var(--label-color)" }}
										width={35}
									/>
									<Tooltip content={<CustomTooltip />} />
									<Legend
										wrapperStyle={{
											paddingTop: "10px",
											fontSize: "11px",
										}}
										iconType="circle"
										iconSize={8}
									/>
									{/* Render branch lines */}
									{Array.from(selectedBranches)
										.sort()
										.map((branch) => {
											const color = getBranchColor(branch);
											return (
												<Line
													key={branch}
													type="monotone"
													dataKey={branch}
													stroke={color}
													strokeWidth={2}
													dot={{ r: 3, fill: color }}
													activeDot={{ r: 5 }}
													name={branch}
													animationDuration={1000}
												/>
											);
										})}
									{/* Overall line with theme-aware styling */}
									<Line
										type="monotone"
										dataKey="Overall"
										stroke="var(--text-color)"
										strokeWidth={3}
										strokeDasharray="5 5"
										dot={{
											r: 4,
											fill: "var(--text-color)",
											strokeWidth: 2,
											stroke: "var(--accent-color)",
										}}
										activeDot={{ r: 6 }}
										name="Overall (All Students)"
										animationDuration={1000}
										className="[stroke:var(--text-color)]"
									/>
								</RechartsLineChart>
							)}
						</ResponsiveContainer>
					</div>
				)}

				{/* Legend with statistics per branch - only show in combined view */}
				{selectedBranches.size > 0 && !showBranchSpecific && (
					<div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
						{/* Overall statistics card - prominent */}
						<div
							className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border-2 border-dashed shadow-sm gap-2"
							style={{
								borderColor: "var(--text-color)",
								backgroundColor: "var(--accent-color)15",
							}}
						>
							<div className="flex items-center gap-2 sm:gap-3">
								<div
									className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex-shrink-0"
									style={{
										backgroundColor: "var(--text-color)",
										borderColor: "var(--accent-color)",
									}}
								/>
								<span
									className="font-bold text-sm sm:text-base"
									style={{ color: "var(--text-color)" }}
								>
									Overall (All Students)
								</span>
							</div>
							<div className="text-left sm:text-right pl-5 sm:pl-0">
								<div
									className="text-xs sm:text-sm"
									style={{ color: "var(--label-color)" }}
								>
									{stats.overallTotal} students
								</div>
								<div
									className="text-base sm:text-lg font-bold"
									style={{ color: "var(--text-color)" }}
								>
									₹{stats.overallAvg.toFixed(1)} LPA
								</div>
							</div>
						</div>

						{/* Individual branch statistics */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
							{Array.from(selectedBranches)
								.sort()
								.map((branch) => {
									const branchStudents = students.filter(
										(s) => getBranch(s.enrollment_number) === branch
									);
									const branchPackages = branchStudents
										.map((s) => getStudentPackage(s, s.placement))
										.filter((p): p is number => p != null && p > 0);

									const avgPkg =
										branchPackages.length > 0
											? branchPackages.reduce((a, b) => a + b, 0) /
											  branchPackages.length
											: 0;

									const color = getBranchColor(branch);

									return (
										<div
											key={branch}
											className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg border"
											style={{
												borderColor: color,
												backgroundColor: `${color}10`,
											}}
										>
											<div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
												<div
													className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
													style={{ backgroundColor: color }}
												/>
												<span
													className="font-medium text-xs sm:text-sm truncate"
													style={{ color: "var(--text-color)" }}
												>
													{branch}
												</span>
											</div>
											<div className="text-right flex-shrink-0 ml-2">
												<div
													className="text-[10px] sm:text-xs"
													style={{ color: "var(--label-color)" }}
												>
													{branchStudents.length}
												</div>
												<div
													className="text-xs sm:text-sm font-semibold whitespace-nowrap"
													style={{ color: "var(--text-color)" }}
												>
													₹{avgPkg.toFixed(1)}
												</div>
											</div>
										</div>
									);
								})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
