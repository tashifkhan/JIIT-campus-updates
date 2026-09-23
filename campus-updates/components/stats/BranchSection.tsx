"use client";

import Link from "next/link";
import { useState } from "react";
import { IndianRupee, TrendingUp, Trophy, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPackage, formatPercent } from "@/lib/stats";
import type { BranchStats } from "@/lib/stats-api";

type Props = {
	limit: number;
	branches: Record<string, BranchStats>;
	buildHref: (pathname: string) => string;
};

function BranchCard({ branch, stats }: { branch: string; stats: BranchStats }) {
	return (
		<Card className="border card-theme cursor-pointer hover:shadow-lg shadow-sm transition-all duration-300 active:scale-[0.98] bg-card border-border/60 group h-full">
			<CardContent className="p-5 flex flex-col h-full justify-between gap-4">
				<div>
					<div className="flex items-start justify-between mb-2">
						<div className="space-y-1">
							<h3 className="font-bold text-lg text-foreground">{branch}</h3>
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
								<Users className="w-3.5 h-3.5" />
								<span>
									{stats.uniqueCount}
									{stats.count !== stats.uniqueCount ? (
										<span className="opacity-75"> ({stats.count} offers)</span>
									) : null}
									{stats.total ? (
										<>
											{" "}
											<span className="opacity-50">/</span> {stats.total}
										</>
									) : null}
								</span>
							</div>
						</div>
						<span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
							{stats.pct == null ? "N/A" : formatPercent(stats.pct)}
						</span>
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
								<span className="text-xs font-medium text-muted-foreground">LPA</span>
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
								<span className="text-xs font-medium text-muted-foreground">LPA</span>
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

export default function BranchSection({ limit, branches, buildHref }: Props) {
	const [showAll, setShowAll] = useState(true);
	const entries = Object.entries(branches).sort(
		(left, right) => right[1].count - left[1].count,
	);
	const visibleEntries = showAll ? entries : entries.slice(0, limit);

	return (
		<Card className="card-theme bg-card border-border">
			<CardHeader>
				<CardTitle className="text-foreground">Branch-wise Placements</CardTitle>
			</CardHeader>
			<CardContent>
				{entries.length === 0 ? (
					<div className="text-center py-6 text-muted-foreground">
						No branch data for current filters.
					</div>
				) : (
					<>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{visibleEntries.map(([branch, stats]) => (
								<Link
									href={buildHref(
										`/stats/branch/${encodeURIComponent(branch)}`,
									)}
									key={branch}
								>
									<BranchCard branch={branch} stats={stats} />
								</Link>
							))}
						</div>
						{entries.length > limit ? (
							<div className="mt-6 text-center">
								<button
									type="button"
									onClick={() => setShowAll((current) => !current)}
									className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
								>
									{showAll ? "Show Less" : "Show All Branches"}
								</button>
							</div>
						) : null}
					</>
				)}
			</CardContent>
		</Card>
	);
}
