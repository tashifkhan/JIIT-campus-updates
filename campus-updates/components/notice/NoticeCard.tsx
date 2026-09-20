"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	ArrowRightIcon,
	BellIcon,
	BuildingIcon,
	CalendarIcon,
	IndianRupeeIcon,
	MapPinIcon,
	PencilIcon,
	TimerIcon,
	TrendingUpIcon,
	TrophyIcon,
	UsersIcon,
	VideoIcon,
	type LucideIcon,
} from "lucide-react";

import ShortlistTable from "@/components/notice/ShortlistTable";
import { usePlacementYear } from "@/components/PlacementYearProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDateTime, Notice } from "@/lib/notices";
import { serializeJobDetailQuery } from "@/lib/query-params";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
	"job posting": BellIcon,
	shortlisting: TrendingUpIcon,
	update: CalendarIcon,
	"placement offer": IndianRupeeIcon,
	"internship noc": UsersIcon,
	hackathon: TrophyIcon,
	reminder: TimerIcon,
	webinar: VideoIcon,
};

const RICH_CATEGORIES = new Set([
	"update",
	"job posting",
	"placement offer",
	"hackathon",
	"reminder",
	"webinar",
]);

const COMPACT_CATEGORIES = new Set(["shortlisting", "internship noc"]);

type Props = {
	notice: Notice;
	isAdmin: boolean;
	expanded: boolean;
	onToggleShortlist: () => void;
	onEdit: (notice: Notice) => void;
};

type Detail = {
	label: string;
	value: string | number;
	icon: LucideIcon;
};

