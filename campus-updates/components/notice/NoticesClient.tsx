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
} from "@/lib/notices";

const categoryIcons: Record<string, any> = {
	"job posting": BellIcon,
	shortlisting: TrendingUpIcon,
	update: CalendarIcon,
	"placement offer": IndianRupeeIcon,
};

type Props = {};

export default function NoticesClient({}: Props) {
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
					: null;
				const updatedAt = n.updatedAt
					? typeof n.updatedAt === "number"
						? n.updatedAt
						: new Date(n.updatedAt).getTime()
					: null;

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

				return {
					// copy scalar fields explicitly to avoid passing BSON objects
					_id: id,
					id: n.id ?? null,
					title: n.title ?? null,
					content: n.content ?? null,
					author: n.author ?? null,
					createdAt,
					updatedAt,
					category: n.category ?? null,
					matched_job,
					matched_job_id: n.matched_job_id ?? null,
					job_company: n.job_company ?? null,
					job_role: n.job_role ?? null,
					package: n.package ?? null,
					package_breakdown: n.package_breakdown ?? null,
					formatted_message: n.formatted_message ?? null,
					location: n.location ?? null,
					sent_to_telegram: n.sent_to_telegram ?? null,
					updated_at: n.updated_at ?? null,
					shortlisted_students: n.shortlisted_students ?? null,
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
				: null;

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
			const bestPackage = packages.length
				? Math.max(...packages)
				: o.students_selected?.[0]?.package ?? null;
			const ctcText = bestPackage != null ? `${bestPackage} LPA` : "";

			// Build a markdown-ish formatted message compatible with existing parser
			const parts: string[] = [];
			parts.push("**Placement Offer**");
			if (o.company) parts.push(`**Company:** ${o.company}`);
			if (primaryRole) parts.push(`**Role:** ${primaryRole}`);
			if (ctcText) parts.push(`**CTC:** ${ctcText}`);
			if (Array.isArray(o.job_location) && o.job_location.length)
				parts.push(`**Location:** ${o.job_location.join(", ")}`);
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
			// Note: We intentionally skip including additional_info for placement offers
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
				title: o.email_subject || null,
				content: null,
				author: o.email_sender || null,
				createdAt,
				updatedAt: createdAt,
				category: "placement offer",
				matched_job: null,
				matched_job_id: null,
				job_company: o.company || null,
				job_role: primaryRole || null,
				package: ctcText || null,
				package_breakdown: roles
					.map((r) =>
						r?.package_details
							? `- ${r.role || "Role"}: ${r.package_details}`
							: ""
					)
					.filter(Boolean)
					.join("\n"),
				formatted_message,
				location: Array.isArray(o.job_location)
					? o.job_location.join(", ")
					: null,
				sent_to_telegram: null,
				updated_at: o.updated_at || null,
				shortlisted_students,
			};
		});

		return [...normalizedNotices, ...normalizedOffers].sort((a, b) => {
			const aTime = a.createdAt ?? null;
			const bTime = b.createdAt ?? null;
			if (aTime == null && bTime == null) return 0;
			if (aTime == null) return 1; // a goes after b
			if (bTime == null) return -1; // b goes after a
			return bTime - aTime; // newer first
		});
	}, [rawNotices, rawOffers]);

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
		[notices]
	);

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

	useEffect(() => {
		setCurrentPage(1);
	}, [query, selectedCategories, onlyShortlisted, itemsPerPage]);

	if (loading) {
		return (
			<div className="space-y-4">
				{[...Array(3)].map((_, i) => (
					<Card key={i} className="animate-pulse card-theme">
						<CardContent className="p-6">
							<div
								className="h-4 rounded w-3/4 mb-2"
								style={{ backgroundColor: "var(--skeleton-color)" }}
							/>
							<div
								className="h-3 rounded w-1/2"
								style={{ backgroundColor: "var(--skeleton-color)" }}
							/>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<div className="text-center mb-8">
				<h1
					className="text-2xl lg:text-3xl font-bold mb-2"
					style={{ color: "var(--text-color)" }}
				>
					Latest Updates
				</h1>
				<p style={{ color: "var(--label-color)" }}>
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
				{currentNotices.map((notice) => {
					const IconComponent = categoryIcons[notice.category] ?? BellIcon;
					const parsed =
						notice.category === "shortlisting" &&
						(!notice.shortlisted_students ||
							notice.shortlisted_students.length === 0)
							? parseShortlistFromText(notice.formatted_message)
							: [];
					const students = (notice.shortlisted_students ?? []).concat(
						parsed as any
					);
					const hasShortlistedStudents = students.length > 0;

					const parsedMessage = parseFormattedMessage(
						notice.formatted_message,
						notice.category
					);
					const eligibilityCriteria = formatEligibility(
						parsedMessage.eligibility
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
							className="border-l-4 hover:shadow-md transition-all duration-300 card-theme"
							style={{
								backgroundColor: "var(--card-bg)",
								borderColor: "var(--border-color)",
								color: "var(--text-color)",
								borderLeftColor: "var(--accent-color)",
							}}
						>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<Badge
										variant="outline"
										className="px-3 py-1"
										style={{
											backgroundColor: "var(--primary-color)",
											color: "var(--accent-color)",
											borderColor: "var(--border-color)",
										}}
									>
										<IconComponent className="w-3 h-3 mr-2" />
										{notice.category
											.split(" ")
											.map(
												(w: string) => w.charAt(0).toUpperCase() + w.slice(1)
											)
											.join(" ")}
									</Badge>
								</div>
								{(notice.createdAt || notice.author) && (
									<div
										className="flex items-center justify-between mt-3 text-xs"
										style={{ color: "var(--label-color)" }}
									>
										<div className="flex items-center space-x-2">
											{notice.category == "placement offer" ? (
												<span className="font-medium">By Placement Bot </span>
											) : (
												notice.author && (
													<span className="font-medium">
														By {notice.author}
													</span>
												)
											)}
										</div>
										{notice.createdAt && (
											<span>{formatDateTime(notice.createdAt)}</span>
										)}
									</div>
								)}
							</CardHeader>
							<CardContent className="pt-0">
								{notice.category === "update" ||
								notice.category === "job posting" ||
								notice.category === "placement offer" ? (
									<div className="space-y-4">
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
											<div
												className="rounded-lg p-4 border mb-4"
												style={{
													backgroundColor: "var(--primary-color)",
													borderColor: "var(--border-color)",
												}}
											>
												<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
													{parsedMessage.company && (
														<div className="flex items-center">
															<BuildingIcon
																className="w-4 h-4 mr-2"
																style={{ color: "var(--accent-color)" }}
															/>
															<span
																className="font-medium"
																style={{ color: "var(--accent-color)" }}
															>
																{parsedMessage.company}
															</span>
														</div>
													)}
													{parsedMessage.role && (
														<div className="flex items-center">
															<Badge
																variant="secondary"
																style={{
																	backgroundColor: "var(--card-bg)",
																	color: "var(--accent-color)",
																	borderColor: "var(--border-color)",
																}}
															>
																{parsedMessage.role}
															</Badge>
														</div>
													)}
													{parsedMessage.ctc && (
														<div className="flex items-center">
															<IndianRupeeIcon
																className="w-4 h-4 mr-2"
																style={{ color: "var(--accent-color)" }}
															/>
															<span
																className="font-semibold"
																style={{ color: "var(--text-color)" }}
															>
																{parsedMessage.ctc}
															</span>
														</div>
													)}
												</div>
											</div>
										)}

										{parsedMessage.deadline &&
											notice.category !== "placement offer" && (
												<div
													className="border rounded-lg p-3 mb-4"
													style={{
														backgroundColor: "var(--primary-color)",
														borderColor: "var(--border-color)",
													}}
												>
													<div className="flex items-center">
														<CalendarIcon
															className="w-5 h-5 mr-2"
															style={{ color: "var(--accent-color)" }}
														/>
														<span
															className="font-semibold"
															style={{ color: "var(--text-color)" }}
														>
															Deadline:{" "}
														</span>
														<span
															className="ml-1 font-medium"
															style={{ color: "var(--accent-color)" }}
														>
															{parsedMessage.deadline}
														</span>
													</div>
												</div>
											)}

										{parsedMessage.body && (
											<div
												className="rounded-lg border p-4"
												style={{
													backgroundColor: "var(--card-bg)",
													borderColor: "var(--border-color)",
												}}
											>
												<div
													className="prose prose-sm max-w-none"
													style={{ color: "var(--text-color)" }}
												>
													<ReactMarkdown remarkPlugins={[remarkGfm]}>
														{parsedMessage.body}
													</ReactMarkdown>
												</div>
											</div>
										)}

										{eligibilityCriteria && eligibilityCriteria.length > 0 && (
											<div
												className="rounded-lg border p-4"
												style={{
													backgroundColor: "var(--primary-color)",
													borderColor: "var(--border-color)",
												}}
											>
												<h4
													className="font-semibold mb-3 flex items-center"
													style={{ color: "var(--text-color)" }}
												>
													<UsersIcon className="w-4 h-4 mr-2" />
													Eligibility Criteria
												</h4>
												<div className="space-y-3">
													{eligibilityCriteria.map(
														(criteria: any, idx: number) => (
															<div key={idx}>
																{criteria.type === "courses" && (
																	<div>
																		<span
																			className="text-sm font-medium"
																			style={{ color: "var(--accent-color)" }}
																		>
																			Eligible Branches:
																		</span>
																		<div className="flex flex-wrap gap-1 mt-1">
																			{Array.isArray(criteria.value) ? (
																				criteria.value.map(
																					(course: string, i: number) => (
																						<Badge
																							key={i}
																							variant="outline"
																							className="text-xs"
																							style={{
																								backgroundColor:
																									"var(--card-bg)",
																								borderColor:
																									"var(--border-color)",
																								color: "var(--text-color)",
																							}}
																						>
																							{course.trim()}
																						</Badge>
																					)
																				)
																			) : (
																				<Badge
																					variant="outline"
																					className="text-xs"
																					style={{
																						backgroundColor: "var(--card-bg)",
																						borderColor: "var(--border-color)",
																						color: "var(--text-color)",
																					}}
																				>
																					{String(criteria.value).trim()}
																				</Badge>
																			)}
																		</div>
																	</div>
																)}
																{criteria.type === "marks" && (
																	<div className="flex items-center text-sm">
																		<span
																			className="font-medium mr-2"
																			style={{ color: "var(--accent-color)" }}
																		>
																			{criteria.level.replace("_", " ")}:
																		</span>
																		<span
																			style={{ color: "var(--text-color)" }}
																		>
																			{criteria.value}{" "}
																			{criteria.unit.replace("CGPA", "")}
																		</span>
																	</div>
																)}
																{(criteria.type === "requirement" ||
																	criteria.type === "general") && (
																	<div
																		className="text-sm"
																		style={{ color: "var(--text-color)" }}
																	>
																		• {criteria.value}
																	</div>
																)}
															</div>
														)
													)}
												</div>
											</div>
										)}

										{hiringSteps.length > 0 && (
											<div
												className="rounded-lg border p-4"
												style={{
													backgroundColor: "var(--primary-color)",
													borderColor: "var(--border-color)",
												}}
											>
												<h4
													className="font-semibold mb-3 flex items-center"
													style={{ color: "var(--text-color)" }}
												>
													<CalendarIcon className="w-4 h-4 mr-2" />
													Hiring Process
												</h4>
												<div className="space-y-2">
													{hiringSteps.map((step: string, idx: number) => (
														<div
															key={idx}
															className="flex items-center text-sm"
														>
															<div
																className="w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center mr-3 flex-shrink-0"
																style={{
																	backgroundColor: "var(--accent-color)",
																	color: "var(--bg-color)",
																}}
															>
																{idx + 1}
															</div>
															<span style={{ color: "var(--text-color)" }}>
																{step}
															</span>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								) : notice.category === "shortlisting" ? (
									<div className="space-y-4">
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
											<div
												className="rounded-lg p-4 border"
												style={{
													backgroundColor: "var(--primary-color)",
													borderColor: "var(--border-color)",
												}}
											>
												<div className="flex flex-wrap gap-3 items-center justify-between">
													<div className="flex flex-wrap gap-2">
														{parsedMessage.company && (
															<Badge
																variant="secondary"
																style={{
																	backgroundColor: "var(--card-bg)",
																	color: "var(--accent-color)",
																	borderColor: "var(--border-color)",
																}}
															>
																<BuildingIcon className="w-3 h-3 mr-1" />
																{parsedMessage.company}
															</Badge>
														)}
														{parsedMessage.role && (
															<Badge
																variant="secondary"
																style={{
																	backgroundColor: "var(--card-bg)",
																	color: "var(--accent-color)",
																	borderColor: "var(--border-color)",
																}}
															>
																{parsedMessage.role}
															</Badge>
														)}
													</div>
													{parsedMessage.ctc && (
														<Badge
															variant="outline"
															className="font-medium"
															style={{
																backgroundColor: "var(--primary-color)",
																color: "var(--accent-color)",
																borderColor: "var(--border-color)",
															}}
														>
															<IndianRupeeIcon className="w-3 h-3 mr-1" />
															{parsedMessage.ctc}
														</Badge>
													)}
												</div>
											</div>
										)}
									</div>
								) : (
									<div className="space-y-4">
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
										<div
											className="rounded-lg p-4 border"
											style={{
												backgroundColor: "var(--primary-color)",
												borderColor: "var(--border-color)",
											}}
										>
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

								{hasShortlistedStudents && (
									<div
										className="border-t pt-4"
										style={{ borderColor: "var(--border-color)" }}
									>
										<div
											className="rounded-lg p-4 border"
											style={{
												backgroundColor: "var(--primary-color)",
												borderColor: "var(--border-color)",
											}}
										>
											<ShortlistTable
												students={students as any}
												expanded={expandedNotice === notice.id}
												onToggle={() =>
													setExpandedNotice((prev) =>
														prev === notice.id ? null : notice.id
													)
												}
											/>
										</div>
									</div>
								)}

								{notice.matched_job && (
									<div
										className="border-t pt-4"
										style={{ borderColor: "var(--border-color)" }}
									>
										<div
											className="rounded-lg p-4 border cursor-pointer hover:shadow-md transition-all duration-200 group"
											style={{
												backgroundColor: "var(--primary-color)",
												borderColor: "var(--border-color)",
											}}
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
													<BellIcon
														className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
														style={{ color: "var(--accent-color)" }}
													/>
													<div className="flex-1">
														<h4
															className="font-medium mb-1"
															style={{ color: "var(--text-color)" }}
														>
															Related Job Posting
														</h4>
														<p
															className="text-sm"
															style={{ color: "var(--text-color)" }}
														>
															<span className="font-medium">
																{notice.matched_job.company}
															</span>{" "}
															- {notice.matched_job.job_profile}
														</p>
														{isPending &&
														pendingJobId === notice.matched_job?.id ? (
															<div className="flex items-center text-xs mt-1">
																<div
																	className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin mr-2"
																	style={{
																		borderColor: "var(--border-color)",
																		borderTopColor: "transparent",
																	}}
																/>
																<span style={{ color: "var(--label-color)" }}>
																	Loading…
																</span>
															</div>
														) : (
															<p
																className="text-xs mt-1 group-hover:text-accent-color transition-colors"
																style={{ color: "var(--label-color)" }}
															>
																Click to view full job details
															</p>
														)}
													</div>
												</div>
												<ArrowRightIcon
													className="w-4 h-4 flex-shrink-0 ml-2 group-hover:translate-x-1 transition-transform"
													style={{ color: "var(--accent-color)" }}
												/>
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
							<p style={{ color: "var(--label-color)" }}>
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
											</PaginationItem>
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
										</PaginationItem>
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
