"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, IndianRupee, Trophy, TrendingUp } from "lucide-react";
import type { Placement, StudentWithPlacement } from "@/lib/stats";
import { formatPackage, formatPercent } from "@/lib/stats";

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

// Reusable card component for individual branch stats
function BranchCard({
	branch,
	stats,
	totalForBranch,
	uniqueCount,
	pct,
}: {
	branch: string;
	stats: any;
	totalForBranch: number;
	uniqueCount: number;
	pct: number | null;
}) {
	return (
		<Card className="border card-theme cursor-pointer hover:shadow-lg shadow-sm transition-all duration-300 active:scale-[0.98] bg-card border-border/60 group h-full">
			<CardContent className="p-5 flex flex-col h-full justify-between gap-4">
				<div>
					<div className="flex items-start justify-between mb-2">
						<div className="space-y-1">
							<h3 className="font-bold text-lg text-foreground flex items-center gap-2">
								{branch}
							</h3>
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
								<Users className="w-3.5 h-3.5" />
								<span>
									{uniqueCount}
									{stats.count !== uniqueCount && (
										<span className="opacity-75"> ({stats.count} offers)</span>
									)}
									{totalForBranch ? (
										<>
											{" "}
											<span className="opacity-50">/</span> {totalForBranch}
										</>
									) : null}
								</span>
							</div>
						</div>
						<div className="flex flex-col items-end">
							<span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
								{pct ? formatPercent(pct) : "N/A"}
							</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
						<div>
							<div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
								<IndianRupee className="w-3 h-3" /> Average
							</div>
							<div className="flex items-baseline gap-1">
								<span className="text-xl font-bold text-foreground">
									{formatPackage(stats.avgPackage).replace(" LPA", "")}
								</span>
								<span className="text-xs font-medium text-muted-foreground">
									LPA
								</span>
							</div>
						</div>
						<div>
							<div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
								<TrendingUp className="w-3 h-3" /> Median
							</div>
							<div className="flex items-baseline gap-1">
								<span className="text-xl font-bold text-foreground">
									{formatPackage(stats.median).replace(" LPA", "")}
								</span>
								<span className="text-xs font-medium text-muted-foreground">
									LPA
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="pt-3 border-t border-border/50 flex items-center justify-between">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Trophy className="w-3.5 h-3.5 text-yellow-500/80" />
						<span className="font-medium">Highest:</span>
						<span className="text-foreground font-bold">
							{formatPackage(stats.highest)}
						</span>
					</div>
					<Badge
						variant="outline"
						className="text-[10px] h-5 border-0 bg-primary/10 text-primary hover:bg-primary/20 pointer-events-none group-hover:pointer-events-auto transition-colors"
					>
						Details &rarr;
					</Badge>
				</div>
			</CardContent>
		</Card>
	);
}

export default function BranchSection({
	BRANCHES_LIMIT,
	branchStats,
	branchTotalCounts,
}: Props) {
	const [showAllBranches, setShowAllBranches] = useState(false);

	return (
		<Card className="card-theme bg-card border-border">
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-foreground">
					<div className="flex items-center gap-2">Branch-wise Placements</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{Object.keys(branchStats).length === 0 ? (
					<div className="text-center py-6 text-muted-foreground">
						No branch data for current filters.
					</div>
				) : (
					<>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{(() => {
								const branchEntries = Object.entries(branchStats).sort(
									(a, b) => b[1].count - a[1].count,
								);
								const branchesToShow = showAllBranches
									? branchEntries
									: branchEntries.slice(0, BRANCHES_LIMIT);

								return branchesToShow.map(([branch, stats]) => {
									const totalForBranch = branchTotalCounts[branch] || 0;
									const uniqueCount = (stats as any).uniqueCount || stats.count;
									const pct =
										totalForBranch > 0
											? (uniqueCount / totalForBranch) * 100
											: null;

									return (
										<Link
											href={`/stats/branch/${encodeURIComponent(branch)}`}
											key={branch}
										>
											<BranchCard
												branch={branch}
												stats={stats}
												totalForBranch={totalForBranch}
												uniqueCount={uniqueCount}
												pct={pct}
											/>
										</Link>
									);
								});
							})()}
						</div>

						{Object.keys(branchStats).length > BRANCHES_LIMIT && (
							<div className="mt-6 text-center">
								<button
									onClick={() => setShowAllBranches(!showAllBranches)}
									className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
								>
									{showAllBranches ? "Show Less" : "Show All Branches"}
								</button>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
