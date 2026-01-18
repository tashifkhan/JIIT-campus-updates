"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	CalendarIcon,
	BuildingIcon,
	UsersIcon,
	TrendingUpIcon,
	IndianRupeeIcon,
	BellIcon,
	ArrowRightIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

import NoticesFilters from "@/components/notice/NoticesFilters";
import ShortlistTable from "@/components/notice/ShortlistTable";
import {
	Notice as NoticeType,
	parseFormattedMessage,
	formatEligibility,
	formatHiringProcess,
	formatDateTime,
	parseShortlistFromText,
	isPlacementBotPost,
} from "@/lib/notices";

const categoryIcons: Record<string, any> = {
	"job posting": BellIcon,
	shortlisting: TrendingUpIcon,
	update: CalendarIcon,
	"placement offer": IndianRupeeIcon,
};

type Props = {
	hideShortPlacements?: boolean;
};

/**
 * NoticesClient
 *
 * High-level flow of how the notice cards are built and shown on the page:
 * 1) Fetch raw notices and placement offers via React Query.
 * 2) Normalize both datasets into a single common shape (company/role/ctc, timestamps, etc.).
 * 3) Optionally filter out short bot-like announcements and apply user filters (query/category/onlyShortlisted).
 * 4) Paginate the filtered list into `currentNotices`.
 * 5) Render a Card (from shadcn/ui) for each notice in `currentNotices`.
 *
 * Where the cards are actually created:
 * - See the map over `currentNotices` near the bottom of this file: `{currentNotices.map((notice) => ( <Card>...</Card> ))}`.
 *   Each iteration returns a single notice Card composed of a header and a content section.
 *   The content section switches its layout by category (job posting/update/placement offer vs shortlisting vs generic update).
 */
