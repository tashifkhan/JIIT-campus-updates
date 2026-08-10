"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	areaY,
	colorLegend,
	defineChart,
	lineY,
} from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scaleOrdinal } from "@tanstack/charts/scales/ordinal";
import { scalePoint } from "@tanstack/charts/scales/point";
import { tooltip } from "@tanstack/charts/tooltip";
import type { StudentWithPlacement } from "@/lib/stats";
import { getStudentPackage } from "@/lib/stats";
import { BranchPicker } from "./BranchPicker";

type Props = {
	students: StudentWithPlacement[];
	getBranch: (enrollment: string) => string;
};

type DistRow = {
	range: string;
	series: string;
	value: number;
};

// Color palette for branches - vibrant and distinguishable colors (excluded: JUIT, Other, MTech)
const BRANCH_COLORS: Record<string, string> = {
	CSE: "#3b82f6", // blue
	ECE: "#f59e0b", // amber
	IT: "#10b981", // emerald
	"Intg. MTech": "#ec4899", // pink
	Biotech: "#14b8a6", // teal
};

const DEFAULT_COLOR = "#94a3b8"; // slate-400
const OVERALL_COLOR = "currentColor";
const OVERALL_SERIES = "Overall (All offers)";

// Default branches to select (case-insensitive)
const DEFAULT_SELECTED = ["CSE", "IT", "ECE"];
const DEFAULT_SELECTED_UPPER = DEFAULT_SELECTED.map((s) => s.toUpperCase());

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

// Excluded branches from all displays
const EXCLUDED_BRANCHES = new Set(["JUIT", "Other", "MTech"]);

const PACKAGE_RANGES = [
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
] as const;

function buildDistributionDefinition(
	rows: DistRow[],
	options: {
		seriesOrder: string[];
		chartType: "area" | "line";
		showLegend: boolean;
		ariaLabel: string;
	}
) {
	const { seriesOrder, chartType, showLegend } = options;
	const colorRange = seriesOrder.map((series) =>
		series === OVERALL_SERIES ? OVERALL_COLOR : getBranchColor(series)
	);

	const branchRows = rows.filter((r) => r.series !== OVERALL_SERIES);
	const overallRows = rows.filter((r) => r.series === OVERALL_SERIES);

	const marks =
		chartType === "area"
			? [
					...(branchRows.length
						? [
								areaY(branchRows, {
									id: "branches-area",
									x: "range",
									y: "value",
									z: "series",
									fillOpacity: 0.35,
									strokeWidth: 2,
								}),
						  ]
						: []),
					...(overallRows.length
						? [
								areaY(overallRows, {
									id: "overall-area",
									x: "range",
									y: "value",
									z: "series",
									fill: OVERALL_COLOR,
									fillOpacity: 0.12,
									stroke: OVERALL_COLOR,
									strokeWidth: 3,
								}),
								lineY(overallRows, {
									id: "overall-line",
									x: "range",
									y: "value",
									z: "series",
									stroke: OVERALL_COLOR,
									strokeWidth: 3,
									strokeDasharray: "5 5",
								}),
						  ]
						: []),
			  ]
			: [
					...(branchRows.length
						? [
								lineY(branchRows, {
									id: "branches-line",
									x: "range",
									y: "value",
									z: "series",
									strokeWidth: 2,
									points: true,
								}),
						  ]
						: []),
					...(overallRows.length
						? [
								lineY(overallRows, {
									id: "overall-line",
									x: "range",
									y: "value",
									z: "series",
									stroke: OVERALL_COLOR,
									strokeWidth: 3,
									strokeDasharray: "5 5",
									points: true,
								}),
						  ]
						: []),
			  ];

	return defineChart({
		marks,
		x: {
			scale: () => scalePoint<string>().padding(0.15),
			axis: {
				tickLabels: {
					rotate: -45,
					fontSize: 11,
				},
			},
		},
		y: {
			scale: scaleLinear,
			nice: true,
			grid: true,
			axis: {
				label: "Offers",
				ticks: {
					format: (value) =>
						typeof value === "number" ? value.toLocaleString() : String(value),
				},
			},
		},
		color: {
			scale: () =>
				scaleOrdinal<string, string>().domain(seriesOrder).range(colorRange),
			...(showLegend
				? { legend: colorLegend({ label: "Series", placement: "bottom" }) }
				: {}),
		},
		svgAnimation: true,
		tooltip: {
			use: tooltip,
			formatGroup(points) {
				const range = points[0]?.xValue;
				const heading = `Package Range: ₹${String(range ?? "")} LPA`;
				const sorted = [...points].sort(
					(a, b) => (Number(b.yValue) || 0) - (Number(a.yValue) || 0)
				);
				return [
					heading,
					...sorted.map(
						(point) =>
							`${point.groupLabel ?? point.datum.series}: ${Number(
								point.yValue ?? 0
							).toLocaleString()}`
					),
				].join("\n");
			},
		},
	});
}

