"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, BriefcaseBusiness } from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import CampusBadge, { CAMPUS_ROUTE_LABELS, campusRouteColor } from "@/components/stats/CampusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampusCompany, CampusStatsData } from "@/lib/stats-api";
import { formatPackage, formatPercent, type CampusRoute } from "@/lib/stats";
import { cn } from "@/lib/utils";

const ROUTES: CampusRoute[] = ["on", "ppo", "off"];

type CompanyFilter = "all" | CampusRoute | "review";

type Props = {
	data: CampusStatsData;
	buildHref: (pathname: string) => string;
};

function RouteTooltip({ active, payload, label, unit }: any) {
	if (!active || !payload?.length) return null;
	const total = payload.reduce((sum: number, entry: any) => sum + Number(entry.value || 0), 0);
	return (
		<div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[170px]">
			<p className="font-semibold mb-2 text-foreground">{label}</p>
			<div className="space-y-1">
				{[...payload].reverse().map((entry: any) => (
					<div key={entry.dataKey} className="flex items-center justify-between gap-3 text-sm">
						<span className="flex items-center gap-2 text-muted-foreground">
							<span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
							{entry.name}
						</span>
						<span className="font-semibold text-foreground tabular-nums">{entry.value}</span>
					</div>
				))}
				<div className="flex justify-between gap-3 pt-1 mt-1 border-t border-border text-sm">
					<span className="text-muted-foreground">Total {unit}</span>
					<span className="font-semibold text-foreground tabular-nums">{total}</span>
				</div>
			</div>
		</div>
	);
}

function RouteStackChart({
	data,
	xKey,
	unit,
}: {
	data: Record<string, string | number>[];
	xKey: string;
	unit: string;
}) {
	return (
		<div className="h-[320px] w-full">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
					<CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
					<XAxis
						dataKey={xKey}
						tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
						tickMargin={8}
						minTickGap={16}
					/>
					<YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} allowDecimals={false} />
					<Tooltip content={<RouteTooltip unit={unit} />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
					<Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
					{ROUTES.map((route, index) => (
						<Bar
							key={route}
							dataKey={route}
							name={CAMPUS_ROUTE_LABELS[route]}
							stackId="route"
							fill={campusRouteColor(route)}
							stroke="var(--card)"
							strokeWidth={1}
							radius={index === ROUTES.length - 1 ? [4, 4, 0, 0] : 0}
							isAnimationActive={false}
						/>
					))}
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

function Tile({
	label,
	value,
	detail,
	color,
}: {
	label: string;
	value: React.ReactNode;
	detail: React.ReactNode;
	color?: string;
}) {
	return (
		<div className="rounded-xl border border-border bg-card p-4">
			<p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
				{color ? <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /> : null}
				{label}
			</p>
			<p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{value}</p>
			<p className="mt-1 text-xs text-muted-foreground">{detail}</p>
		</div>
	);
}

function MeterRow({
	label,
	value,
	max,
	color,
	suffix,
}: {
	label: string;
	value: number;
	max: number;
	color: string;
	suffix: React.ReactNode;
}) {
	return (
		<div className="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-sm">
			<span className="text-muted-foreground">{label}</span>
			<div className="h-2.5 rounded-full bg-muted overflow-hidden">
				<div
					className="h-full rounded-full"
					style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: color }}
				/>
			</div>
			<span className="tabular-nums text-foreground text-right min-w-[5.5rem]">{suffix}</span>
		</div>
	);
}

const REVIEW_TEXT: Record<NonNullable<CampusCompany["review"]>, string> = {
	"drive-exists": "Tagged off campus, but a SuperSet drive exists for this company",
	"no-drive": "Tagged on campus, but no SuperSet drive was found for this company",
};

