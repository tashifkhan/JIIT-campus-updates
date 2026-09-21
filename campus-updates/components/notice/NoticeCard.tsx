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
import { EligibilityRequirement, formatDateTime, Notice } from "@/lib/notices";
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

type CourseGroup = {
	degree: string;
	branches: string[];
};

type Eligibility = {
	courses: CourseGroup[];
	requirements: EligibilityRequirement[];
	notes: string[];
};

const DEGREE_PATTERN =
	/^(b\.?\s?tech|m\.?\s?tech|b\.?\s?e|m\.?\s?e|b\.?\s?sc|m\.?\s?sc|b\.?\s?des|m\.?\s?des|b\.?\s?com|m\.?\s?com|bca|mca|mba|ph\.?\s?d)\b/i;

const COURSE_LABEL = /^(eligible\s+)?(courses?|branch(es)?|programs?|programmes?)\s*:\s*/i;

/**
 * `B.Tech - EE-VLSI` splits on the spaced dash so the branch keeps its own
 * dash; `B.Tech-CSE` has no spaced dash, so fall back to the first one.
 */
function splitCourse(course: string): { degree: string; branch: string } {
	const spaced = course.split(/\s+[-\u2013\u2014]\s+/);
	const [degree, ...tail] =
		spaced.length > 1 ? spaced : course.split(/[-\u2013\u2014]/);
	return { degree: degree.trim(), branch: tail.join(" - ").trim() };
}

/** `M.Tech. - AI&DS, B.Tech - CSE` -> one row per degree, branches as chips. */
function groupCourses(courses: string[]): CourseGroup[] {
	const groups = new Map<string, CourseGroup>();
	for (const course of courses) {
		const { degree, branch } = splitCourse(course);
		const key = degree.toLowerCase().replace(/[.\s]/g, "");
		const group = groups.get(key) ?? { degree, branches: [] };
		if (branch && !group.branches.includes(branch)) group.branches.push(branch);
		groups.set(key, group);
	}
	return Array.from(groups.values()).sort((a, b) => a.degree.localeCompare(b.degree));
}

/**
 * The criteria list arrives as free text: one long `Courses: ...` line plus
 * odds and ends like `UG: 7.0 CGPA`. Split it into course chips, label/value
 * pairs, and leftover prose so each gets its own layout.
 */
function parseEligibility(
	criteria: string[] | null | undefined,
	requirements: EligibilityRequirement[] | null | undefined,
): Eligibility {
	const courses: string[] = [];
	const pairs: EligibilityRequirement[] = [...(requirements ?? [])];
	const notes: string[] = [];

	for (const raw of criteria ?? []) {
		const criterion = raw.replace(/\s+/g, " ").trim();
		if (!criterion) continue;

		const parts = criterion
			.replace(COURSE_LABEL, "")
			.split(",")
			.map((part) => part.trim())
			.filter(Boolean);
		if (parts.length && parts.every((part) => DEGREE_PATTERN.test(part))) {
			courses.push(...parts);
			continue;
		}

		const colon = criterion.indexOf(":");
		if (colon > 0 && colon <= 24 && criterion.length > colon + 1) {
			pairs.push({
				label: criterion.slice(0, colon).trim(),
				value: criterion.slice(colon + 1).trim(),
			});
			continue;
		}

		notes.push(criterion);
	}

	return { courses: groupCourses(courses), requirements: pairs, notes };
}

