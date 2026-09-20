"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryState } from "nuqs";

import BranchSection from "@/components/stats/BranchSection";
import CompanySection from "@/components/stats/CompanySection";
import ExpandingSearch from "@/components/stats/ExpandingSearch";
import OfficialPlacements from "@/components/stats/OfficialPlacements";
import PlacementDistributionChart from "@/components/stats/PlacementDistributionChart";
import PlacementTimeline from "@/components/stats/PlacementTimeline";
import SummaryCards from "@/components/stats/SummaryCards";
import { useSecretAccess } from "@/components/SecretAccessProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	useBranchStats,
	useCompanyStats,
	useDebouncedStatsSearch,
	useStatsSummary,
} from "@/lib/hooks/useStatsDashboard";
import { serializeStatsQuery, statsQueryParams } from "@/lib/query-params";

export type StatsSection = "branches" | "companies" | "distribution" | "timeline";

type StatsDashboardProps = {
	section: StatsSection;
};

const BRANCHES_LIMIT = 3;
const COMPANIES_LIMIT = 6;

function DashboardSkeleton() {
	return (
		<div className="max-w-7xl mx-auto space-y-8">
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
				{Array.from({ length: 4 }, (_, index) => (
					<Card key={index} className="animate-pulse card-theme">
						<CardContent className="p-6">
							<div className="h-8 rounded mb-2 bg-primary" />
							<div className="h-4 rounded w-1/2 bg-primary" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

function SectionSkeleton({ cards }: { cards: number }) {
	return (
		<Card className="card-theme bg-card border-border">
			<CardContent className="p-6">
				<div className="h-6 w-56 rounded bg-muted animate-pulse mb-6" />
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: cards }, (_, index) => (
						<div
							key={index}
							className="h-40 rounded-xl border border-border/60 bg-muted animate-pulse"
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function ChartSkeleton() {
	return (
		<Card className="card-theme bg-card border-border">
			<CardContent className="p-6">
				<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
					<div className="h-6 w-72 rounded bg-muted animate-pulse" />
					<div className="h-8 w-56 rounded bg-muted animate-pulse" />
				</div>
				<div className="h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl border border-border/60 bg-muted animate-pulse" />
				<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }, (_, index) => (
						<div
							key={index}
							className="h-16 rounded-lg border border-border/60 bg-muted animate-pulse"
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export default function StatsDashboard({ section }: StatsDashboardProps) {
	const { unlocked, unlock } = useSecretAccess();
	const [searchQuery, setSearchQuery] = useQueryState("q", statsQueryParams.q);
	const [secretClicks, setSecretClicks] = useState(0);
	const query = useDebouncedStatsSearch(searchQuery);
	const summaryQuery = useStatsSummary(query, unlocked === true);
	const branchQuery = useBranchStats(
		query,
		unlocked === true && (section === "branches" || section === "distribution"),
	);
	const companyQuery = useCompanyStats(
		query,
		unlocked === true && section === "companies",
	);

	const handleSearchChange = (value: string) => {
		void setSearchQuery(value.trim() ? value : null);
	};

	const statsHref = (pathname: string) =>
		serializeStatsQuery(pathname, { q: searchQuery || null });

	const handleSecretClick = () => {
		setSecretClicks((current) => {
			const next = current + 1;
			if (next >= 7) unlock();
			return next;
		});
	};

	if (unlocked === null) return <DashboardSkeleton />;

	if (!unlocked) {
		return (
			<main
				role="main"
				className="min-h-screen flex items-center justify-center font-sans"
			>
				<div className="p-8 md:p-10 rounded-[14px] border border-border shadow-[0_2px_24px_rgba(0,0,0,0.06)] bg-card">
					<h1 className="m-0 mb-2 text-2xl md:text-3xl text-foreground">
						Service unavailable Permanently
					</h1>
					<p className="m-0 mb-1 text-base text-muted-foreground">
						This site will not be accessible.
					</p>
					<p className="m-0 text-sm opacity-70 text-muted-foreground">
						As per the instructions of the{" "}
						<span onClick={handleSecretClick} className="cursor-pointer">
							JIIT
						</span>{" "}
						Administration.
					</p>
				</div>
			</main>
		);
	}

	if (summaryQuery.isLoading) return <DashboardSkeleton />;

	const error = summaryQuery.error || branchQuery.error || companyQuery.error;
	if (error || !summaryQuery.data) {
		return (
			<Card className="max-w-3xl mx-auto border-destructive/40">
				<CardContent className="p-8 text-center text-destructive">
					{error instanceof Error
						? error.message
						: "Failed to load placement statistics."}
				</CardContent>
			</Card>
		);
	}

	const summary = summaryQuery.data;
	return (
		<div className="max-w-7xl mx-auto space-y-8">
			<OfficialPlacements />

			<div className="relative my-8">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-border" />
				</div>
				<div className="relative flex justify-center text-sm">
					<span className="px-4 py-2 bg-card text-muted-foreground font-medium rounded-lg border border-border">
						Unofficial Data (May contain errors)
					</span>
				</div>
			</div>

			<ExpandingSearch
				value={searchQuery}
				onChange={handleSearchChange}
				placeholder="Search students, companies, roles..."
			/>

			<SummaryCards {...summary} />

			<Tabs value={section} className="w-full">
				<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl h-auto">
					<TabsTrigger value="branches" asChild>
						<Link href={statsHref("/stats/branches")}>Branches</Link>
					</TabsTrigger>
					<TabsTrigger value="companies" asChild>
						<Link href={statsHref("/stats/companies")}>Companies</Link>
					</TabsTrigger>
					<TabsTrigger value="distribution" asChild>
						<Link href={statsHref("/stats/distribution")}>Distribution</Link>
					</TabsTrigger>
					<TabsTrigger value="timeline" asChild>
						<Link href={statsHref("/stats/timeline")}>Timeline</Link>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="branches" className="mt-6 space-y-8">
					{branchQuery.data ? (
						<BranchSection
							limit={BRANCHES_LIMIT}
							branches={branchQuery.data.branches}
							buildHref={statsHref}
						/>
					) : (
						<SectionSkeleton cards={BRANCHES_LIMIT} />
					)}
				</TabsContent>

				<TabsContent value="distribution" className="mt-6">
					{branchQuery.data ? (
						<PlacementDistributionChart data={branchQuery.data.distribution} />
					) : (
						<ChartSkeleton />
					)}
				</TabsContent>

				<TabsContent value="companies" className="mt-6">
					{companyQuery.data ? (
						<CompanySection
							limit={COMPANIES_LIMIT}
							companies={companyQuery.data.companies}
							hasActiveFilters={Boolean(query)}
							buildHref={statsHref}
						/>
					) : (
						<SectionSkeleton cards={COMPANIES_LIMIT} />
					)}
				</TabsContent>

				<TabsContent value="timeline" className="mt-6">
					<PlacementTimeline query={query} enabled={section === "timeline"} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
