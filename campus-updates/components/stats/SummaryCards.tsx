"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatPercent, formatPackage } from "@/lib/stats";
import {
	TrendingUp,
	IndianRupee,
	Building2,
	ScrollText,
	Briefcase,
	Users,
	Target,
} from "lucide-react";

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
	offers?: {
		filteredUniqueStudents: number;
		totalUniqueStudents: number;
		filteredTotalOffers: number;
		totalOffers: number;
	};
};

type StatCardProps = {
	title: string;
	value: React.ReactNode;
	subValue?: React.ReactNode;
	icon: React.ReactNode;
	className?: string;
	trend?: {
		value: string;
		isPositive?: boolean;
		label?: string;
	};
};

function StatCard({
	title,
	value,
	subValue,
	icon,
	className,
	trend,
}: StatCardProps) {
	return (
		<Card
			className={`border card-theme hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card border-border group ${className}`}
		>
			<CardContent className="p-5">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							{title}
						</p>
						<div className="flex items-baseline gap-2">
							<div className="text-2xl font-bold text-foreground">{value}</div>
							{trend && (
								<p className="text-xs text-muted-foreground">
									{trend.label} {trend.value}
								</p>
							)}
						</div>
						{subValue && (
							<div className="text-xs text-muted-foreground mt-1 font-medium">
								{subValue}
							</div>
						)}
					</div>
					<div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
						{icon}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default function SummaryCards({
	placement,
	packages,
	companies,
	offers,
}: Props) {
	return (
		<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			{/* Placement Rate */}
			<StatCard
				title="Placement Rate"
				value={
					<span className="flex items-baseline gap-1">
						{placement.placed}
						<span className="text-sm font-normal text-muted-foreground">
							/ {placement.total}
						</span>
					</span>
				}
				subValue={
					<div className="flex flex-col gap-0.5">
						<span className="text-success font-semibold">
							{formatPercent(placement.pct)} placed
						</span>
						{Math.abs(placement.pct - placement.overallPct) > 0.05 && (
							<span className="opacity-80">
								Overall: {formatPercent(placement.overallPct)}
							</span>
						)}
					</div>
				}
				icon={<Target className="h-5 w-5" />}
			/>

			{/* Average Package */}
			<StatCard
				title="Average Package"
				value={
					<span>
						₹{packages.avg.toFixed(1)}{" "}
						<span className="text-base font-normal text-muted-foreground">
							LPA
						</span>
					</span>
				}
				subValue={
					packages.avg !== packages.overallAvg ? (
						<span>Overall: {formatPackage(packages.overallAvg)}</span>
					) : null
				}
				icon={<IndianRupee className="h-5 w-5" />}
			/>

			{/* Median Package */}
			<StatCard
				title="Median Package"
				value={
					<span>
						₹{packages.median.toFixed(1)}{" "}
						<span className="text-base font-normal text-muted-foreground">
							LPA
						</span>
					</span>
				}
				subValue={
					packages.median !== packages.overallMedian ? (
						<span>Overall: {formatPackage(packages.overallMedian)}</span>
					) : null
				}
				icon={<TrendingUp className="h-5 w-5" />}
			/>

			{/* Highest Package */}
			<StatCard
				title="Highest Package"
				value={
					<span>
						₹{packages.highest.toFixed(1)}{" "}
						<span className="text-base font-normal text-muted-foreground">
							LPA
						</span>
					</span>
				}
				subValue={
					packages.highest !== packages.overallHighest ? (
						<span>Overall: {formatPackage(packages.overallHighest)}</span>
					) : null
				}
				icon={<Briefcase className="h-5 w-5" />}
			/>

			{/* Companies */}
			<StatCard
				title="Companies"
				value={companies.filtered}
				subValue={
					companies.filtered !== companies.total ? (
						<span>Out of {companies.total} total</span>
					) : (
						<span>Total visiting</span>
					)
				}
				icon={<Building2 className="h-5 w-5" />}
			/>

			{/* Total Offers */}
			{offers && (
				<StatCard
					title="Total Offers"
					value={offers.filteredTotalOffers}
					subValue={
						<div className="flex flex-col gap-0.5">
							<span>{offers.filteredUniqueStudents} unique students</span>
							{(offers.filteredTotalOffers !== offers.totalOffers ||
								offers.filteredUniqueStudents !==
									offers.totalUniqueStudents) && (
								<span className="opacity-80">
									Overall: {offers.totalOffers}
								</span>
							)}
						</div>
					}
					icon={<ScrollText className="h-5 w-5" />}
				/>
			)}
		</div>
	);
}
