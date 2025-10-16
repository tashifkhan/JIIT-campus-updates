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
					className="flex items-center justify-between flex-wrap gap-4"
					style={{ color: "var(--text-color)" }}
				>
					<div className="flex items-center gap-2">
						<TrendingUp
							className="w-5 h-5"
							style={{ color: "var(--accent-color)" }}
						/>
						Placement Distribution Across Packages
					</div>
					<div className="flex items-center gap-4 flex-wrap">
						<div className="flex items-center gap-3 text-sm">
							<div className="flex items-center gap-2">
								<span style={{ color: "var(--label-color)" }}>Students:</span>
								<span
									className="font-semibold"
									style={{ color: "var(--text-color)" }}
								>
									{stats.total}
								</span>
							</div>
							<div className="flex items-center gap-2">
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
						<div className="flex items-center gap-2">
							<Button
								variant={chartType === "area" ? "default" : "outline"}
								size="sm"
								onClick={() => setChartType("area")}
								className="h-8"
							>
								<BarChart3 className="w-4 h-4 mr-1" />
								Area
							</Button>
							<Button
								variant={chartType === "line" ? "default" : "outline"}
								size="sm"
								onClick={() => setChartType("line")}
								className="h-8"
							>
								<LineChart className="w-4 h-4 mr-1" />
								Line
							</Button>
						</div>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Branch selector badges */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-3 flex-wrap gap-2">
						<p
							className="text-sm font-medium"
							style={{ color: "var(--label-color)" }}
						>
							Select Branches to Compare:
						</p>
						<div className="flex items-center gap-3">
							<button
								onClick={toggleAllBranches}
								className="text-xs font-medium hover:opacity-80 transition-opacity"
								style={{ color: "var(--accent-color)" }}
							>
								{selectedBranches.size === availableBranches.length
									? "Deselect All"
									: "Select All"}
							</button>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						{availableBranches.map((branch) => {
							const isSelected = selectedBranches.has(branch);
							const color = getBranchColor(branch);

							return (
								<button
									key={branch}
									onClick={() => toggleBranch(branch)}
									className="transition-all duration-200 hover:scale-105"
								>
									<Badge
										variant={isSelected ? "default" : "outline"}
										className="cursor-pointer text-sm px-3 py-1.5"
										style={
											isSelected
												? {
														backgroundColor: color,
														borderColor: color,
														color: "white",
												  }
												: {
														borderColor: color,
														color: color,
												  }
										}
									>
										<div
											className="w-2 h-2 rounded-full mr-2"
											style={{ backgroundColor: color }}
										/>
										{branch}
									</Badge>
								</button>
							);
						})}
					</div>
				</div>

				{/* Chart */}
				{selectedBranches.size === 0 ? (
					<div
						className="text-center py-12"
						style={{ color: "var(--label-color)" }}
					>
						<p className="text-lg">
							Select at least one branch to view the distribution
						</p>
					</div>
				) : chartData.length === 0 ? (
					<div
						className="text-center py-12"
						style={{ color: "var(--label-color)" }}
					>
						<p className="text-lg">No placement data available</p>
					</div>
				) : (
					<div className="w-full h-[500px]">
						<ResponsiveContainer width="100%" height="100%">
							{chartType === "area" ? (
								<AreaChart
									data={chartData}
									margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
										className="text-xs"
										tick={{ fill: "var(--label-color)" }}
										label={{
											value: "Package Range (LPA)",
											position: "insideBottom",
											offset: -5,
											style: { fill: "var(--label-color)", fontSize: 12 },
										}}
									/>
									<YAxis
										className="text-xs"
										tick={{ fill: "var(--label-color)" }}
										label={{
											value: "Number of Students",
											angle: -90,
											position: "insideLeft",
											style: { fill: "var(--label-color)", fontSize: 12 },
										}}
									/>
									<Tooltip content={<CustomTooltip />} />
									<Legend
										wrapperStyle={{
											paddingTop: "20px",
										}}
										iconType="circle"
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
									margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-slate-200 dark:stroke-slate-700"
										opacity={0.3}
									/>
									<XAxis
										dataKey="range"
										className="text-xs"
										tick={{ fill: "var(--label-color)" }}
										label={{
											value: "Package Range (LPA)",
											position: "insideBottom",
											offset: -5,
											style: { fill: "var(--label-color)", fontSize: 12 },
										}}
									/>
									<YAxis
										className="text-xs"
										tick={{ fill: "var(--label-color)" }}
										label={{
											value: "Number of Students",
											angle: -90,
											position: "insideLeft",
											style: { fill: "var(--label-color)", fontSize: 12 },
										}}
									/>
									<Tooltip content={<CustomTooltip />} />
									<Legend
										wrapperStyle={{
											paddingTop: "20px",
										}}
										iconType="circle"
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
													strokeWidth={3}
													dot={{ r: 4, fill: color }}
													activeDot={{ r: 6 }}
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
										strokeWidth={4}
										strokeDasharray="5 5"
										dot={{
											r: 5,
											fill: "var(--text-color)",
											strokeWidth: 2,
											stroke: "var(--accent-color)",
										}}
										activeDot={{ r: 7 }}
										name="Overall (All Students)"
										animationDuration={1000}
										className="[stroke:var(--text-color)]"
									/>
								</RechartsLineChart>
							)}
						</ResponsiveContainer>
					</div>
				)}

				{/* Legend with statistics per branch */}
				{selectedBranches.size > 0 && (
					<div className="mt-6 space-y-3">
						{/* Overall statistics card - prominent */}
						<div
							className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed shadow-sm"
							style={{
								borderColor: "var(--text-color)",
								backgroundColor: "var(--accent-color)15",
							}}
						>
							<div className="flex items-center gap-3">
								<div
									className="w-4 h-4 rounded-full border-2"
									style={{
										backgroundColor: "var(--text-color)",
										borderColor: "var(--accent-color)",
									}}
								/>
								<span
									className="font-bold text-base"
									style={{ color: "var(--text-color)" }}
								>
									Overall (All Students - All Branches)
								</span>
							</div>
							<div className="text-right">
								<div
									className="text-sm"
									style={{ color: "var(--label-color)" }}
								>
									{stats.overallTotal} students
								</div>
								<div
									className="text-lg font-bold"
									style={{ color: "var(--text-color)" }}
								>
									₹{stats.overallAvg.toFixed(1)} LPA
								</div>
							</div>
						</div>

						{/* Individual branch statistics */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
											className="flex items-center justify-between p-3 rounded-lg border"
											style={{
												borderColor: color,
												backgroundColor: `${color}10`,
											}}
										>
											<div className="flex items-center gap-2">
												<div
													className="w-3 h-3 rounded-full"
													style={{ backgroundColor: color }}
												/>
												<span
													className="font-medium text-sm"
													style={{ color: "var(--text-color)" }}
												>
													{branch}
												</span>
											</div>
											<div className="text-right">
												<div
													className="text-xs"
													style={{ color: "var(--label-color)" }}
												>
													{branchStudents.length} students
												</div>
												<div
													className="text-sm font-semibold"
													style={{ color: "var(--text-color)" }}
												>
													₹{avgPkg.toFixed(1)} LPA
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
