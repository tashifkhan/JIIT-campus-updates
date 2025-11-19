"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	ComposedChart,
	Line,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Area,
} from "recharts";
import { Placement, getStudentPackage } from "@/lib/stats";

type Props = {
	placements: Placement[];
};

type TimeFrame = "day" | "month";
type MetricView = "count" | "package" | "combined";

export default function PlacementTimeline({ placements }: Props) {
	const [timeFrame, setTimeFrame] = useState<TimeFrame>("day");
	const [view, setView] = useState<MetricView>("combined");

	// Process data into time buckets
	const chartData = useMemo(() => {
		if (!placements.length) return [];

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

		// Group by date
		const groups: Record<
			string,
			{
				date: string;
				originalDate: Date;
				offers: number;
				students: number;
				packages: number[];
			}
		> = {};

		sorted.forEach((p) => {
			const key = getDateKey(p.derivedDate);
			if (!groups[key]) {
				groups[key] = {
					date: key,
					originalDate: p.derivedDate,
					offers: 0,
					students: 0,
					packages: [],
				};
			}

			groups[key].offers += 1;
			groups[key].students += p.students_selected.length;

			// Collect packages
			p.students_selected.forEach((s) => {
				const pkg = getStudentPackage(s, p);
				if (pkg && pkg > 0) {
					groups[key].packages.push(pkg);
				}
			});
		});

		// Calculate stats per group and convert to array
		return (
			Object.values(groups)
				.map((g) => {
					const avgPkg = g.packages.length
						? g.packages.reduce((a, b) => a + b, 0) / g.packages.length
						: 0;

					// Median
					const sortedPkgs = [...g.packages].sort((a, b) => a - b);
					const medianPkg = sortedPkgs.length
						? sortedPkgs.length % 2
							? sortedPkgs[(sortedPkgs.length - 1) >> 1]
							: (sortedPkgs[sortedPkgs.length / 2 - 1] +
									sortedPkgs[sortedPkgs.length / 2]) /
							  2
						: 0;

					return {
						date: g.date,
						timestamp: g.originalDate.getTime(), // for sorting if needed
						offers: g.offers,
						students: g.students,
						avgPackage: Number(avgPkg.toFixed(2)),
						medianPackage: Number(medianPkg.toFixed(2)),
					};
				})
				// Sort by timestamp to ensure correct order (especially for month view which might mix years if not careful, but our key logic handles it mostly. Better to sort by timestamp)
				.sort((a, b) => a.timestamp - b.timestamp)
		);
	}, [placements, timeFrame]);

	const CustomTooltip = ({ active, payload, label }: any) => {
		if (!active || !payload || !payload.length) return null;

		return (
			<div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
				<p className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
					{label}
				</p>
				<div className="space-y-1">
					{payload.map((entry: any, index: number) => (
						<div
							key={index}
							className="flex items-center justify-between gap-3"
						>
							<span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
								<div
									className="w-2 h-2 rounded-full"
									style={{ backgroundColor: entry.color }}
								/>
								{entry.name}:
							</span>
							<span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
								{entry.value} {entry.name.includes("Package") ? "LPA" : ""}
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
				<CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex items-center gap-2">
						<span style={{ color: "var(--text-color)" }}>
							Placement Timeline
						</span>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
							<Button
								variant={timeFrame === "day" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setTimeFrame("day")}
								className="h-7 text-xs"
							>
								Day
							</Button>
							<Button
								variant={timeFrame === "month" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setTimeFrame("month")}
								className="h-7 text-xs"
							>
								Month
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
				<div className="h-[400px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart
							data={chartData}
							margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								opacity={0.2}
								vertical={false}
							/>
							<XAxis
								dataKey="date"
								tick={{ fontSize: 12, fill: "var(--label-color)" }}
								tickMargin={10}
								minTickGap={30}
							/>
							<YAxis
								yAxisId="left"
								tick={{ fontSize: 12, fill: "var(--label-color)" }}
								tickFormatter={(value) => value.toLocaleString()}
							/>
							<YAxis
								yAxisId="right"
								orientation="right"
								tick={{ fontSize: 12, fill: "var(--label-color)" }}
								unit=" LPA"
								hide={view === "count"}
							/>
							<Tooltip content={<CustomTooltip />} />
							<Legend wrapperStyle={{ paddingTop: "20px" }} />

							{(view === "combined" || view === "count") && (
								<>
									<Bar
										yAxisId="left"
										dataKey="students"
										name="Students Placed"
										fill="#3b82f6"
										radius={[4, 4, 0, 0]}
										maxBarSize={50}
										fillOpacity={0.8}
									/>
									<Bar
										yAxisId="left"
										dataKey="offers"
										name="Offers Released"
										fill="#10b981"
										radius={[4, 4, 0, 0]}
										maxBarSize={50}
										fillOpacity={0.8}
									/>
								</>
							)}

							{(view === "combined" || view === "package") && (
								<>
									<Line
										yAxisId="right"
										type="monotone"
										dataKey="avgPackage"
										name="Avg Package"
										stroke="#f59e0b"
										strokeWidth={2}
										dot={{ r: 3 }}
										activeDot={{ r: 5 }}
									/>
									<Line
										yAxisId="right"
										type="monotone"
										dataKey="medianPackage"
										name="Median Package"
										stroke="#ec4899"
										strokeWidth={2}
										strokeDasharray="5 5"
										dot={{ r: 3 }}
									/>
								</>
							)}
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
