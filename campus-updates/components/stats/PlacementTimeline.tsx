"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	barY,
	colorLegend,
	defineChart,
	group,
	lineY,
} from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scaleOrdinal } from "@tanstack/charts/scales/ordinal";
import { scalePoint } from "@tanstack/charts/scales/point";
import { tooltip } from "@tanstack/charts/tooltip";
import { Placement, getStudentPackage } from "@/lib/stats";

type Props = {
	placements: Placement[];
	getBranch: (enrollment: string) => string;
};

type TimeFrame = "month" | "day";
type MetricView = "count" | "package" | "combined";

type TimelinePoint = {
	date: string;
	timestamp: number;
	uniqueStudents: number;
	totalOffers: number;
	avgPackage: number;
	medianPackage: number;
};

type SeriesRow = {
	date: string;
	series: string;
	value: number;
	unit: "" | "LPA";
};

// Exclude these branches
const EXCLUDED_BRANCHES = new Set(["JUIT", "Other", "MTech"]);

const COUNT_SERIES = ["Unique Students", "Total Offers"] as const;
const PACKAGE_SERIES = ["Avg Package", "Median Package"] as const;

const SERIES_COLORS: Record<string, string> = {
	"Unique Students": "#3b82f6",
	"Total Offers": "#10b981",
	"Avg Package": "#f59e0b",
	"Median Package": "#ec4899",
};

function toCountRows(points: TimelinePoint[]): SeriesRow[] {
	return points.flatMap((p) => [
		{
			date: p.date,
			series: "Unique Students",
			value: p.uniqueStudents,
			unit: "" as const,
		},
		{
			date: p.date,
			series: "Total Offers",
			value: p.totalOffers,
			unit: "" as const,
		},
	]);
}

function toPackageRows(points: TimelinePoint[]): SeriesRow[] {
	return points.flatMap((p) => [
		{
			date: p.date,
			series: "Avg Package",
			value: p.avgPackage,
			unit: "LPA" as const,
		},
		{
			date: p.date,
			series: "Median Package",
			value: p.medianPackage,
			unit: "LPA" as const,
		},
	]);
}