function NoticeDetails({ details }: { details: Detail[] }) {
	if (!details.length) return null;
	return (
		<div className="rounded-xl border p-4 bg-primary/5 border-primary/20">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{details.map(({ label, value, icon: Icon }) => (
					<div key={label} className="flex min-w-0 items-center gap-3">
						<div className="shrink-0 p-2 rounded-lg bg-background border border-primary/10">
							<Icon className="w-4 h-4 text-primary" />
						</div>
						<div className="min-w-0">
							<p className="text-xs text-muted-foreground font-medium">{label}</p>
							<p className="font-medium text-foreground break-words">{value}</p>
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
		<div className="rounded-xl border p-4 bg-card border-border overflow-hidden">
			{markdown ? (
				<div className="prose prose-sm max-w-none text-foreground prose-table:block prose-table:overflow-x-auto">
					<ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
				</div>
			) : (
				<div
					className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-li:my-1 prose-table:block prose-table:overflow-x-auto"
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

	const eligibility = parseEligibility(
		notice.eligibility_criteria,
		notice.eligibility_requirements,
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
					<h3 className="text-lg font-semibold leading-tight text-foreground break-words">
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

						{eligibility.courses.length ||
						eligibility.requirements.length ||
						eligibility.notes.length ? (
							<section className="rounded-xl border p-4 bg-primary/5 border-primary/20">
								<h4 className="font-semibold mb-3 flex items-center text-foreground">
									<UsersIcon className="w-4 h-4 mr-2 text-primary" />
									Eligibility Criteria
								</h4>
								<div className="space-y-4">
									{eligibility.courses.length ? (
										<div>
											<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
												Eligible Courses
											</p>
											<div className="space-y-1.5">
												{eligibility.courses
													.filter(({ branches }) => branches.length)
													.map(({ degree, branches }) => (
														<div
															key={degree}
															className="flex flex-wrap items-center gap-1.5"
														>
															<span className="w-full sm:w-32 shrink-0 text-xs font-semibold text-primary break-words">
																{degree}
															</span>
															{branches.map((branch) => (
																<Badge
																	key={branch}
																	variant="outline"
																	className="bg-background text-foreground border-primary/20 text-xs font-normal"
																>
																	{branch}
																</Badge>
															))}
														</div>
													))}
												{eligibility.courses.some(({ branches }) => !branches.length) ? (
													<div className="flex flex-wrap items-center gap-1.5">
														{eligibility.courses
															.filter(({ branches }) => !branches.length)
															.map(({ degree }) => (
																<Badge
																	key={degree}
																	variant="outline"
																	className="bg-background text-foreground border-primary/20 text-xs font-normal"
																>
																	{degree}
																</Badge>
															))}
													</div>
												) : null}
											</div>
										</div>
									) : null}

									{eligibility.requirements.length ? (
										<dl className="flex flex-wrap gap-1.5">
											{eligibility.requirements.map(({ label, value }) => (
												<div
													key={`${label}-${value}`}
													className="flex items-baseline gap-1.5 rounded-md border border-primary/20 bg-background px-2 py-1 text-xs"
												>
													<dt className="text-muted-foreground">{label}</dt>
													<dd className="font-semibold text-foreground">{value}</dd>
												</div>
											))}
										</dl>
									) : null}

									{eligibility.notes.length ? (
										<ul className="space-y-2 text-sm text-foreground">
											{eligibility.notes.map((note, index) => (
												<li key={`${index}-${note}`} className="flex items-start gap-2">
													<span aria-hidden>•</span>
													<span className="min-w-0 break-words">{note}</span>
												</li>
											))}
										</ul>
									) : null}
								</div>
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
											<span className="min-w-0 break-words">{step}</span>
										</li>
									))}
								</ol>
							</section>
						) : null}
					</div>
				) : COMPACT_CATEGORIES.has(notice.category) ? (					company || role || packageText ? (
						<div className="rounded-xl p-4 border bg-primary/5 border-primary/20 flex flex-wrap gap-2 [&>div]:max-w-full [&>div]:whitespace-normal [&>div]:break-words">
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
								<div className="min-w-0">
									<h4 className="font-medium mb-1 text-foreground">
										Related Job Posting
									</h4>
									<p className="text-sm text-foreground break-words">
										{notice.matched_job.company} - {notice.matched_job.job_profile}
									</p>
									<p className="text-xs mt-1 text-muted-foreground">
										{isPending && openingJob
											? "Loading..."
											: "Open full job details"}
									</p>
								</div>
								<ArrowRightIcon className="w-4 h-4 mt-2 shrink-0 group-hover:translate-x-0.5 transition-transform" />
							</div>
						</button>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