export default function NoticesClient({ hideShortPlacements = false }: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [pendingJobId, setPendingJobId] = useState<string | null>(null);
	const [expandedNotice, setExpandedNotice] = useState<string | null>(null);

	const { data: rawNotices, isLoading } = useQuery<any[]>({
		queryKey: ["notices"],
		queryFn: async () => {
			const res = await fetch("/api/notices");
			const json = await res.json();
			if (!json.ok) throw new Error(json.error || "Failed to fetch notices");
			return json.data || [];
		},
	});

	// Placement offers
	const { data: rawOffers, isLoading: isLoadingOffers } = useQuery<any[]>({
		queryKey: ["placement-offers"],
		queryFn: async () => {
			const res = await fetch("/api/placement-offers", { cache: "no-store" });
			const json = await res.json();
			if (!json.ok)
				throw new Error(json.error || "Failed to fetch placement offers");
			return json.data || [];
		},
	});

	// Normalize the data on client side
	// This prepares a uniform shape so the renderer can create identical Card structures
	// regardless of whether the source is a "notice" or a "placement offer".
	const notices = useMemo(() => {
		const normalizedNotices = (rawNotices || [])
			.map((n) => {
				// _id may be ObjectId / BSON - convert to string
				const id =
					n._id &&
					typeof n._id === "object" &&
					typeof n._id.toString === "function"
						? n._id.toString()
						: n._id;
				const createdAt = n.createdAt
					? typeof n.createdAt === "number"
						? n.createdAt
						: new Date(n.createdAt).getTime()
					: undefined;
				const updatedAt = n.updatedAt
					? typeof n.updatedAt === "number"
						? n.updatedAt
						: new Date(n.updatedAt).getTime()
					: undefined;

				// Build matched_job object if any job info is available
				const matchedJobId = n.matched_job_id ?? n.matched_job?.id ?? null;
				const matched_job = matchedJobId
					? {
							id:
								typeof matchedJobId === "object" &&
								typeof matchedJobId.toString === "function"
									? matchedJobId.toString()
									: String(matchedJobId),
							company: n.job_company ?? n.matched_job?.company ?? null,
							job_profile: n.job_role ?? n.matched_job?.job_profile ?? null,
						}
					: null;

				// Formatting fix for trailing brackets in the CTC text/breakdown
				if (typeof n.package === "string" && n.package.endsWith("(")) {
					n.package = n.package.slice(0, -1);
				}
				if (
					typeof n.package_breakdown === "string" &&
					n.package_breakdown.endsWith(")")
				) {
					n.package_breakdown = n.package_breakdown.slice(0, -1);
				}

				return {
					// copy scalar fields explicitly to avoid passing BSON objects
					_id: id,
					id: n.id ?? undefined,
					title: n.title ?? undefined,
					content: n.content ?? undefined,
					author: n.author ?? undefined,
					createdAt,
					updatedAt,
					category: n.category ?? null,
					matched_job,
					matched_job_id: n.matched_job_id ?? null,
					job_company: n.job_company ?? null,
					job_role: n.job_role ?? null,
					// "package" is the primary CTC text (e.g., "8 LPA") if provided by the source notice
					package: n.package ?? null,
					// "package_breakdown" is a markdown-ish multi-line string summarizing components
					// like Base/Fix/Bonus etc. It’s displayed by consumers that choose to render it.
					package_breakdown: n.package_breakdown ?? null,
					formatted_message: n.formatted_message ?? null,
					location: n.location ?? null,
					sent_to_telegram: n.sent_to_telegram ?? null,
					updated_at: n.updated_at ?? undefined,
					shortlisted_students: n.shortlisted_students ?? null,
					number_of_offers: null,
					joiningDate: undefined,
				};
			})
			.map((n) => ({
				...n,
				category: (n.category || "")
					.toLowerCase()
					.trim()
					.replace(/^\[?shortlist(ing)?\]?$/, "shortlisting"),
			}));

		const normalizedOffers = (rawOffers || []).map((o) => {
			const rawId =
				o._id &&
				typeof o._id === "object" &&
				typeof o._id.toString === "function"
					? o._id.toString()
					: o._id || o.id;
			// Prefer createdAt, then saved_at, then updated_at; otherwise leave null so it sorts last
			const createdAt = o.createdAt
				? new Date(o.createdAt).getTime()
				: o.saved_at
					? new Date(o.saved_at).getTime()
					: o.updated_at
						? new Date(o.updated_at).getTime()
						: undefined;

			// Compute a representative role and CTC
			const roles: Array<{
				role?: string;
				package?: number;
				package_details?: string;
			}> = Array.isArray(o.roles) ? o.roles : [];
			const primaryRole = roles.find((r) => !!r?.role)?.role || "Offer";
			const packages = roles
				.map((r) => (typeof r?.package === "number" ? r.package : null))
				.filter((x) => x != null) as number[];
			// `bestPackage` picks the max package across roles (if any), fallback to the first student's package
			const bestPackage = packages.length
				? Math.max(...packages)
				: (o.students_selected?.[0]?.package ?? null);
			const ctcText = bestPackage != null ? `${bestPackage} LPA` : "";

			// Build a markdown-ish formatted message compatible with existing parser
			const parts: string[] = [];
			parts.push("**Placement Offer**");
			if (o.company) parts.push(`**Company:** ${o.company}`);
			if (primaryRole) parts.push(`**Role:** ${primaryRole}`);
			if (ctcText) parts.push(`**CTC:** ${ctcText}`);
			if (Array.isArray(o.job_location) && o.job_location.length)
				parts.push(`**Location:** ${o.job_location.join(", ")}`);
			// Joining Date and Number of Offers are now displayed in the Grid Layout,
			// so we exclude them from the markdown body to avoid redundancy.
			/*
			if (o.joining_date)
				parts.push(
					`Joining Date: ${new Date(o.joining_date).toLocaleDateString(
						"en-IN",
						{
							year: "numeric",
							month: "short",
							day: "numeric",
						}
					)}`
				);
			if (o.number_of_offers != null)
				parts.push(`Number of Offers: ${o.number_of_offers}`);
			*/
			// Note: additional_info is removed from the API response for privacy/security.
			// so that it doesn't render in the body and doesn't trigger deadline parsing.

			const formatted_message = parts.join("\n\n");

			const shortlisted_students = Array.isArray(o.students_selected)
				? o.students_selected.map((s: any) => ({
						name: s.name,
						enrollment_number: s.enrollment_number ?? s.enroll ?? null,
					}))
				: null;

			return {
				_id: rawId,
				id: String(rawId),
				title: undefined,
				content: undefined,
				author: undefined,
				createdAt,
				updatedAt: createdAt,
				category: "placement offer",
				matched_job: null,
				matched_job_id: null,
				job_company: o.company || null,
				job_role: primaryRole || null,
				// Carry over the offers count so we can filter zero-placement offers
				number_of_offers: o.number_of_offers ?? null,
				// `package` is the headline CTC to show on the card (e.g., "8 LPA").
				package: ctcText || null,
				// `package_breakdown` aggregates each role's detailed package lines (if available),
				// resulting in a markdown list suitable for rendering in a details/expandable section.
				package_breakdown: roles
					.map((r) =>
						r?.package_details
							? `- ${r.role || "Role"}: ${r.package_details}`
							: "",
					)
					.filter(Boolean)
					.join("\n"),
				formatted_message,
				sent_to_telegram: null,
				updated_at: o.updated_at || null,
				shortlisted_students,
				joiningDate: o.joining_date
					? new Date(o.joining_date).toLocaleDateString("en-IN", {
							year: "numeric",
							month: "short",
							day: "numeric",
						})
					: undefined,
			};
		});

		// Combine and filter out bot-like short placement announcements
		const combined = [...normalizedNotices, ...normalizedOffers].filter(
			(n) => !isPlacementBotPost(n),
		);

		// Additional filtering for short placement announcements if requested
		const finalFiltered = hideShortPlacements
			? combined.filter((n) => {
					// Hide notices that are just short announcements like "1 student have been placed at..."
					// but keep detailed placement offers
					const text = (n.formatted_message || "").toLowerCase();
					const isShortAnnouncement =
						(text.includes("student have been placed at") ||
							text.includes("student has been placed at")) &&
						text.length < 400; // short messages only

					const isDetailedOffer =
						n.category === "placement offer" &&
						(text.includes("company:") ||
							text.includes("role:") ||
							text.includes("ctc:") ||
							text.includes("joining date:"));

					// Additionally hide placement-offer cards with zero placed students
					// If number_of_offers is explicitly 0 OR students list length is 0, drop it
					const zeroPlacedOffer =
						n.category === "placement offer" &&
						((n as any).number_of_offers === 0 ||
							(n.shortlisted_students?.length ?? 0) === 0);

					// Keep detailed offers, hide short announcements
					return (!isShortAnnouncement || isDetailedOffer) && !zeroPlacedOffer;
				})
			: combined;

		return finalFiltered.sort((a, b) => {
			const aTime = a.createdAt ?? null;
			const bTime = b.createdAt ?? null;
			if (aTime == null && bTime == null) return 0;
			if (aTime == null) return 1; // a goes after b
			if (bTime == null) return -1; // b goes after a
			return bTime - aTime; // newer first
		});
	}, [rawNotices, rawOffers, hideShortPlacements]);

	const loading = isLoading || isLoadingOffers;
	// Filters
	const [query, setQuery] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [onlyShortlisted, setOnlyShortlisted] = useState(false);
	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);

	const allCategories = useMemo(
		() => Array.from(new Set(notices.map((n) => n.category))).sort(),
		[notices],
	);

	// Apply UI filters (search text, category chips, and "Only shortlisted")
	// The result of this memo feeds into pagination and ultimately into the Card rendering.
	const filteredNotices = useMemo(() => {
		const q = query.trim().toLowerCase();
		return notices.filter((n) => {
			if (selectedCategories.length && !selectedCategories.includes(n.category))
				return false;
			if (onlyShortlisted) {
				const isShortlistCategory =
					n.category === "shortlisting" || n.category === "placement offer";
				const parsedCount = isShortlistCategory
					? parseShortlistFromText(n.formatted_message).length
					: 0;
				const providedCount = n.shortlisted_students?.length ?? 0;
				if (providedCount + parsedCount === 0) return false;
			}
			if (q) {
				const hay = `${n.formatted_message} ${n.matched_job?.company ?? ""} ${
					n.matched_job?.job_profile ?? ""
				}`.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		});
	}, [notices, query, selectedCategories, onlyShortlisted]);

	// Pagination
	const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentNotices = filteredNotices.slice(startIndex, endIndex);

	// NOTE: Cards are rendered for each item in `currentNotices` below.
	// Look for `{currentNotices.map((notice) => { ... return (<Card>...</Card>) })}`.

	useEffect(() => {
		setCurrentPage(1);
	}, [query, selectedCategories, onlyShortlisted, itemsPerPage]);

	// Scroll to top when page changes
	// On desktop (lg+), the scrollable container is the <main> element, not window
	useEffect(() => {
		// Try to find the main scrollable container (used on desktop)
		const mainScrollContainer = document.querySelector(
			"main.lg\\:overflow-auto",
		);
		if (mainScrollContainer && window.innerWidth >= 1024) {
			// Desktop: scroll the main container
			mainScrollContainer.scrollTo({ top: 0, behavior: "smooth" });
		} else {
			// Mobile: scroll the window
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [currentPage]);

	if (loading) {
		return (
			<div className="space-y-4">
				{[...Array(3)].map((_, i) => (
					<Card key={i} className="animate-pulse card-theme">
						<CardContent className="p-6">
							<div className="h-4 rounded w-3/4 mb-2 bg-muted/50" />
							<div className="h-3 rounded w-1/2 bg-muted/50" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<div className="text-center mb-8">
				<h1 className="text-2xl lg:text-3xl font-bold mb-2 text-foreground">
					Latest Updates
				</h1>
				<p className="text-muted-foreground">
					Stay informed about placement activities
				</p>
			</div>

			<Card className="mb-4 card-theme">
				<CardContent className="p-4 lg:p-6 space-y-3">
					<NoticesFilters
						query={query}
						setQuery={setQuery}
						allCategories={allCategories}
						selectedCategories={selectedCategories}
						setSelectedCategories={setSelectedCategories}
						onlyShortlisted={onlyShortlisted}
						setOnlyShortlisted={setOnlyShortlisted}
						itemsPerPage={itemsPerPage}
						setItemsPerPage={setItemsPerPage}
						resultsCount={filteredNotices.length}
					/>
				</CardContent>
			</Card>

			<div className="space-y-6">
				{/*
					CARD CREATION ENTRY POINT
					- This map is where each Notice becomes a visual Card.
					- The Card uses shadcn/ui `Card`, `CardHeader`, and `CardContent` components.
					- Data for the card comes from `notice` and parsed fields from `parseFormattedMessage`.
				*/}
				{currentNotices.map((notice) => {
					const IconComponent = categoryIcons[notice.category] ?? BellIcon;
					const parsed =
						notice.category === "shortlisting" &&
						(!notice.shortlisted_students ||
							notice.shortlisted_students.length === 0)
							? parseShortlistFromText(notice.formatted_message)
							: [];
					const students = (notice.shortlisted_students ?? []).concat(
						parsed as any,
					);
					const hasShortlistedStudents = students.length > 0;

					const parsedMessage = parseFormattedMessage(
						notice.formatted_message,
						notice.category,
					);
					const eligibilityCriteria = formatEligibility(
						parsedMessage.eligibility,
					);
					const hiringSteps = (
						formatHiringProcess(parsedMessage.hiringProcess) || []
					).filter((s: string) => {
						const t = String(s || "").trim();
						// Remove lines that are the Detailed JD link (or start with the link emoji)
						if (!t) return false;
						if (/detailed\s*jd/i.test(t)) return false;
						if (/^\s*🔗/.test(t)) return false;
						return true;
					});

					return (
						<Card
							key={notice.id}
							className="notice-card transition-all duration-300 card-theme bg-card border-border text-foreground"
						>
							{/* Card header: category badge + author/date */}
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<Badge
										variant="outline"
										className="px-3 py-1 rounded-full bg-primary/10 text-primary border-primary/20"
									>
										<IconComponent className="w-3 h-3 mr-2" />
										{notice.category
											.split(" ")
											.map(
												(w: string) => w.charAt(0).toUpperCase() + w.slice(1),
											)
											.join(" ")}
									</Badge>
									{(notice.createdAt || notice.author) && (
										<div className="text-xs text-muted-foreground ml-auto">
											{notice.createdAt && (
												<span>{formatDateTime(notice.createdAt)}</span>
											)}
										</div>
									)}
								</div>
								{notice.author && notice.category !== "placement offer" && (
									<div className="text-xs text-muted-foreground mt-1 ml-1">
										By {notice.author}
									</div>
								)}
								{notice.category === "placement offer" && (
									<div className="text-xs text-muted-foreground mt-1 ml-1">
										By Placement Bot
									</div>
								)}
							</CardHeader>
							{/* Card body: category-specific layout */}
							<CardContent className="pt-0">
								{notice.category === "update" ||
								notice.category === "job posting" ||
								notice.category === "placement offer" ? (
									<div className="space-y-4">
										{/* Title */}
										{parsedMessage.title && (
											<div className="mb-2">
												<h3 className="text-lg font-semibold leading-tight text-foreground">
													{parsedMessage.title}
												</h3>
											</div>
										)}

										{/* Key Details Grid Container */}
										{(parsedMessage.company ||
											parsedMessage.role ||
											parsedMessage.ctc ||
											parsedMessage.deadline ||
											notice.joiningDate ||
											(notice.category === "placement offer" &&
												notice.number_of_offers)) && (
											<div className="rounded-xl border p-4 bg-primary/5 border-primary/20">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													{parsedMessage.company && (
														<div className="flex items-center gap-3">
															<div className="p-2 rounded-lg bg-background border border-primary/10">
																<BuildingIcon className="w-4 h-4 text-primary" />
															</div>
															<div>
																<p className="text-xs text-muted-foreground font-medium">
																	Company
																</p>
																<p className="font-medium text-foreground">
																	{parsedMessage.company}
																</p>
															</div>
														</div>
													)}

													{parsedMessage.role && (
														<div className="flex items-center gap-3">
															<div className="p-2 rounded-lg bg-background border border-primary/10">
																<UsersIcon className="w-4 h-4 text-primary" />
															</div>
															<div>
																<p className="text-xs text-muted-foreground font-medium">
																	Role
																</p>
																<div className="flex flex-wrap">
																	<Badge
																		variant="secondary"
																		className="rounded-sm px-2 py-0.5 bg-transparent border-0 text-foreground p-0 h-auto font-medium"
																	>
																		{parsedMessage.role}
																	</Badge>
																</div>
															</div>
														</div>
													)}

													{parsedMessage.ctc &&
														parsedMessage.ctc.toLowerCase().trim() !==
															"none" && (
															<div className="flex items-center gap-3">
																<div className="p-2 rounded-lg bg-background border border-primary/10">
																	<IndianRupeeIcon className="w-4 h-4 text-primary" />
																</div>
																<div>
																	<p className="text-xs text-muted-foreground font-medium">
																		CTC
																	</p>
																	<p className="font-medium text-foreground">
																		{parsedMessage.ctc.replace(/^₹\s?/, "")}
																	</p>
																</div>
															</div>
														)}

													{parsedMessage.deadline &&
														notice.category !== "placement offer" && (
															<div className="flex items-center gap-3">
																<div className="p-2 rounded-lg bg-background border border-primary/10">
																	<CalendarIcon className="w-4 h-4 text-primary" />
																</div>
																<div>
																	<p className="text-xs text-muted-foreground font-medium">
																		Deadline
																	</p>
																	<p className="font-medium text-foreground">
																		{parsedMessage.deadline}
																	</p>
																</div>
															</div>
														)}

													{notice.joiningDate &&
														notice.category === "placement offer" && (
															<div className="flex items-center gap-3">
																<div className="p-2 rounded-lg bg-background border border-primary/10">
																	<CalendarIcon className="w-4 h-4 text-primary" />
																</div>
																<div>
																	<p className="text-xs text-muted-foreground font-medium">
																		Joining Date
																	</p>
																	<p className="font-medium text-foreground">
																		{notice.joiningDate}
																	</p>
																</div>
															</div>
														)}

													{notice.category === "placement offer" &&
														notice.number_of_offers && (
															<div className="flex items-center gap-3">
																<div className="p-2 rounded-lg bg-background border border-primary/10">
																	<UsersIcon className="w-4 h-4 text-primary" />
																</div>
																<div>
																	<p className="text-xs text-muted-foreground font-medium">
																		Offers
																	</p>
																	<p className="font-medium text-foreground">
																		{notice.number_of_offers}
																	</p>
																</div>
															</div>
														)}
												</div>
											</div>
										)}

										{parsedMessage.body && (
											<div className="rounded-xl border p-4 bg-card border-border">
												<div className="prose prose-sm max-w-none text-foreground">
													<ReactMarkdown remarkPlugins={[remarkGfm]}>
														{parsedMessage.body}
													</ReactMarkdown>
												</div>
											</div>
										)}

										{/* Eligibility section for job postings */}
										{eligibilityCriteria && eligibilityCriteria.length > 0 && (
											<div className="rounded-xl border p-4 bg-primary/5 border-primary/20">
												<h4 className="font-semibold mb-3 flex items-center text-foreground">
													<UsersIcon className="w-4 h-4 mr-2 text-primary" />
													Eligibility Criteria
												</h4>
												<div className="space-y-3">
													{eligibilityCriteria.map(
														(criteria: any, idx: number) => (
															<div key={idx}>
																{criteria.type === "courses" && (
																	<div>
																		<span className="text-sm font-medium text-muted-foreground">
																			Eligible Branches
																		</span>
																		<div className="flex flex-wrap gap-1 mt-1">
																			{Array.isArray(criteria.value) ? (
																				criteria.value.map(
																					(course: string, i: number) => (
																						<Badge
																							key={i}
																							variant="secondary"
																							className="text-xs bg-background border border-primary/10 text-foreground"
																						>
																							{course.trim()}
																						</Badge>
																					),
																				)
																			) : (
																				<Badge
																					variant="secondary"
																					className="text-xs bg-background border border-primary/10 text-foreground"
																				>
																					{String(criteria.value).trim()}
																				</Badge>
																			)}
																		</div>
																	</div>
																)}
																{criteria.type === "marks" && (
																	<div className="flex items-center text-sm">
																		<span className="font-medium mr-2 text-muted-foreground">
																			{criteria.level.replace("_", " ")}
																		</span>
																		<span className="font-semibold text-foreground">
																			{criteria.value}{" "}
																			{criteria.unit.replace("CGPA", "")}
																		</span>
																	</div>
																)}
																{(criteria.type === "requirement" ||
																	criteria.type === "general") && (
																	<div className="text-sm text-foreground flex items-start">
																		<span className="mr-2">•</span>
																		<span>{criteria.value}</span>
																	</div>
																)}
															</div>
														),
													)}
												</div>
											</div>
										)}

										{/* Hiring process steps (numbered chips) */}
										{hiringSteps.length > 0 && (
											<div className="rounded-xl border p-4 bg-primary/5 border-primary/20">
												<h4 className="font-semibold mb-3 flex items-center text-foreground">
													<CalendarIcon className="w-4 h-4 mr-2 text-primary" />
													Hiring Process
												</h4>
												<div className="space-y-2">
													{hiringSteps.map((step: string, idx: number) => (
														<div
															key={idx}
															className="flex items-center text-sm"
														>
															<div className="w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center mr-3 flex-shrink-0 bg-primary text-primary-foreground">
																{idx + 1}
															</div>
															<span className="text-foreground">{step}</span>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								) : notice.category === "shortlisting" ? (
									<div className="space-y-4">
										{/* Shortlisting: compact header with company/role/ctc */}
										{parsedMessage.title && (
											<div className="mb-4">
												<h3
													className="text-lg font-semibold leading-tight"
													style={{ color: "var(--text-color)" }}
												>
													{parsedMessage.title}
												</h3>
											</div>
										)}
										{(parsedMessage.company ||
											parsedMessage.role ||
											parsedMessage.ctc) && (
											<div className="rounded-xl p-4 border bg-primary/5 border-primary/20">
												{/* Shortlisting header shows CTC (package) if present.
												   Any detailed package breakdown, when needed, can be
												   rendered using `notice.package_breakdown`. */}
												<div className="flex flex-wrap gap-3 items-center justify-between">
													<div className="flex flex-wrap gap-2">
														{parsedMessage.company && (
															<Badge
																variant="secondary"
																className="bg-card text-primary border-border"
															>
																<BuildingIcon className="w-3 h-3 mr-1" />
																{parsedMessage.company}
															</Badge>
														)}
														{parsedMessage.role && (
															<Badge
																variant="secondary"
																className="bg-card text-primary border-border"
															>
																{parsedMessage.role}
															</Badge>
														)}
													</div>
													{parsedMessage.ctc &&
														parsedMessage.ctc.toLowerCase().trim() !==
															"none" && (
															<Badge
																variant="outline"
																className="font-medium bg-primary/10 text-primary border-border"
															>
																<IndianRupeeIcon className="w-3 h-3 mr-1" />
																{parsedMessage.ctc.replace(/^₹\s?/, "")}
															</Badge>
														)}
												</div>
											</div>
										)}
									</div>
								) : (
									<div className="space-y-4">
										{/* Fallback generic render using parsed body */}
										{parsedMessage.title && (
											<div className="mb-4">
												<h3
													className="text-lg font-semibold leading-tight"
													style={{ color: "var(--text-color)" }}
												>
													{parsedMessage.title}
												</h3>
											</div>
										)}
										<div className="rounded-lg p-4 border bg-primary/10 border-border">
											<div
												className="prose prose-sm max-w-none"
												style={{ color: "var(--text-color)" }}
											>
												<ReactMarkdown remarkPlugins={[remarkGfm]}>
													{parsedMessage.body || notice.formatted_message}
												</ReactMarkdown>
											</div>
										</div>
									</div>
								)}

								{/* Shortlist table (collapsible) shown when students are present */}
								{hasShortlistedStudents && (
									<div
										className="border-t pt-4"
										style={{ borderColor: "var(--border-color)" }}
									>
										<div className="rounded-xl p-4 border bg-primary/5 border-primary/20">
											<ShortlistTable
												students={students as any}
												expanded={expandedNotice === notice.id}
												onToggle={() =>
													setExpandedNotice((prev) =>
														prev === notice.id ? null : notice.id,
													)
												}
											/>
										</div>
									</div>
								)}

								{/* Related job link tile shown when `matched_job` points to a job in the system */}
								{notice.matched_job && (
									<div
										className="border-t pt-4"
										style={{ borderColor: "var(--border-color)" }}
									>
										<div
											className="rounded-xl p-4 border cursor-pointer transition-all duration-200 group bg-primary/5 border-primary/20 hover:bg-primary/10 hover:shadow-sm"
											onClick={() => {
												const jobId = notice.matched_job?.id;
												if (jobId) {
													setPendingJobId(jobId);
													startTransition(() => {
														router.push(`/jobs/${jobId}`);
													});
												}
											}}
											role="button"
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													const jobId = notice.matched_job?.id;
													if (jobId) {
														setPendingJobId(jobId);
														startTransition(() => {
															router.push(`/jobs/${jobId}`);
														});
													}
												}
											}}
											aria-busy={
												isPending && pendingJobId === notice.matched_job?.id
											}
										>
											<div className="flex items-start justify-between">
												<div className="flex items-start flex-1">
													<div className="p-2 mr-3 rounded-lg bg-background border border-primary/10">
														<BellIcon className="w-5 h-5 text-primary" />
													</div>
													<div className="flex-1">
														<h4 className="font-medium mb-1 text-foreground">
															Related Job Posting
														</h4>
														<p className="text-sm text-foreground">
															<span className="font-medium">
																{notice.matched_job.company}
															</span>{" "}
															- {notice.matched_job.job_profile}
														</p>
														{isPending &&
														pendingJobId === notice.matched_job?.id ? (
															<div className="flex items-center text-xs mt-1">
																<div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin mr-2 border-border" />
																<span className="text-muted-foreground">
																	Loading…
																</span>
															</div>
														) : (
															<p className="text-xs mt-1 group-hover:text-primary transition-colors text-muted-foreground">
																Click to view full job details
															</p>
														)}
													</div>
												</div>
												<div className="bg-background rounded-full p-2 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
													<ArrowRightIcon className="w-4 h-4" />
												</div>
											</div>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					);
				})}

				{currentNotices.length === 0 && !loading && (
					<Card className="text-center py-12 card-theme">
						<CardContent>
							<p className="text-muted-foreground">
								No updates found matching your criteria.
							</p>
						</CardContent>
					</Card>
				)}
			</div>

			{totalPages > 1 && (
				<div className="mt-8">
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									onClick={() =>
										setCurrentPage((prev) => Math.max(prev - 1, 1))
									}
									className={
										currentPage === 1
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
								/>
							</PaginationItem>

							{(() => {
								const pages = [];
								const showPages = [];

								// Always show first page
								if (totalPages > 0) showPages.push(1);

								// Show pages around current page
								const start = Math.max(2, currentPage - 1);
								const end = Math.min(totalPages - 1, currentPage + 1);

								for (let i = start; i <= end; i++) {
									if (!showPages.includes(i)) {
										showPages.push(i);
									}
								}

								// Always show last page (if different from first)
								if (totalPages > 1 && !showPages.includes(totalPages)) {
									showPages.push(totalPages);
								}

								// Sort pages
								showPages.sort((a, b) => a - b);

								// Add ellipsis where needed and create pagination items
								for (let i = 0; i < showPages.length; i++) {
									const page = showPages[i];
									const prevPage = showPages[i - 1];

									// Add ellipsis if there's a gap
									if (prevPage && page - prevPage > 1) {
										pages.push(
											<PaginationItem key={`ellipsis-${prevPage}`}>
												<PaginationEllipsis />
											</PaginationItem>,
										);
									}

									// Add the page
									pages.push(
										<PaginationItem key={page}>
											<PaginationLink
												onClick={() => setCurrentPage(page)}
												isActive={currentPage === page}
												className="cursor-pointer"
											>
												{page}
											</PaginationLink>
										</PaginationItem>,
									);
								}

								return pages;
							})()}

							<PaginationItem>
								<PaginationNext
									onClick={() =>
										setCurrentPage((prev) => Math.min(prev + 1, totalPages))
									}
									className={
										currentPage === totalPages
											? "pointer-events-none opacity-50"
											: "cursor-pointer"
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</div>
	);
}