function buildCountDefinition(rows: SeriesRow[], isCumulative: boolean) {
	const seriesOrder = [...COUNT_SERIES];
	return defineChart({
		marks: [
			barY(rows, {
				id: "count-bars",
				x: "date",
				y: "value",
				z: "series",
				layout: group({ padding: 0.15 }),
				radius: 4,
				maxThickness: 50,
			}),
		],
		x: {
			scale: () => scaleBand<string>().padding(0.2),
			axis: {
				tickLabels: { rotate: -30, fontSize: 11 },
			},
		},
		y: {
			scale: scaleLinear,
			nice: true,
			grid: true,
			axis: {
				label: isCumulative ? "Cumulative count" : "Count",
				ticks: {
					format: (value) =>
						typeof value === "number" ? value.toLocaleString() : String(value),
				},
			},
		},
		color: {
			scale: () =>
				scaleOrdinal<string, string>()
					.domain(seriesOrder)
					.range(seriesOrder.map((s) => SERIES_COLORS[s])),
			legend: colorLegend({ label: "Metric", placement: "bottom" }),
		},
		svgAnimation: true,
		tooltip: {
			use: tooltip,
			formatGroup(points) {
				const date = String(points[0]?.xValue ?? "");
				const heading = isCumulative ? `${date} (Cumulative)` : date;
				return [
					heading,
					...points.map(
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

function buildPackageDefinition(rows: SeriesRow[], isCumulative: boolean) {
	const seriesOrder = [...PACKAGE_SERIES];
	return defineChart({
		marks: [
			lineY(
				rows.filter((r) => r.series === "Avg Package"),
				{
					id: "avg-package",
					x: "date",
					y: "value",
					z: "series",
					stroke: SERIES_COLORS["Avg Package"],
					strokeWidth: 2,
					points: true,
				}
			),
			lineY(
				rows.filter((r) => r.series === "Median Package"),
				{
					id: "median-package",
					x: "date",
					y: "value",
					z: "series",
					stroke: SERIES_COLORS["Median Package"],
					strokeWidth: 2,
					strokeDasharray: "5 5",
					points: true,
				}
			),
		],
		x: {
			scale: () => scalePoint<string>().padding(0.2),
			axis: {
				tickLabels: { rotate: -30, fontSize: 11 },
			},
		},
		y: {
			scale: scaleLinear,
			nice: true,
			grid: true,
			axis: {
				label: isCumulative ? "Cumulative package (LPA)" : "Package (LPA)",
				ticks: {
					format: (value) =>
						typeof value === "number" ? `${value}` : String(value),
				},
			},
		},
		color: {
			scale: () =>
				scaleOrdinal<string, string>()
					.domain(seriesOrder)
					.range(seriesOrder.map((s) => SERIES_COLORS[s])),
			legend: colorLegend({ label: "Metric", placement: "bottom" }),
		},
		svgAnimation: true,
		tooltip: {
			use: tooltip,
			formatGroup(points) {
				const date = String(points[0]?.xValue ?? "");
				const heading = isCumulative ? `${date} (Cumulative)` : date;
				return [
					heading,
					...points.map((point) => {
						const unit = point.datum.unit ? ` ${point.datum.unit}` : "";
						return `${point.groupLabel ?? point.datum.series}: ${Number(
							point.yValue ?? 0
						)}${unit}`;
					}),
				].join("\n");
			},
		},
	});
}

export default function PlacementTimeline({ placements, getBranch }: Props) {
	const [timeFrame, setTimeFrame] = useState<TimeFrame>("month");
	const [view, setView] = useState<MetricView>("combined");
	const [isCumulative, setIsCumulative] = useState(true);

	// Process data into time buckets
	const chartData = useMemo(() => {
		if (!placements.length) return [] as TimelinePoint[];

		// Helper to get date object from placement
		const getPlacementDate = (p: Placement): Date | null => {
			if (p.createdAt) return new Date(p.createdAt);
			if (p.saved_at) return new Date(p.saved_at);
			if (p._id) {
				try {
					const timestamp = parseInt(p._id.substring(0, 8), 16) * 1000;
					return new Date(timestamp);
				} catch {
					return null;
				}
			}
			return null;
		};

		// Helper to format date key
		const getDateKey = (date: Date) => {
			if (isNaN(date.getTime())) return "Unknown";

			if (timeFrame === "month") {
				return date.toLocaleString("default", {
					month: "short",
					year: "numeric",
				});
			}
			return date.toISOString().split("T")[0]; // YYYY-MM-DD
		};

		// Sort placements by date
		const sorted = [...placements]
			.map((p) => ({ ...p, derivedDate: getPlacementDate(p) }))
			.filter(
				(p): p is Placement & { derivedDate: Date } => p.derivedDate !== null
			)
			.sort((a, b) => a.derivedDate.getTime() - b.derivedDate.getTime());

		// Group by date first
		const groups: Record<
			string,
			{
				date: string;
				originalDate: Date;
				uniqueEnrollments: Set<string>;
				totalOffers: number;
				studentMaxPackages: Map<string, number>;
			}
		> = {};

		sorted.forEach((p) => {
			const key = getDateKey(p.derivedDate);
			if (!groups[key]) {
				groups[key] = {
					date: key,
					originalDate: p.derivedDate,
					uniqueEnrollments: new Set(),
					totalOffers: 0,
					studentMaxPackages: new Map(),
				};
			}

			// Process students
			p.students_selected.forEach((s) => {
				// Filter by branch
				const branch = getBranch(s.enrollment_number);
				if (EXCLUDED_BRANCHES.has(branch)) return;

				// Add to stats
				groups[key].totalOffers += 1;
				if (s.enrollment_number) {
					groups[key].uniqueEnrollments.add(s.enrollment_number);

					const pkg = getStudentPackage(s, p);
					if (pkg && pkg > 0) {
						const currentMax =
							groups[key].studentMaxPackages.get(s.enrollment_number) || 0;
						if (pkg > currentMax) {
							groups[key].studentMaxPackages.set(s.enrollment_number, pkg);
						}
					}
				}
			});
		});

		// Convert to array and sort by time
		const sortedGroups = Object.values(groups)
			.map((g) => ({
				...g,
				timestamp: g.originalDate.getTime(),
			}))
			.sort((a, b) => a.timestamp - b.timestamp);

		// If cumulative, process running totals
		if (isCumulative) {
			const runningUniqueStudents = new Set<string>();
			let runningTotalOffers = 0;
			const runningStudentMaxPackages = new Map<string, number>();

			const result = sortedGroups.map((g) => {
				// Update running totals
				g.uniqueEnrollments.forEach((s) => runningUniqueStudents.add(s));
				runningTotalOffers += g.totalOffers;

				// Update running max packages
				g.studentMaxPackages.forEach((pkg, enrollment) => {
					const current = runningStudentMaxPackages.get(enrollment) || 0;
					if (pkg > current) {
						runningStudentMaxPackages.set(enrollment, pkg);
					}
				});

				const currentPackages = Array.from(runningStudentMaxPackages.values());

				// Calculate cumulative stats
				const avgPkg = currentPackages.length
					? currentPackages.reduce((a, b) => a + b, 0) / currentPackages.length
					: 0;

				// Median
				const sortedPkgs = [...currentPackages].sort((a, b) => a - b);
				const medianPkg = sortedPkgs.length
					? sortedPkgs.length % 2
						? sortedPkgs[(sortedPkgs.length - 1) >> 1]
						: (sortedPkgs[sortedPkgs.length / 2 - 1] +
								sortedPkgs[sortedPkgs.length / 2]) /
						  2
					: 0;

				return {
					date: g.date,
					timestamp: g.originalDate.getTime(),
					uniqueStudents: runningUniqueStudents.size,
					totalOffers: runningTotalOffers,
					avgPackage: Number(avgPkg.toFixed(2)),
					medianPackage: Number(medianPkg.toFixed(2)),
				};
			});
			return result;
		}

		// Non-cumulative (Individual)
		const result = sortedGroups.map((g) => {
			const currentPackages = Array.from(g.studentMaxPackages.values());

			const avgPkg = currentPackages.length
				? currentPackages.reduce((a, b) => a + b, 0) / currentPackages.length
				: 0;

			const sortedPkgs = [...currentPackages].sort((a, b) => a - b);
			const medianPkg = sortedPkgs.length
				? sortedPkgs.length % 2
					? sortedPkgs[(sortedPkgs.length - 1) >> 1]
					: (sortedPkgs[sortedPkgs.length / 2 - 1] +
							sortedPkgs[sortedPkgs.length / 2]) /
					  2
				: 0;

			return {
				date: g.date,
				timestamp: g.originalDate.getTime(),
				uniqueStudents: g.uniqueEnrollments.size,
				totalOffers: g.totalOffers,
				avgPackage: Number(avgPkg.toFixed(2)),
				medianPackage: Number(medianPkg.toFixed(2)),
			};
		});
		return result;
	}, [placements, timeFrame, getBranch, isCumulative]);

	const countRows = useMemo(() => toCountRows(chartData), [chartData]);
	const packageRows = useMemo(() => toPackageRows(chartData), [chartData]);

	const countDefinition = useMemo(
		() =>
			countRows.length
				? buildCountDefinition(countRows, isCumulative)
				: null,
		[countRows, isCumulative]
	);

	const packageDefinition = useMemo(
		() =>
			packageRows.length
				? buildPackageDefinition(packageRows, isCumulative)
				: null,
		[packageRows, isCumulative]
	);

	return (
		<Card className="card-theme">
			<CardHeader>
				<CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex items-center gap-2">
						<span style={{ color: "var(--text-color)" }}>
							Placement Timeline
						</span>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
							<Button
								variant={isCumulative ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setIsCumulative(true)}
								className="h-7 text-xs"
							>
								Cumulative
							</Button>
							<Button
								variant={!isCumulative ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setIsCumulative(false)}
								className="h-7 text-xs"
							>
								Individual
							</Button>
						</div>

						<div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

						<div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
							<Button
								variant={timeFrame === "month" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setTimeFrame("month")}
								className="h-7 text-xs"
							>
								Month
							</Button>
							<Button
								variant={timeFrame === "day" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setTimeFrame("day")}
								className="h-7 text-xs"
							>
								Day
							</Button>
						</div>

						<div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

						<div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
							<Button
								variant={view === "combined" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setView("combined")}
								className="h-7 text-xs"
							>
								All
							</Button>
							<Button
								variant={view === "count" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setView("count")}
								className="h-7 text-xs"
							>
								Counts
							</Button>
							<Button
								variant={view === "package" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setView("package")}
								className="h-7 text-xs"
							>
								Packages
							</Button>
						</div>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div
						className="text-center py-12"
						style={{ color: "var(--label-color)" }}
					>
						<p>No timeline data available</p>
					</div>
				) : view === "combined" ? (
					<div className="space-y-6">
						{countDefinition && (
							<div className="h-[280px] w-full">
								<p
									className="mb-2 text-xs font-medium"
									style={{ color: "var(--label-color)" }}
								>
									Offer counts
								</p>
								<Chart
									definition={countDefinition}
									height={250}
									initialWidth={960}
									ariaLabel="Placement timeline counts"
									className="h-full w-full"
								/>
							</div>
						)}
						{packageDefinition && (
							<div className="h-[280px] w-full">
								<p
									className="mb-2 text-xs font-medium"
									style={{ color: "var(--label-color)" }}
								>
									Package trends (LPA)
								</p>
								<Chart
									definition={packageDefinition}
									height={250}
									initialWidth={960}
									ariaLabel="Placement timeline packages"
									className="h-full w-full"
								/>
							</div>
						)}
					</div>
				) : view === "count" && countDefinition ? (
					<div className="h-[400px] w-full">
						<Chart
							definition={countDefinition}
							height={380}
							initialWidth={960}
							ariaLabel="Placement timeline counts"
							className="h-full w-full"
						/>
					</div>
				) : packageDefinition ? (
					<div className="h-[400px] w-full">
						<Chart
							definition={packageDefinition}
							height={380}
							initialWidth={960}
							ariaLabel="Placement timeline packages"
							className="h-full w-full"
						/>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
