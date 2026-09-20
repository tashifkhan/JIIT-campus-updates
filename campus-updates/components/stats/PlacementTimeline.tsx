"use client";

import { useState } from "react";
import {
	Bar,
	CartesianGrid,
	ComposedChart,
	Legend,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimelineStats } from "@/lib/hooks/useStatsDashboard";

type Props = {
	query: string;
	enabled: boolean;
};

type TimeFrame = "month" | "day";
type MetricView = "count" | "package" | "combined";

function TimelineTooltip({ active, payload, label, cumulative }: any) {
	if (!active || !payload?.length) return null;
	return (
		<div className="bg-card border border-border rounded-lg shadow-lg p-3">
			<p className="font-semibold mb-2 text-foreground">
				{label} {cumulative ? "(Cumulative)" : ""}
			</p>
			<div className="space-y-1">
				{payload.map((entry: any) => (
					<div
						key={entry.dataKey}
						className="flex items-center justify-between gap-3"
					>
						<span className="text-sm text-muted-foreground flex items-center gap-2">
							<span
								className="w-2 h-2 rounded-full"
								style={{ backgroundColor: entry.color }}
							/>
							{entry.name}:
						</span>
						<span className="text-sm font-semibold text-foreground">
							{entry.value} {entry.name.includes("Package") ? "LPA" : ""}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export default function PlacementTimeline({ query, enabled }: Props) {
	const [timeFrame, setTimeFrame] = useState<TimeFrame>("month");
	const [view, setView] = useState<MetricView>("combined");
	const [isCumulative, setIsCumulative] = useState(true);
	const timelineQuery = useTimelineStats(query, timeFrame, isCumulative, enabled);
	const chartData = timelineQuery.data || [];

	return (
		<Card className="card-theme">
			<CardHeader>
				<CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<span className="text-foreground">Placement Timeline</span>
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center bg-muted rounded-lg p-1">
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

						<div className="flex items-center bg-muted rounded-lg p-1">
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

						<div className="flex items-center bg-muted rounded-lg p-1">
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
				{timelineQuery.isLoading ? (
					<div className="h-[400px] animate-pulse rounded-lg bg-muted" />
				) : timelineQuery.error ? (
					<div className="h-[400px] flex items-center justify-center text-destructive">
						{timelineQuery.error instanceof Error
							? timelineQuery.error.message
							: "Failed to load timeline."}
					</div>
				) : chartData.length === 0 ? (
					<div className="h-[400px] flex items-center justify-center text-muted-foreground">
						No timeline data for current filters.
					</div>
				) : (
					<div className="h-[400px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<ComposedChart
								data={chartData}
								margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
							>
								<CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
								<XAxis
									dataKey="date"
									tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
									tickMargin={10}
									minTickGap={30}
								/>
								<YAxis
									yAxisId="left"
									tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
								/>
								<YAxis
									yAxisId="right"
									orientation="right"
									tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
									unit=" LPA"
									hide={view === "count"}
								/>
								<Tooltip content={<TimelineTooltip cumulative={isCumulative} />} />
								<Legend wrapperStyle={{ paddingTop: "20px" }} />
								<Bar
									yAxisId="left"
									dataKey="uniqueStudents"
									name="Unique Students"
									fill="var(--chart-1)"
									radius={[4, 4, 0, 0]}
									hide={view === "package"}
								/>
								<Bar
									yAxisId="left"
									dataKey="totalOffers"
									name="Total Offers"
									fill="var(--chart-2)"
									radius={[4, 4, 0, 0]}
									hide={view === "package"}
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="avgPackage"
									name="Avg Package"
									stroke="var(--chart-2)"
									strokeWidth={2}
									hide={view === "count"}
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="medianPackage"
									name="Median Package"
									stroke="var(--chart-1)"
									strokeWidth={2}
									strokeDasharray="5 5"
									hide={view === "count"}
								/>
							</ComposedChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
