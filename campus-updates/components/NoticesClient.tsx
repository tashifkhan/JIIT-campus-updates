"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	CalendarIcon,
	BuildingIcon,
	UsersIcon,
	TrendingUpIcon,
	IndianRupeeIcon,
	BellIcon,
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

import NoticesFilters from "@/components/NoticesFilters";
import ShortlistTable from "@/components/ShortlistTable";
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
};

type Props = { initialNotices: NoticeType[] };

export default function NoticesClient({ initialNotices = [] }: Props) {
	const [notices, setNotices] = useState<NoticeType[]>(initialNotices || []);
	const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
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
				const parsedCount =
					n.category === "shortlisting"
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
					const hiringSteps = formatHiringProcess(parsedMessage.hiringProcess);

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
										{notice.category.charAt(0).toUpperCase() +
											notice.category.slice(1)}
									</Badge>
								</div>
								{(notice.createdAt || notice.author) && (
									<div
										className="flex items-center justify-between mt-3 text-xs"
										style={{ color: "var(--label-color)" }}
									>
										<div className="flex items-center space-x-2">
											{notice.author && (
												<span className="font-medium">By {notice.author}</span>
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
								notice.category === "job posting" ? (
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

										{parsedMessage.deadline && (
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
																			{criteria.level}:
																		</span>
																		<span
																			style={{ color: "var(--text-color)" }}
																		>
																			{criteria.value} {criteria.unit}
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
											className="rounded-lg p-4 border"
											style={{
												backgroundColor: "var(--primary-color)",
												borderColor: "var(--border-color)",
											}}
										>
											<div className="flex items-start">
												<BellIcon
													className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
													style={{ color: "var(--accent-color)" }}
												/>
												<div>
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

							{currentPage > 3 && (
								<>
									<PaginationItem>
										<PaginationLink
											onClick={() => setCurrentPage(1)}
											isActive={currentPage === 1}
											className="cursor-pointer"
										>
											1
										</PaginationLink>
									</PaginationItem>
									{currentPage > 4 && (
										<PaginationItem>
											<PaginationEllipsis />
										</PaginationItem>
									)}
								</>
							)}

							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter((page) => {
									const distance = Math.abs(page - currentPage);
									return distance <= 2 || page === 1 || page === totalPages;
								})
								.filter((page) => {
									if (currentPage <= 3) return page <= 5;
									if (currentPage >= totalPages - 2)
										return page >= totalPages - 4;
									return Math.abs(page - currentPage) <= 2;
								})
								.map((page) => (
									<PaginationItem key={page}>
										<PaginationLink
											onClick={() => setCurrentPage(page)}
											isActive={currentPage === page}
											className="cursor-pointer"
										>
											{page}
										</PaginationLink>
									</PaginationItem>
								))}

							{currentPage < totalPages - 2 && (
								<>
									{currentPage < totalPages - 3 && (
										<PaginationItem>
											<PaginationEllipsis />
										</PaginationItem>
									)}
									<PaginationItem>
										<PaginationLink
											onClick={() => setCurrentPage(totalPages)}
											isActive={currentPage === totalPages}
											className="cursor-pointer"
										>
											{totalPages}
										</PaginationLink>
									</PaginationItem>
								</>
							)}

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