export default function PlacementDistributionChart({
	students,
	getBranch,
}: Props) {
	// Get all unique branches from students (excluding JUIT, Other, MTech)
	const availableBranches = useMemo(() => {
		const branches = new Set<string>();
		students.forEach((s) => {
			const branch = getBranch(s.enrollment_number);
			if (branch && !EXCLUDED_BRANCHES.has(branch)) {
				branches.add(branch);
			}
		});
		return Array.from(branches).sort();
	}, [students, getBranch]);

	// State for selected branches (initially select only DEFAULT_SELECTED if available)
	const [selectedBranches, setSelectedBranches] = useState<Set<string>>(
		new Set(
			availableBranches.filter((b) =>
				DEFAULT_SELECTED_UPPER.includes(b.toUpperCase())
			)
		)
	);

	// When availableBranches changes, apply defaults if user hasn't selected any of the default branches yet.
	useEffect(() => {
		if (availableBranches.length === 0) return;

		const hasAnyDefaultSelected = Array.from(selectedBranches).some((s) =>
			DEFAULT_SELECTED_UPPER.includes(s.toUpperCase())
		);

		if (!hasAnyDefaultSelected) {
			const initial = new Set(
				availableBranches.filter((b) =>
					DEFAULT_SELECTED_UPPER.includes(b.toUpperCase())
				)
			);
			if (initial.size > 0) {
				setSelectedBranches(initial);
			}
		}
	}, [availableBranches, selectedBranches]);

	// State for chart type (area or line)
	const [chartType, setChartType] = useState<"area" | "line">("area");

	// State for branch-specific view
	const [showBranchSpecific, setShowBranchSpecific] = useState(false);

	// Toggle branch selection
	const handleBranchChange = (branches: Set<string>) => {
		setSelectedBranches(branches);
	};

	// Wide-format counts for stats/legend, long-format for TanStack Charts
	const { chartDataWide, longSeries } = useMemo(() => {
		if (selectedBranches.size === 0) {
			return { chartDataWide: [] as any[], longSeries: [] as DistRow[] };
		}

		const wide = PACKAGE_RANGES.map((range) => {
			const point: Record<string, string | number> = {
				range: range.label,
				Overall: 0,
			};
			selectedBranches.forEach((branch) => {
				point[branch] = 0;
			});
			return point;
		});

		students.forEach((student) => {
			const branch = getBranch(student.enrollment_number);
			const pkg = getStudentPackage(student, student.placement);
			if (pkg == null || pkg <= 0) return;

			const rangeIndex = PACKAGE_RANGES.findIndex(
				(r) => pkg >= r.min && pkg < r.max
			);
			if (rangeIndex < 0) return;

			wide[rangeIndex].Overall = (Number(wide[rangeIndex].Overall) || 0) + 1;

			if (selectedBranches.has(branch)) {
				wide[rangeIndex][branch] =
					(Number(wide[rangeIndex][branch]) || 0) + 1;
			}
		});

		const long: DistRow[] = [];
		for (const point of wide) {
			const range = String(point.range);
			for (const branch of Array.from(selectedBranches).sort()) {
				long.push({
					range,
					series: branch,
					value: Number(point[branch]) || 0,
				});
			}
			long.push({
				range,
				series: OVERALL_SERIES,
				value: Number(point.Overall) || 0,
			});
		}

		return { chartDataWide: wide, longSeries: long };
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

	const sortedBranches = useMemo(
		() => Array.from(selectedBranches).sort(),
		[selectedBranches]
	);

	const combinedDefinition = useMemo(() => {
		if (longSeries.length === 0 || sortedBranches.length === 0) return null;
		return buildDistributionDefinition(longSeries, {
			seriesOrder: [...sortedBranches, OVERALL_SERIES],
			chartType,
			showLegend: true,
			ariaLabel: "Placement distribution across packages by branch",
		});
	}, [longSeries, sortedBranches, chartType]);

	const individualDefinitions = useMemo(() => {
		if (longSeries.length === 0) return [];
		return sortedBranches.map((branch) => {
			const rows = longSeries.filter((r) => r.series === branch);
			return {
				branch,
				definition: buildDistributionDefinition(rows, {
					seriesOrder: [branch],
					chartType,
					showLegend: false,
					ariaLabel: `Placement distribution for ${branch}`,
				}),
			};
		});
	}, [longSeries, sortedBranches, chartType]);

	return (
		<Card className="card-theme">
			<CardHeader>
				<CardTitle
					className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4"
					style={{ color: "var(--text-color)" }}
				>
					<div className="flex items-center gap-2">
						<span className="text-base sm:text-lg lg:text-xl">
							Placement Distribution Across Packages
						</span>
					</div>

					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
						<div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
							<div className="flex items-center gap-1.5 sm:gap-2">
								<span style={{ color: "var(--label-color)" }}>offers:</span>
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
							<BranchPicker
								availableBranches={availableBranches}
								selectedBranches={selectedBranches}
								onChange={handleBranchChange}
							/>

							<div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
								<Button
									variant={chartType === "area" ? "secondary" : "ghost"}
									size="sm"
									onClick={() => setChartType("area")}
									className="h-7 text-xs"
								>
									Area
								</Button>
								<Button
									variant={chartType === "line" ? "secondary" : "ghost"}
									size="sm"
									onClick={() => setChartType("line")}
									className="h-7 text-xs"
								>
									Line
								</Button>
							</div>

							<div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

							<div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
								<Button
									variant={!showBranchSpecific ? "secondary" : "ghost"}
									size="sm"
									onClick={() => setShowBranchSpecific(false)}
									className="h-7 text-xs"
								>
									Combined
								</Button>
								<Button
									variant={showBranchSpecific ? "secondary" : "ghost"}
									size="sm"
									onClick={() => setShowBranchSpecific(true)}
									className="h-7 text-xs"
								>
									Individual
								</Button>
							</div>
						</div>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
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
				) : chartDataWide.length === 0 ? (
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
						{individualDefinitions.map(({ branch, definition }) => {
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
												{branchStudents.length} offers
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
										<Chart
											definition={definition}
											height={280}
											initialWidth={640}
											ariaLabel={`Placement distribution for ${branch}`}
											className="h-full w-full"
										/>
									</div>
								</div>
							);
						})}
					</div>
				) : combinedDefinition ? (
					// Combined graph
					<div className="w-full h-[300px] sm:h-[400px] lg:h-[500px]">
						<Chart
							definition={combinedDefinition}
							height={460}
							initialWidth={960}
							ariaLabel="Placement distribution across packages by branch"
							className="h-full w-full"
						/>
					</div>
				) : null}

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
									Overall (All offers)
								</span>
							</div>
							<div className="text-left sm:text-right pl-5 sm:pl-0">
								<div
									className="text-xs sm:text-sm"
									style={{ color: "var(--label-color)" }}
								>
									{stats.overallTotal} offers
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
							{sortedBranches.map((branch) => {
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
