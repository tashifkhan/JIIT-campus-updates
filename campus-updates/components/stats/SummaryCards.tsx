"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatPercent, formatPackage } from "@/lib/stats";

type Props = {
	placement: { placed: number; total: number; pct: number; overallPct: number };
	packages: {
		avg: number;
		median: number;
		highest: number;
		overallAvg: number;
		overallMedian: number;
		overallHighest: number;
	};
	companies: { filtered: number; total: number };
};

export default function SummaryCards({
	placement,
	packages,
	companies,
}: Props) {
	return (
		<div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5 text-center">
			{/* Placement Rate */}
			<Card
				className="border card-theme hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
				style={{
					backgroundColor: "var(--card-bg)",
					borderColor: "var(--border-color)",
					color: "var(--text-color)",
				}}
			>
				<CardContent className="p-4 sm:p-6">
					<div className="flex items-center justify-between">
						<div className="flex-1 min-w-0">
							<p
								className="text-xs sm:text-sm font-medium mb-1 truncate"
								style={{ color: "var(--label-color)" }}
							>
								Placement Rate
							</p>
							<p
								className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight"
								style={{ color: "var(--text-color)" }}
							>
								{placement.placed}
								<span
									className="text-base sm:text-xl font-medium ml-1"
									style={{ color: "var(--label-color)" }}
								>
									/ {placement.total}
								</span>
							</p>
							<p
								className="text-xs truncate font-semibold"
								style={{ color: "var(--success-dark)" }}
							>
								{formatPercent(placement.pct)}
							</p>
							{Math.abs(placement.pct - placement.overallPct) > 0.05 && (
								<p
									className="text-xs truncate"
									style={{ color: "var(--label-color)" }}
								>
									overall: {formatPercent(placement.overallPct)}
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Average Package */}
			<Card
				className="border card-theme hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
				style={{
					backgroundColor: "var(--card-bg)",
					borderColor: "var(--border-color)",
					color: "var(--text-color)",
				}}
			>
				<CardContent className="p-4 sm:p-6">
					<div className="flex items-center justify-between">
						<div className="flex-1 min-w-0">
							<p
								className="text-xs sm:text-sm font-medium mb-1 truncate"
								style={{ color: "var(--label-color)" }}
							>
								Average Package
							</p>
							<p
								className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight"
								style={{ color: "var(--success-dark)" }}
							>
								{formatPackage(packages.avg)}
							</p>
							{packages.avg !== packages.overallAvg && (
								<p
									className="text-xs truncate"
									style={{ color: "var(--label-color)" }}
								>
									overall: {formatPackage(packages.overallAvg)}
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Median Package */}
			<Card
				className="border card-theme hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
				style={{
					backgroundColor: "var(--card-bg)",
					borderColor: "var(--border-color)",
					color: "var(--text-color)",
				}}
			>
				<CardContent className="p-4 sm:p-6">
					<div className="flex items-center justify-between">
						<div className="flex-1 min-w-0">
							<p
								className="text-xs sm:text-sm font-medium mb-1 truncate"
								style={{ color: "var(--label-color)" }}
							>
								Median Package
							</p>
							<p
								className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight"
								style={{ color: "var(--success-dark)" }}
							>
								{formatPackage(packages.median)}
							</p>
							{packages.median !== packages.overallMedian && (
								<p
									className="text-xs truncate"
									style={{ color: "var(--label-color)" }}
								>
									overall: {formatPackage(packages.overallMedian)}
								</p>
							)}
						</div>

					</div>
				</CardContent>
			</Card>

			{/* Highest Package */}
			<Card
				className="border card-theme hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
				style={{
					backgroundColor: "var(--card-bg)",
					borderColor: "var(--border-color)",
					color: "var(--text-color)",
				}}
			>
				<CardContent className="p-4 sm:p-6">
					<div className="flex items-center justify-between">
						<div className="flex-1 min-w-0">
							<p
								className="text-xs sm:text-sm font-medium mb-1 truncate"
								style={{ color: "var(--label-color)" }}
							>
								Highest Package
							</p>
							<p
								className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight"
								style={{ color: "var(--success-dark)" }}
							>
								{formatPackage(packages.highest)}
							</p>
							{packages.highest !== packages.overallHighest && (
								<p
									className="text-xs truncate"
									style={{ color: "var(--label-color)" }}
								>
									overall: {formatPackage(packages.overallHighest)}
								</p>
							)}
						</div>

					</div>
				</CardContent>
			</Card>

			{/* Companies */}
			<Card
				className="border card-theme hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
				style={{
					backgroundColor: "var(--card-bg)",
					borderColor: "var(--border-color)",
					color: "var(--text-color)",
				}}
			>
				<CardContent className="p-4 sm:p-6">
					<div className="flex items-center justify-between">
						<div className="flex-1 min-w-0">
							<p
								className="text-xs sm:text-sm font-medium mb-1 truncate"
								style={{ color: "var(--label-color)" }}
							>
								Companies
							</p>
							<p
								className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight"
								style={{ color: "var(--text-color)" }}
							>
								{companies.filtered}
							</p>
							{companies.filtered !== companies.total && (
								<p
									className="text-xs truncate"
									style={{ color: "var(--label-color)" }}
								>
									of {companies.total} total
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