function categoryLabel(category: string): string {
	return category
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function packageLabel(value: string): string {
	const trimmed = value.trim();
	return trimmed.startsWith("₹") ? trimmed.slice(1).trim() : trimmed;
}

function NoticeDetails({ details }: { details: Detail[] }) {
	if (!details.length) return null;
	return (
		<div className="rounded-xl border p-4 bg-primary/5 border-primary/20">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{details.map(({ label, value, icon: Icon }) => (
					<div key={label} className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-background border border-primary/10">
							<Icon className="w-4 h-4 text-primary" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground font-medium">{label}</p>
							<p className="font-medium text-foreground">{value}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function NoticeContent({
	html,
	markdown,
}: {
	html?: string;
	markdown?: string | null;
}) {
	if (!html && !markdown) return null;
	return (
		<div className="rounded-xl border p-4 bg-card border-border">
			{markdown ? (
				<div className="prose prose-sm max-w-none text-foreground">
					<ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
				</div>
			) : (
				<div
					className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-li:my-1"
					dangerouslySetInnerHTML={{ __html: html || "" }}
				/>
			)}
		</div>
	);
}

export default function NoticeCard({
	notice,
	isAdmin,
	expanded,
	onToggleShortlist,
	onEdit,
}: Props) {
	const router = useRouter();
	const { year } = usePlacementYear();
	const [isPending, startTransition] = useTransition();
	const [openingJob, setOpeningJob] = useState(false);
	const Icon = CATEGORY_ICONS[notice.category] || BellIcon;
	const company = notice.job_company || notice.matched_job?.company || "";
	const role = notice.job_role || notice.matched_job?.job_profile || "";
	const packageText = notice.package || "";
	const students = notice.shortlisted_students || [];
	const details: Detail[] = [];

	const hasStructuredSections = Boolean(
		notice.eligibility_criteria?.length ||
			notice.eligibility_requirements?.length ||
			notice.hiring_flow?.length,
	);

	if (company) details.push({ label: "Company", value: company, icon: BuildingIcon });
	if (role) details.push({ label: "Role", value: role, icon: UsersIcon });
	if (packageText && packageText.toLowerCase() !== "none") {
		details.push({
			label: "CTC",
			value: packageLabel(packageText),
			icon: IndianRupeeIcon,
		});
	}
	const location = notice.location || notice.matched_job?.location || "";
	if (location) {
		details.push({ label: "Location", value: location, icon: MapPinIcon });
	}
	if (notice.deadline && notice.category !== "placement offer") {
		details.push({ label: "Deadline", value: notice.deadline, icon: CalendarIcon });
	}
	if (notice.joiningDate && notice.category === "placement offer") {
		details.push({
			label: "Joining Date",
			value: notice.joiningDate,
			icon: CalendarIcon,
		});
	}
	if (notice.category === "placement offer" && notice.number_of_offers) {
		details.push({
			label: "Offers",
			value: notice.number_of_offers,
			icon: UsersIcon,
		});
	}

	const openRelatedJob = () => {
		const jobId = notice.matched_job?.id;
		if (!jobId) return;
		setOpeningJob(true);
		startTransition(() =>
			router.push(
				serializeJobDetailQuery(`/jobs/${encodeURIComponent(jobId)}`, {
					year: year === "202526" || year === "202627" ? year : null,
				}),
			),
		);
	};

	return (
		<Card className="notice-card transition-all duration-300 card-theme bg-card border-border text-foreground">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2 flex-wrap">
						<Badge
							variant="outline"
							className="px-3 py-1 rounded-full bg-background text-primary border-primary/20"
						>
							<Icon className="w-3 h-3 mr-2" />
							{categoryLabel(notice.category)}
						</Badge>
						{isAdmin ? (
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() => onEdit(notice)}
								aria-label={`Edit ${notice.category}`}
							>
								<PencilIcon className="w-3.5 h-3.5" />
							</Button>
						) : null}
					</div>
					{notice.createdAt ? (
						<span className="text-xs text-muted-foreground whitespace-nowrap">
							{formatDateTime(notice.createdAt)}
						</span>
					) : null}
				</div>
				<div className="text-xs text-muted-foreground mt-1 ml-1">
					{notice.category === "placement offer"
						? "By Placement Bot"
						: notice.author
							? `By ${notice.author}`
							: null}
				</div>
			</CardHeader>

			<CardContent className="pt-0 space-y-4">
				{notice.title ? (
					<h3 className="text-lg font-semibold leading-tight text-foreground">
						{notice.title}
					</h3>
				) : null}

				{RICH_CATEGORIES.has(notice.category) ? (
					<div className="space-y-4">
						<NoticeDetails details={details} />
						<NoticeContent
							// Structured sections below replace the raw scraped HTML, which
							// is a full email body and swamps the card when rendered.
							html={hasStructuredSections ? undefined : notice.content}
							markdown={notice.body}
						/>

						{notice.eligibility_criteria?.length ||
						notice.eligibility_requirements?.length ? (
							<section className="rounded-xl border p-4 bg-primary/5 border-primary/20">
								<h4 className="font-semibold mb-3 flex items-center text-foreground">
									<UsersIcon className="w-4 h-4 mr-2 text-primary" />
									Eligibility Criteria
								</h4>
								{notice.eligibility_criteria?.length ? (
									<ul className="space-y-2 text-sm text-foreground">
										{notice.eligibility_criteria.map((criterion, index) => (
											<li key={`${index}-${criterion}`} className="flex items-start gap-2">
												<span aria-hidden>•</span>
												<span>{criterion}</span>
											</li>
										))}
									</ul>
								) : null}
								{notice.eligibility_requirements?.length ? (
									<dl className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm">
										{notice.eligibility_requirements.map(({ label, value }) => (
											<div key={`${label}-${value}`} className="flex items-baseline gap-2">
												<dt className="text-primary">{label}</dt>
												<dd className="font-medium text-foreground">{value}</dd>
											</div>
										))}
									</dl>
								) : null}
							</section>
						) : null}

						{notice.hiring_flow?.length ? (
							<section className="rounded-xl border p-4 bg-primary/5 border-primary/20">
								<h4 className="font-semibold mb-3 flex items-center text-foreground">
									<CalendarIcon className="w-4 h-4 mr-2 text-primary" />
									Hiring Process
								</h4>
								<ol className="space-y-2">
									{notice.hiring_flow.map((step, index) => (
										<li key={`${index}-${step}`} className="flex items-center text-sm">
											<span className="w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center mr-3 flex-shrink-0 bg-primary text-primary-foreground">
												{index + 1}
											</span>
											{step}
										</li>
									))}
								</ol>
							</section>
						) : null}
					</div>
				) : COMPACT_CATEGORIES.has(notice.category) ? (					company || role || packageText ? (
						<div className="rounded-xl p-4 border bg-primary/5 border-primary/20 flex flex-wrap gap-2">
							{company ? <Badge variant="secondary">{company}</Badge> : null}
							{role ? <Badge variant="secondary">{role}</Badge> : null}
							{packageText && packageText.toLowerCase() !== "none" ? (
								<Badge variant="outline">{packageLabel(packageText)}</Badge>
							) : null}
						</div>
					) : null
				) : (
					<NoticeContent html={notice.content} markdown={notice.body} />
				)}

				{students.length ? (
					<div className="border-t pt-4 border-border">
						<ShortlistTable
							students={students}
							expanded={expanded}
							onToggle={onToggleShortlist}
						/>
					</div>
				) : null}

				{notice.matched_job ? (
					<div className="border-t pt-4 border-border">
						<button
							type="button"
							onClick={openRelatedJob}
							aria-busy={isPending && openingJob}
							className="w-full text-left rounded-xl p-4 border transition-all duration-200 group bg-primary/5 border-primary/20 hover:bg-primary/10 hover:shadow-sm"
						>
							<div className="flex items-start justify-between gap-4">
								<div>
									<h4 className="font-medium mb-1 text-foreground">
										Related Job Posting
									</h4>
									<p className="text-sm text-foreground">
										{notice.matched_job.company} - {notice.matched_job.job_profile}
									</p>
									<p className="text-xs mt-1 text-muted-foreground">
										{isPending && openingJob
											? "Loading..."
											: "Open full job details"}
									</p>
								</div>
								<ArrowRightIcon className="w-4 h-4 mt-2 group-hover:translate-x-0.5 transition-transform" />
							</div>
						</button>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
