"use client";

import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useTimelineStats } from "@/lib/hooks/useStatsDashboard";
import { cn } from "@/lib/utils";

type Props = {
	query: string;
	enabled: boolean;
};

type TimeFrame = "month" | "day";
type MetricView = "count" | "package" | "combined";
type PendingControl = "series" | "timeFrame" | null;

const SKELETON_BARS = [42, 68, 31, 84, 55, 73, 38, 61, 92, 47, 66, 29, 78, 52, 70];

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

function Spinner({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"inline-block rounded-full border-2 border-current border-t-transparent animate-spin",
				className,
			)}
		/>
	);
}

function TimelineSkeleton() {
	return (
		<div className="h-[400px] w-full flex flex-col gap-3" aria-hidden="true">
			<div className="flex-1 flex gap-3">
				<div className="w-10 flex flex-col justify-between py-1">
					{Array.from({ length: 5 }, (_, index) => (
						<Skeleton key={index} className="h-3 w-8" />
					))}
				</div>
				<div className="flex-1 flex items-end gap-[2%] border-b border-l border-border/60 px-2 pb-px">
					{SKELETON_BARS.map((height, index) => (
						<Skeleton
							key={index}
							className="flex-1 rounded-b-none"
							style={{ height: `${height}%` }}
						/>
					))}
				</div>
				<div className="w-10 flex flex-col justify-between py-1">
					{Array.from({ length: 5 }, (_, index) => (
						<Skeleton key={index} className="h-3 w-9" />
					))}
				</div>
			</div>
			<div className="flex justify-between px-12">
				{Array.from({ length: 6 }, (_, index) => (
					<Skeleton key={index} className="h-3 w-16" />
				))}
			</div>
			<div className="flex justify-center gap-6 pt-2">
				{Array.from({ length: 4 }, (_, index) => (
					<Skeleton key={index} className="h-3 w-24" />
				))}
			</div>
		</div>
	);
}

export default function PlacementTimeline({ query, enabled }: Props) {
	const [timeFrame, setTimeFrame] = useState<TimeFrame>("month");
	const [view, setView] = useState<MetricView>("combined");
	const [isCumulative, setIsCumulative] = useState(true);
	const [pendingControl, setPendingControl] = useState<PendingControl>(null);
	const timelineQuery = useTimelineStats(query, timeFrame, isCumulative, enabled);
	const chartData = timelineQuery.data || [];

	const isRefreshing = timelineQuery.isFetching && !timelineQuery.isLoading;

	// No dependency array: a toggle served straight from cache never flips
	// isFetching, so the pending marker has to be cleared on the next render.
	useEffect(() => {
		if (!timelineQuery.isFetching && pendingControl) setPendingControl(null);
	});

	// Only mark a toggle as pending while a fetch is actually in flight.
	const activePending = isRefreshing ? pendingControl : null;

	const changeSeries = (next: boolean) => {
		if (next === isCumulative) return;
		setPendingControl("series");
		setIsCumulative(next);
	};

	const changeTimeFrame = (next: TimeFrame) => {
		if (next === timeFrame) return;
		setPendingControl("timeFrame");
		setTimeFrame(next);
	};

	return (
		<Card className="card-theme">
			<CardHeader>
				<CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<span className="text-foreground flex items-center gap-2">
						Placement Timeline
						{isRefreshing && !activePending ? (
							<Spinner className="w-3.5 h-3.5 text-muted-foreground" />
						) : null}
					</span>
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex items-center bg-muted rounded-lg p-1">
							<Button
								variant={isCumulative ? "secondary" : "ghost"}
								size="sm"
								onClick={() => changeSeries(true)}
								className="h-7 text-xs gap-1.5"
							>
								{activePending === "series" && isCumulative ? (
									<Spinner className="w-3 h-3" />
								) : null}
								Cumulative
							</Button>
							<Button
								variant={!isCumulative ? "secondary" : "ghost"}
								size="sm"
								onClick={() => changeSeries(false)}
								className="h-7 text-xs gap-1.5"
							>
								{activePending === "series" && !isCumulative ? (
									<Spinner className="w-3 h-3" />
								) : null}
								Individual
							</Button>
						</div>

						<div className="flex items-center bg-muted rounded-lg p-1">
							<Button
								variant={timeFrame === "month" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => changeTimeFrame("month")}
								className="h-7 text-xs gap-1.5"
							>
								{activePending === "timeFrame" && timeFrame === "month" ? (
									<Spinner className="w-3 h-3" />
								) : null}
								Month
							</Button>
							<Button
								variant={timeFrame === "day" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => changeTimeFrame("day")}
								className="h-7 text-xs gap-1.5"
							>
								{activePending === "timeFrame" && timeFrame === "day" ? (
									<Spinner className="w-3 h-3" />
								) : null}
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
					<TimelineSkeleton />
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
					<div className="relative" aria-busy={isRefreshing}>
						<div
							className={cn(
								"h-[400px] w-full transition-opacity duration-200",
								isRefreshing && "opacity-40",
							)}
						>
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
									<Tooltip
										content={<TimelineTooltip cumulative={isCumulative} />}
										active={isRefreshing ? false : undefined}
									/>
									<Legend wrapperStyle={{ paddingTop: "20px" }} />
									<Bar
										yAxisId="left"
										dataKey="uniqueStudents"
										name="Unique Students"
										fill="var(--chart-1)"
										radius={[4, 4, 0, 0]}
										hide={view === "package"}
										isAnimationActive={false}
									/>
									<Bar
										yAxisId="left"
										dataKey="totalOffers"
										name="Total Offers"
										fill="var(--chart-2)"
										radius={[4, 4, 0, 0]}
										hide={view === "package"}
										isAnimationActive={false}
									/>
									<Line
										yAxisId="right"
										type="monotone"
										dataKey="avgPackage"
										name="Avg Package"
										stroke="var(--chart-2)"
										strokeWidth={2}
										hide={view === "count"}
										isAnimationActive={false}
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
										isAnimationActive={false}
									/>
								</ComposedChart>
							</ResponsiveContainer>
						</div>

						{isRefreshing ? (
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 shadow-lg">
									<Spinner className="w-4 h-4 text-primary" />
									<span className="text-sm text-muted-foreground">
										Updating timeline
									</span>
								</div>
							</div>
						) : null}
					</div>
				)}

				<p className="sr-only" role="status" aria-live="polite">
					{timelineQuery.isLoading
						? "Loading placement timeline"
						: isRefreshing
							? "Updating placement timeline"
							: `Showing ${chartData.length} ${timeFrame === "day" ? "daily" : "monthly"} ${isCumulative ? "cumulative" : "individual"} points`}
				</p>
			</CardContent>
		</Card>
	);
}