export default function CampusSection({ data, buildHref }: Props) {
	const [filter, setFilter] = useState<CompanyFilter>("all");
	const [showAll, setShowAll] = useState(false);
	const { routes, students, jobs } = data;
	const needsReview = data.companies.filter((company) => company.review);
	const visibleCompanies = useMemo(() => {
		const rows =
			filter === "all"
				? data.companies
				: filter === "review"
					? needsReview
					: data.companies.filter((company) => company.route === filter);
		return showAll ? rows : rows.slice(0, 12);
	}, [data.companies, filter, needsReview, showAll]);
	const filteredCount =
		filter === "all"
			? data.companies.length
			: filter === "review"
				? needsReview.length
				: data.companies.filter((company) => company.route === filter).length;
	const confidenceMax = Math.max(...data.confidence.map((bucket) => bucket.offers), 1);
	const jobConversion = jobs.companies ? (jobs.companiesWithOffers / jobs.companies) * 100 : 0;
	const offerCoverage = jobs.offerDocs ? (jobs.offersLinked / jobs.offerDocs) * 100 : 0;

	return (
		<div className="space-y-6">
			<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
				<Tile
					label="Placed on campus"
					color="var(--campus-on)"
					value={students.anyOn}
					detail={`${formatPercent(data.batchTotal ? (students.anyOn / data.batchTotal) * 100 : 0)} of the ${data.batchTotal} batch · ${formatPercent(data.placedStudents ? (students.anyOn / data.placedStudents) * 100 : 0)} of placed`}
				/>
				<Tile
					label="Via PPO"
					color="var(--campus-ppo)"
					value={routes.ppo.students}
					detail={`${routes.ppo.offers} conversion offers · median ${formatPackage(routes.ppo.medianPackage)}`}
				/>
				<Tile
					label="Off campus"
					color="var(--campus-off)"
					value={routes.off.students}
					detail={`${routes.off.offers} offers from ${routes.off.companies} companies`}
				/>
				<Tile
					label="Offers linked to a drive"
					value={formatPercent(offerCoverage)}
					detail={`${jobs.offersLinked} of ${jobs.offerDocs} company offer mails match a posted job`}
				/>
			</div>

			<Card className="card-theme bg-card border-border">
				<CardHeader>
					<CardTitle className="text-foreground">Package by route</CardTitle>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
								<th className="py-2 pr-4 font-medium">Route</th>
								<th className="py-2 px-3 font-medium text-right">Offers</th>
								<th className="py-2 px-3 font-medium text-right">Students</th>
								<th className="py-2 px-3 font-medium text-right">Companies</th>
								<th className="py-2 px-3 font-medium text-right">Avg / offer</th>
								<th className="py-2 px-3 font-medium text-right">Median / offer</th>
								<th className="py-2 px-3 font-medium text-right">Median / student</th>
								<th className="py-2 pl-3 font-medium text-right">Highest</th>
							</tr>
						</thead>
						<tbody>
							{ROUTES.map((route) => (
								<tr key={route} className="border-b border-border/60 last:border-0">
									<td className="py-2.5 pr-4">
										<CampusBadge route={route} />
									</td>
									<td className="py-2.5 px-3 text-right tabular-nums">{routes[route].offers}</td>
									<td className="py-2.5 px-3 text-right tabular-nums">{routes[route].students}</td>
									<td className="py-2.5 px-3 text-right tabular-nums">{routes[route].companies}</td>
									<td className="py-2.5 px-3 text-right tabular-nums">{formatPackage(routes[route].avgPackage)}</td>
									<td className="py-2.5 px-3 text-right tabular-nums">{formatPackage(routes[route].medianPackage)}</td>
									<td className="py-2.5 px-3 text-right tabular-nums">{formatPackage(routes[route].studentMedianPackage)}</td>
									<td className="py-2.5 pl-3 text-right tabular-nums">{formatPackage(routes[route].highestPackage)}</td>
								</tr>
							))}
						</tbody>
					</table>
					<p className="mt-3 text-xs text-muted-foreground">
						{students.multiOffer} students hold more than one offer and {students.mixed} of them
						got offers through more than one route. By best offer: {students.bestOn} on campus,{" "}
						{students.bestPpo} PPO, {students.bestOff} off campus.
					</p>
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="card-theme bg-card border-border">
					<CardHeader>
						<CardTitle className="text-foreground">Offers per month</CardTitle>
					</CardHeader>
					<CardContent>
						<RouteStackChart data={data.months} xKey="month" unit="offers" />
					</CardContent>
				</Card>
				<Card className="card-theme bg-card border-border">
					<CardHeader>
						<CardTitle className="text-foreground">Offers by package band (LPA)</CardTitle>
					</CardHeader>
					<CardContent>
						<RouteStackChart data={data.bands} xKey="range" unit="offers" />
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-5">
				<Card className="card-theme bg-card border-border lg:col-span-3">
					<CardHeader>
						<CardTitle className="text-foreground">Branches</CardTitle>
					</CardHeader>
					<CardContent className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
									<th className="py-2 pr-3 font-medium">Branch</th>
									<th className="py-2 px-3 font-medium w-[40%]">On campus, share of branch</th>
									<th className="py-2 px-3 font-medium text-right">PPO</th>
									<th className="py-2 px-3 font-medium text-right">Off</th>
									<th className="py-2 pl-3 font-medium text-right">Avg on / other</th>
								</tr>
							</thead>
							<tbody>
								{data.branches.map((branch) => (
									<tr key={branch.branch} className="border-b border-border/60 last:border-0">
										<td className="py-2.5 pr-3 font-medium text-foreground">{branch.branch}</td>
										<td className="py-2.5 px-3">
											<div className="flex items-center gap-2">
												<div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
													<div
														className="h-full rounded-full"
														style={{ width: `${branch.onPct}%`, backgroundColor: "var(--campus-on)" }}
													/>
												</div>
												<span className="tabular-nums text-xs text-muted-foreground whitespace-nowrap">
													{branch.on}/{branch.total} · {formatPercent(branch.onPct)}
												</span>
											</div>
										</td>
										<td className="py-2.5 px-3 text-right tabular-nums">{branch.ppo}</td>
										<td className="py-2.5 px-3 text-right tabular-nums">{branch.off}</td>
										<td className="py-2.5 pl-3 text-right tabular-nums whitespace-nowrap">
											{branch.onAvgPackage ? branch.onAvgPackage.toFixed(1) : "-"} /{" "}
											{branch.otherAvgPackage ? branch.otherAvgPackage.toFixed(1) : "-"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<p className="mt-3 text-xs text-muted-foreground">
							PPO and Off count students with no on-campus offer. Packages in LPA, per offer.
						</p>
					</CardContent>
				</Card>

				<Card className="card-theme bg-card border-border lg:col-span-2">
					<CardHeader>
						<CardTitle className="text-foreground">Tag confidence</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{data.confidence.map((bucket) => (
							<MeterRow
								key={bucket.bucket}
								label={bucket.bucket}
								value={bucket.offers}
								max={confidenceMax}
								color="var(--campus-on)"
								suffix={`${bucket.offers} offers · ${bucket.companies} co.`}
							/>
						))}
						<p className="pt-2 text-xs text-muted-foreground">
							On-campus offers only. The backend judge needs 70% to tag an offer on campus, so
							the 70-80% row holds the near calls.
						</p>
					</CardContent>
				</Card>
			</div>

			<Card className="card-theme bg-card border-border">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-foreground">
						<BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
						Posted jobs vs offers
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-6 lg:grid-cols-5">
					<div className="lg:col-span-2 space-y-2 text-sm">
						<p className="text-3xl font-bold text-foreground tabular-nums">
							{jobs.companiesWithOffers}
							<span className="text-base font-normal text-muted-foreground"> / {jobs.companies}</span>
						</p>
						<p className="text-muted-foreground">
							companies that posted a job on SuperSet this year have at least one recorded offer (
							{formatPercent(jobConversion)}). {jobs.total} postings in all.
						</p>
					</div>
					<div className="lg:col-span-3 space-y-3">
						{jobs.byCategory.map((category) => (
							<MeterRow
								key={category.category}
								label={category.category.replace(/^Offer is /, "")}
								value={category.withOffers}
								max={category.companies}
								color="var(--campus-on)"
								suffix={`${category.withOffers}/${category.companies} converted`}
							/>
						))}
					</div>
				</CardContent>
			</Card>

			<Card className="card-theme bg-card border-border">
				<CardHeader>
					<CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-foreground">
						<span>Companies by route</span>
						<div className="flex flex-wrap items-center gap-1 bg-muted rounded-lg p-1">
							{(["all", "on", "ppo", "off", "review"] as CompanyFilter[]).map((option) => (
								<Button
									key={option}
									size="sm"
									variant={filter === option ? "secondary" : "ghost"}
									className="h-7 text-xs gap-1.5"
									onClick={() => {
										setFilter(option);
										setShowAll(false);
									}}
								>
									{option === "review" ? <AlertTriangle className="h-3 w-3" /> : null}
									{option === "all"
										? "All"
										: option === "review"
											? `Needs review (${needsReview.length})`
											: CAMPUS_ROUTE_LABELS[option]}
								</Button>
							))}
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
								<th className="py-2 pr-3 font-medium">Company</th>
								<th className="py-2 px-3 font-medium">Route</th>
								<th className="py-2 px-3 font-medium text-right">Offers</th>
								<th className="py-2 px-3 font-medium text-right">Avg package</th>
								<th className="py-2 pl-3 font-medium">SuperSet job</th>
							</tr>
						</thead>
						<tbody>
							{visibleCompanies.map((company) => (
								<tr key={company.company} className="border-b border-border/60 last:border-0 align-top">
									<td className="py-2.5 pr-3">
										<Link
											href={buildHref(`/stats/company/${encodeURIComponent(company.company)}`)}
											className="font-medium text-foreground hover:underline"
										>
											{company.company}
										</Link>
										{company.reason ? (
											<p className="mt-0.5 max-w-md text-xs text-muted-foreground">
												{company.reason}
											</p>
										) : null}
										{company.review ? (
											<p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
												<AlertTriangle className="h-3 w-3 shrink-0" />
												{REVIEW_TEXT[company.review]}
											</p>
										) : null}
									</td>
									<td className="py-2.5 px-3">
										<CampusBadge route={company.route} confidence={company.confidence} />
									</td>
									<td className="py-2.5 px-3 text-right tabular-nums">{company.students}</td>
									<td className="py-2.5 px-3 text-right tabular-nums">{formatPackage(company.avgPackage)}</td>
									<td className={cn("py-2.5 pl-3 text-xs", !company.jobPosted && "text-muted-foreground")}>
										{company.jobPosted
											? [company.jobCategory, company.jobPackage ? formatPackage(company.jobPackage) : null]
													.filter(Boolean)
													.join(" · ") || "Linked"
											: "None found"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{filteredCount > 12 ? (
						<div className="text-center mt-4">
							<Button variant="outline" size="sm" onClick={() => setShowAll((current) => !current)}>
								{showAll ? "Show fewer" : `Show all ${filteredCount}`}
							</Button>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
