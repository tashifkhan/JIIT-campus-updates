"use client";

import { useEffect, useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { BranchPicker } from "@/components/stats/BranchPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BranchStatsData } from "@/lib/stats-api";

type Props = {
	data: BranchStatsData["distribution"];
};

const BRANCH_COLORS: Record<string, string> = {
	CSE: "var(--chart-1)",
	ECE: "var(--chart-2)",
	IT: "var(--chart-3)",
	"Intg. MTech": "var(--chart-4)",
	BT: "var(--chart-5)",
};
const DEFAULT_SELECTED = new Set(["CSE", "IT", "ECE"]);

function branchColor(branch: string): string {
	const normalized = branch.trim().split(/\s+/).join(" ");
	const key = Object.keys(BRANCH_COLORS).find(
		(candidate) => candidate.toLowerCase() === normalized.toLowerCase(),
	);
	return key ? BRANCH_COLORS[key] : "var(--muted-foreground)";
}

function initialBranches(availableBranches: string[]): Set<string> {
	return new Set(availableBranches.filter((branch) => DEFAULT_SELECTED.has(branch)));
}

function DistributionTooltip({ active, payload, label }: any) {
	if (!active || !payload?.length) return null;
	return (
		<div className="bg-card border border-border rounded-lg shadow-lg p-3">
			<p className="font-semibold mb-2 text-foreground">
				Package Range: ₹{label} LPA
			</p>
			<div className="space-y-1">
				{[...payload]
					.sort((left: any, right: any) => right.value - left.value)
					.map((entry: any) => (
						<div
							key={entry.dataKey}
							className="flex items-center justify-between gap-3"
						>
							<div className="flex items-center gap-2">
								<div
									className="w-3 h-3 rounded-full"
									style={{ backgroundColor: entry.color }}
								/>
								<span className="text-sm text-muted-foreground">{entry.name}</span>
							</div>
							<span className="text-sm font-semibold text-foreground">
								{entry.value}
							</span>
						</div>
					))}
			</div>
		</div>
	);
}

function ChartAxes() {
	return (
		<>
			<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
			<XAxis
				dataKey="range"
				tick={{ fill: "var(--label-color)" }}
				angle={-45}
				textAnchor="end"
				height={60}
			/>
			<YAxis tick={{ fill: "var(--label-color)" }} width={35} />
			<Tooltip content={<DistributionTooltip />} />
		</>
	);
}

export default function PlacementDistributionChart({ data }: Props) {
	const [selectedBranches, setSelectedBranches] = useState<Set<string>>(() =>
		initialBranches(data.availableBranches),
	);
	const [chartType, setChartType] = useState<"area" | "line">("area");
	const [showBranchSpecific, setShowBranchSpecific] = useState(false);

	useEffect(() => {
		setSelectedBranches((current) => {
			const available = new Set(data.availableBranches);
			const retained = new Set(
				Array.from(current).filter((branch) => available.has(branch)),
			);
			return retained.size ? retained : initialBranches(data.availableBranches);
		});
	}, [data.availableBranches]);

	const selected = Array.from(selectedBranches).sort();
	const selectedOffers = selected.reduce(
		(sum, branch) => sum + (data.branches[branch]?.offers || 0),
		0,
	);
	const selectedPackageCount = selected.reduce(
		(sum, branch) => sum + (data.branches[branch]?.packageCount || 0),
		0,
	);
	const selectedAverage = selectedPackageCount
		? selected.reduce(
				(sum, branch) =>
					sum +
					(data.branches[branch]?.avgPackage || 0) *
						(data.branches[branch]?.packageCount || 0),
				0,
		) / selectedPackageCount
		: data.overall.avgPackage;

	return (
		<Card className="card-theme">
			<CardHeader>
				<CardTitle className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 text-foreground">
					<span className="text-base sm:text-lg lg:text-xl">
						Placement Distribution Across Packages
					</span>
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
						<div className="flex items-center gap-3 text-xs sm:text-sm">
							<span className="text-muted-foreground">
								offers: <strong className="text-foreground">{selectedOffers}</strong>
							</span>
							<span className="text-muted-foreground">
								Avg Package:{" "}
								<strong className="text-foreground">
									₹{selectedAverage.toFixed(1)} LPA
								</strong>
							</span>
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<BranchPicker
								availableBranches={data.availableBranches}
								selectedBranches={selectedBranches}
								onChange={setSelectedBranches}
							/>
							<div className="flex items-center bg-muted rounded-lg p-1">
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
							<div className="flex items-center bg-muted rounded-lg p-1">
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
				{selected.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						Select at least one branch to view the distribution
					</div>
				) : showBranchSpecific ? (
					<div className="space-y-6">
						{selected.map((branch) => {
							const color = branchColor(branch);
							const branchStats = data.branches[branch];
							return (
								<div
									key={branch}
									className="rounded-lg border-2 p-3 sm:p-4"
									style={{
										borderColor: color,
										backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)`,
									}}
								>
									<div className="flex items-center justify-between mb-3">
										<h3 className="font-semibold text-foreground">{branch}</h3>
										<div className="text-right text-xs sm:text-sm text-muted-foreground">
											{branchStats?.offers || 0} offers
											<span className="ml-2 font-semibold text-foreground">
												₹{(branchStats?.avgPackage || 0).toFixed(1)} LPA
											</span>
										</div>
									</div>
									<div className="w-full h-[250px] sm:h-[300px]">
										<ResponsiveContainer width="100%" height="100%">
											{chartType === "area" ? (
												<AreaChart data={data.points}>
													<ChartAxes />
													<Area
														type="monotone"
														dataKey={branch}
														stroke={color}
														fill={color}
														fillOpacity={0.2}
														strokeWidth={3}
													/>
												</AreaChart>
											) : (
												<LineChart data={data.points}>
													<ChartAxes />
													<Line
														type="monotone"
														dataKey={branch}
														stroke={color}
														strokeWidth={3}
													/>
												</LineChart>
											)}
										</ResponsiveContainer>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<>
						<div className="w-full h-[300px] sm:h-[400px] lg:h-[500px]">
							<ResponsiveContainer width="100%" height="100%">
								{chartType === "area" ? (
									<AreaChart data={data.points}>
										<ChartAxes />
										<Legend />
										{selected.map((branch) => (
											<Area
												key={branch}
												type="monotone"
												dataKey={branch}
												stroke={branchColor(branch)}
												fill={branchColor(branch)}
												fillOpacity={0.15}
											/>
										))}
										<Area
											type="monotone"
											dataKey="Overall"
											stroke="var(--text-color)"
											fill="var(--text-color)"
											fillOpacity={0.05}
											strokeDasharray="5 5"
											name="Overall (All offers)"
										/>
									</AreaChart>
								) : (
									<LineChart data={data.points}>
										<ChartAxes />
										<Legend />
										{selected.map((branch) => (
											<Line
												key={branch}
												type="monotone"
												dataKey={branch}
												stroke={branchColor(branch)}
												strokeWidth={2}
											/>
										))}
										<Line
											type="monotone"
											dataKey="Overall"
											stroke="var(--text-color)"
											strokeWidth={3}
											strokeDasharray="5 5"
											name="Overall (All offers)"
										/>
									</LineChart>
								)}
							</ResponsiveContainer>
						</div>

						<div className="mt-6 space-y-3">
							<div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed">
								<strong>Overall (All offers)</strong>
								<div className="text-right">
									<div className="text-sm text-muted-foreground">
										{data.overall.offers} offers
									</div>
									<div className="font-bold">₹{data.overall.avgPackage.toFixed(1)} LPA</div>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
								{selected.map((branch) => (
									<div
										key={branch}
										className="flex items-center justify-between p-3 rounded-lg border"
										style={{ borderColor: branchColor(branch) }}
									>
										<span className="font-medium text-sm">{branch}</span>
										<div className="text-right text-xs">
											<div className="text-muted-foreground">
												{data.branches[branch]?.offers || 0} offers
											</div>
											<strong>
												₹{(data.branches[branch]?.avgPackage || 0).toFixed(1)}
											</strong>
										</div>
									</div>
								))}
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
