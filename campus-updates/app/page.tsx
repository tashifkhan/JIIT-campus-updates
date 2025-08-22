"use client";

import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	CalendarIcon,
	BuildingIcon,
	UsersIcon,
	BellIcon,
	TrendingUpIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	IndianRupeeIcon,
	DownloadIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

interface Notice {
	id: string;
	category: "job posting" | "shortlisting" | "update" | string;
	matched_job: {
		id: string;
		company: string;
		job_profile: string;
	} | null;
	extracted: any;
	formatted_message: string;
	createdAt?: number;
	content?: string;
	author?: string;
	shortlisted_students?: Array<{
		name: string;
		enrollment_number: string;
	}>;
}

const categoryColors: Record<string, string> = {
	"job posting": "bg-blue-50 text-blue-700 border-blue-200",
	shortlisting: "bg-green-50 text-green-700 border-green-200",
	update: "bg-orange-50 text-orange-700 border-orange-200",
};

const categoryIcons: Record<string, any> = {
	"job posting": BellIcon,
	shortlisting: TrendingUpIcon,
	update: CalendarIcon,
};

export default function HomePage() {
	const [notices, setNotices] = useState<Notice[]>([]);
	const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	// Filters
	const [query, setQuery] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [onlyShortlisted, setOnlyShortlisted] = useState(false);
	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);

	// Normalize categories for consistency (treat '[shortlist]' as 'shortlisting')
	const normalizeCategory = (cat: string): string => {
		const c = (cat || "").toLowerCase().trim();
		if (/^\[?shortlist(ing)?\]?$/.test(c)) return "shortlisting";
		return c;
	};

	// Parse and structure the formatted message for better display
	const parseFormattedMessage = (message: string, category: string) => {
		// Remove congratulations text and student lists from shortlisting notices
		let processedMessage = message;
		if (category.toLowerCase().includes("shortlisting")) {
			processedMessage = message
				.replace(/Congratulations to the following students:\s*/gi, "")
				// Remove entire student list section - names with enrollment numbers
				.replace(/^[A-Za-z\s]+\s*\(\d+\)\s*$/gm, "")
				// Remove lines that are just names and numbers (more flexible pattern)
				.replace(/^[A-Z][A-Za-z\s]*\s*\(\d{6,}\)\s*$/gm, "")
				// Remove any remaining standalone enrollment numbers
				.replace(/^\(\d{6,}\)\s*$/gm, "")
				// Remove empty lines that might be left behind
				.replace(/^\s*$/gm, "");
		}

		const lines = processedMessage
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
		let title = "";
		let body = "";
		let eligibility = "";
		let hiringProcess = "";
		let deadline = "";
		let location = "";
		let ctc = "";
		let company = "";
		let role = "";

		// Extract title (first line, removing markdown and emojis)
		if (lines.length > 0) {
			title = lines[0]
				.replace(/^\*\*|\*\*$/g, "") // Remove markdown bold
				.replace(/^#+\s*/, "") // Remove markdown headers
				.replace(/📢|🎉|⚠️|💼/g, "") // Remove emojis
				.replace(/Job Posting|Shortlisting Update|Update/gi, "") // Remove category text
				.trim();
		}

		// Parse content by sections
		let currentSection = "";
		let bodyLines = [];
		let eligibilityLines = [];
		let hiringLines = [];
		let inEligibility = false;
		let inHiring = false;

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			const cleanLine = line.replace(/^\*\*|\*\*$/g, "").replace(/^#+\s*/, "");

			// Extract key info
			if (line.match(/\*\*Company:\*\*\s*(.+)/i)) {
				company = line.match(/\*\*Company:\*\*\s*(.+)/i)?.[1] || "";
				continue;
			}
			if (line.match(/\*\*Role:\*\*\s*(.+)/i)) {
				role = line.match(/\*\*Role:\*\*\s*(.+)/i)?.[1] || "";
				continue;
			}
			if (line.match(/\*\*CTC:\*\*\s*(.+)/i)) {
				ctc = line.match(/\*\*CTC:\*\*\s*(.+)/i)?.[1] || "";
				continue;
			}
			if (line.match(/\*\*Location:\*\*\s*(.+)/i)) {
				location = line.match(/\*\*Location:\*\*\s*(.+)/i)?.[1] || "";
				continue;
			}

			// Extract deadline
			if (line.match(/⚠️.*deadline/i) || line.match(/deadline/i)) {
				deadline = line
					.replace(/⚠️|\*\*/g, "")
					.replace(/deadline:?\s*/i, "")
					.trim();
				continue;
			}

			// Section detection
			if (line.match(/eligibility|criteria/i)) {
				inEligibility = true;
				inHiring = false;
				continue;
			}
			if (line.match(/hiring\s*(process|flow)/i)) {
				inHiring = true;
				inEligibility = false;
				continue;
			}
			if (line.match(/posted\s*by/i) || line.match(/on:/i)) {
				inEligibility = false;
				inHiring = false;
				continue;
			}

			// Categorize lines
			if (inEligibility && !line.match(/posted\s*by/i)) {
				// Extra cleaning for eligibility text to remove markdown formatting
				const cleanEligibilityLine = cleanLine
					.replace(/^\*\*|\*\*$/g, "") // Remove bold markdown
					.replace(/\*\*/g, "") // Remove any remaining asterisks
					.trim();
				eligibilityLines.push(cleanEligibilityLine);
			} else if (inHiring && !line.match(/posted\s*by/i)) {
				hiringLines.push(cleanLine);
			} else if (
				!line.match(/company:|role:|ctc:|location:|posted\s*by|on:/i) &&
				!line.match(/📢|🎉|job posting|shortlisting update/i)
			) {
				bodyLines.push(cleanLine);
			}
		}

		body = bodyLines.join("\n").trim();
		eligibility = eligibilityLines.join("\n").trim();
		hiringProcess = hiringLines.join("\n").trim();

		return {
			title,
			body,
			eligibility,
			hiringProcess,
			deadline,
			location,
			ctc,
			company,
			role,
		};
	};

	// Format eligibility criteria for display
	const formatEligibility = (eligibilityText: string) => {
		if (!eligibilityText) return null;

		const lines = eligibilityText
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
		const criteria = [];

		for (const line of lines) {
			// Parse course requirements
			if (line.match(/courses?:|branches?:/i)) {
				const coursesMatch =
					line.match(/courses?:\s*(.+)/i) || line.match(/branches?:\s*(.+)/i);
				if (coursesMatch) {
					criteria.push({
						type: "courses",
						value: coursesMatch[1].split(",").map((c) => c.trim()),
					});
				}
			}
			// Parse CGPA/marks requirements
			else if (line.match(/cgpa|marks|percentage/i)) {
				const marksMatch = line.match(
					/(\w+).*?(\d+\.?\d*)\s*(cgpa|%|percent)/i
				);
				if (marksMatch) {
					criteria.push({
						type: "marks",
						level: marksMatch[1],
						value: marksMatch[2],
						unit: marksMatch[3],
					});
				}
			}
			// Parse other requirements
			else if (line.match(/no\s*backlogs?/i)) {
				criteria.push({
					type: "requirement",
					value: "No backlogs",
				});
			} else if (line.trim() && !line.match(/^-|^\*|^\d+\./)) {
				criteria.push({
					type: "general",
					value: line.replace(/^-\s*|\*\s*/, "").trim(),
				});
			}
		}

		return criteria;
	};

	// Format hiring process for display
	const formatHiringProcess = (hiringText: string) => {
		if (!hiringText) return [];

		const lines = hiringText
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
		const steps = [];

		for (const line of lines) {
			let step = line
				.replace(/^\d+\.?\s*/, "") // Remove numbering
				.replace(/^-\s*/, "") // Remove dashes
				.replace(/^\*\s*/, "") // Remove asterisks
				.trim();

			if (step && !step.match(/^hiring|^process|^flow/i)) {
				steps.push(step);
			}
		}

		return steps;
	};

	const formatDateTime = (timestamp: number) => {
		const date = new Date(timestamp);
		const dateStr = date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
		const timeStr = date.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
		return `${dateStr} at ${timeStr}`;
	};

	const formatDateOnly = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	useEffect(() => {
		fetch("/data/notices.json")
			.then((res) => res.json())
			.then((data) => {
				const sorted = [...data].sort(
					(a: Notice, b: Notice) => (b.createdAt || 0) - (a.createdAt || 0)
				);
				// Apply category normalization
				setNotices(
					sorted.map((n) => ({ ...n, category: normalizeCategory(n.category) }))
				);
				setLoading(false);
			});
	}, []);

	// Derived options and filtered list
	const allCategories = useMemo(
		() => Array.from(new Set(notices.map((n) => n.category))).sort(),
		[notices]
	);

	type ParsedStudent = {
		name: string;
		enrollment_number: string;
		email?: string;
		venue?: string;
	};

	// Heuristic parser for shortlisting text when shortlisted_students isn't provided
	const parseShortlistFromText = (text: string): ParsedStudent[] => {
		if (!text) return [];
		const results: ParsedStudent[] = [];
		const seen = new Set<string>();
		const cleaned = text
			.replace(/\u00a0/g, " ")
			.replace(/\s+/g, " ")
			.trim();

		// Pattern A: Name (Enrollment)
		const patternA = /([A-Za-z][A-Za-z.'\- ]+?)\s*\((\d{7,})\)/g;
		let matchA: RegExpExecArray | null;
		while ((matchA = patternA.exec(cleaned))) {
			const name = matchA[1].trim();
			const enroll = matchA[2];
			if (!seen.has(enroll)) {
				results.push({ name, enrollment_number: enroll });
				seen.add(enroll);
			}
		}

		// Pattern B: [idx]? Enrollment Name [Email]? [Venue]
		const patternB =
			/(\d+\s+)?(\d{7,})\s+([^@\d][A-Za-z .'-]+?)(?:\s+([\w.+-]+@[\w.-]+\.[A-Za-z]{2,}))?(?:\s+(CL\d+|[A-Z]{2}\d+))(?=\s|$)/g;
		let matchB: RegExpExecArray | null;
		while ((matchB = patternB.exec(cleaned))) {
			const enroll = matchB[2];
			const name = matchB[3].trim();
			const email = matchB[4];
			const venue = matchB[5];
			if (!seen.has(enroll)) {
				results.push({ name, enrollment_number: enroll, email, venue });
				seen.add(enroll);
			}
		}

		return results;
	};

	// Extract sections from a shortlisting message for better display
	const extractShortlistingSections = (text: string, noticeData?: any) => {
		const src = (text || "").replace(/\r/g, "\n");
		const lines = src
			.split(/\n+/)
			.map((l) => l.trim())
			.filter(Boolean);
		const summary: string[] = [];
		const hiringSteps: string[] = [];
		const companyRole: { company?: string; role?: string; ctcAmount?: string } =
			{};
		let ctcLines: string[] = [];
		let inHiring = false;
		let inCTC = false;

		const isStudentLine = (l: string) =>
			/\(\d{7,}\)/.test(l) || /\b\d{7,}\b/.test(l);

		// Try to capture company/role/ctc from common patterns
		for (const l of lines.slice(0, 6)) {
			const m1 = l.match(/Company\s*:\s*([^|]+?)(?:\s*\||$)/i);
			if (m1) companyRole.company = m1[1].trim();
			const m2 = l.match(/Role\s*:\s*([^|]+?)(?:\s*\||$)/i);
			if (m2) companyRole.role = m2[1].trim();
			const m3 = l.match(/CTC\s*:\s*([0-9.]+)\s*(LPA|lacs?)/i);
			if (m3) companyRole.ctcAmount = `${m3[1]} ${m3[2].toUpperCase()}`;
		}

		for (const l of lines) {
			const lower = l.toLowerCase();
			// Remove common markdown symbols for easier matching
			const plain = lower.replace(/[>*_`~#:\\-]+/g, "").trim();
			if (/^hiring process\s*:/.test(lower)) {
				inHiring = true;
				inCTC = false;
				continue;
			}
			if (
				/^(ctc|package|compensation|salary component)/i.test(l) ||
				/^(ctc|package|compensation|salary component)/i.test(plain)
			) {
				inCTC = true;
				inHiring = false;
				ctcLines.push(l);
				continue;
			}
			if (/^posted by|^posted on|^\*posted by\*/i.test(lower)) {
				inHiring = false;
				inCTC = false;
			}

			if (inHiring) {
				if (!isStudentLine(l))
					hiringSteps.push(l.replace(/^[-•\d.\)]+\s*/, "").trim());
				continue;
			}
			if (inCTC) {
				ctcLines.push(l);
				continue;
			}
			if (!isStudentLine(l)) summary.push(l);
		}

		// Build concise summary: limit to first 3 paragraphs
		const summaryMarkdown = summary.slice(0, 6).join("\n\n");
		const ctcMarkdown = ctcLines.join("\n");

		// Try to extract CTC amount from the notice data if not found in text
		if (!companyRole.ctcAmount && noticeData?.matched_job) {
			// Look for package info in the notice object
			const packageMatch = (noticeData as any).package;
			if (packageMatch) {
				companyRole.ctcAmount = packageMatch.includes("LPA")
					? packageMatch
					: `${packageMatch} LPA`;
			}
		}

		return {
			summaryMarkdown,
			hiringSteps: hiringSteps.filter(Boolean),
			ctcMarkdown,
			...companyRole,
		};
	};

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

	// Pagination calculations
	const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentNotices = filteredNotices.slice(startIndex, endIndex);

	// Reset to first page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [query, selectedCategories, onlyShortlisted, itemsPerPage]);

	if (loading) {
		return (
			<Layout>
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<Card key={i} className="animate-pulse card-theme">
							<CardContent className="p-6">
								<div
									className="h-4 rounded w-3/4 mb-2"
									style={{ backgroundColor: "var(--skeleton-color)" }}
								></div>
								<div
									className="h-3 rounded w-1/2"
									style={{ backgroundColor: "var(--skeleton-color)" }}
								></div>
							</CardContent>
						</Card>
					))}
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
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

				{/* Filters */}
				<Card className="mb-4 card-theme">
					<CardContent className="p-4 lg:p-6 space-y-3">
						<div className="flex flex-col md:flex-row gap-3 md:items-center">
							<div className="flex-1">
								<Input
									placeholder="Search updates or company/role"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
							</div>
							<div className="flex gap-2 flex-wrap">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="whitespace-nowrap">
											Categories
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-56 max-h-72 overflow-auto">
										<DropdownMenuLabel>Select categories</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{allCategories.map((cat) => (
											<DropdownMenuCheckboxItem
												key={cat}
												checked={selectedCategories.includes(cat)}
												onCheckedChange={(checked) => {
													setSelectedCategories((prev) =>
														checked
															? [...prev, cat]
															: prev.filter((c) => c !== cat)
													);
												}}
											>
												{cat.charAt(0).toUpperCase() + cat.slice(1)}
											</DropdownMenuCheckboxItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="whitespace-nowrap">
											{itemsPerPage} per page
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-40">
										<DropdownMenuLabel>Items per page</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuRadioGroup
											value={itemsPerPage.toString()}
											onValueChange={(value) => setItemsPerPage(Number(value))}
										>
											<DropdownMenuRadioItem value="5">5</DropdownMenuRadioItem>
											<DropdownMenuRadioItem value="10">
												10
											</DropdownMenuRadioItem>
											<DropdownMenuRadioItem value="20">
												20
											</DropdownMenuRadioItem>
											<DropdownMenuRadioItem value="50">
												50
											</DropdownMenuRadioItem>
										</DropdownMenuRadioGroup>
									</DropdownMenuContent>
								</DropdownMenu>
								<div className="flex items-center gap-2">
									<Checkbox
										id="onlyShortlisted"
										checked={onlyShortlisted}
										onCheckedChange={(v) => setOnlyShortlisted(!!v)}
									/>
									<label
										htmlFor="onlyShortlisted"
										className="text-sm cursor-pointer"
										style={{ color: "var(--text-color)" }}
									>
										Shortlisted students
									</label>
								</div>
								<Badge variant="secondary" className="self-center">
									{filteredNotices.length} results
								</Badge>
							</div>
						</div>
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
													<span className="font-medium">
														By {notice.author}
													</span>
												)}
											</div>
											{notice.createdAt && (
												<span>{formatDateTime(notice.createdAt)}</span>
											)}
										</div>
									)}
								</CardHeader>
								<CardContent className="pt-0">
									{(() => {
										const parsedMessage = parseFormattedMessage(
											notice.formatted_message,
											notice.category
										);
										const eligibilityCriteria = formatEligibility(
											parsedMessage.eligibility
										);
										const hiringSteps = formatHiringProcess(
											parsedMessage.hiringProcess
										);

										if (
											notice.category === "update" ||
											notice.category === "job posting"
										) {
											return (
												<div className="space-y-4">
													{/* Title */}
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

													{/* Company, Role, CTC Info */}
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

													{/* Deadline */}
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

													{/* Body Content */}
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

													{/* Eligibility Criteria */}
													{eligibilityCriteria &&
														eligibilityCriteria.length > 0 && (
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
																	{eligibilityCriteria.map((criteria, idx) => (
																		<div key={idx}>
																			{criteria.type === "courses" && (
																				<div>
																					<span
																						className="text-sm font-medium"
																						style={{
																							color: "var(--accent-color)",
																						}}
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
																											color:
																												"var(--text-color)",
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
																									backgroundColor:
																										"var(--card-bg)",
																									borderColor:
																										"var(--border-color)",
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
																						style={{
																							color: "var(--accent-color)",
																						}}
																					>
																						{criteria.level}:
																					</span>
																					<span
																						style={{
																							color: "var(--text-color)",
																						}}
																					>
																						{criteria.value} {criteria.unit}
																					</span>
																				</div>
																			)}
																			{(criteria.type === "requirement" ||
																				criteria.type === "general") && (
																				<div
																					className="text-sm"
																					style={{
																						color: "var(--text-color)",
																					}}
																				>
																					• {criteria.value}
																				</div>
																			)}
																		</div>
																	))}
																</div>
															</div>
														)}

													{/* Hiring Process */}
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
																{hiringSteps.map((step, idx) => (
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
																		<span
																			style={{ color: "var(--text-color)" }}
																		>
																			{step}
																		</span>
																	</div>
																))}
															</div>
														</div>
													)}
												</div>
											);
										} else if (notice.category === "shortlisting") {
											return (
												<div className="space-y-4">
													{/* Title */}
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

													{/* Company and Role Header */}
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

													{/* Body Content */}
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

													{/* Hiring Process for Shortlisting */}
													{hiringSteps.length > 0 && (
														<Accordion
															type="single"
															collapsible
															className="w-full rounded-lg border"
															style={{
																backgroundColor: "var(--card-bg)",
																borderColor: "var(--border-color)",
															}}
														>
															<AccordionItem
																value="hiring"
																className="border-b-0"
															>
																<AccordionTrigger
																	className="px-4 py-3"
																	style={{ color: "var(--text-color)" }}
																>
																	<div className="flex items-center">
																		<CalendarIcon
																			className="w-4 h-4 mr-2"
																			style={{ color: "var(--accent-color)" }}
																		/>
																		Hiring Process
																	</div>
																</AccordionTrigger>
																<AccordionContent className="px-4 pb-4">
																	<div
																		className="rounded-lg p-3"
																		style={{
																			backgroundColor: "var(--primary-color)",
																		}}
																	>
																		<ol
																			className="list-decimal pl-5 space-y-2 text-sm"
																			style={{ color: "var(--text-color)" }}
																		>
																			{hiringSteps.map((step, i) => (
																				<li key={i} className="leading-relaxed">
																					{step}
																				</li>
																			))}
																		</ol>
																	</div>
																</AccordionContent>
															</AccordionItem>
														</Accordion>
													)}
												</div>
											);
										} else {
											return (
												<div className="space-y-4">
													{/* Title */}
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

													{/* Body Content */}
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
											);
										}
									})()}

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
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center">
														<UsersIcon
															className="w-5 h-5 mr-2"
															style={{ color: "var(--accent-color)" }}
														/>
														<span
															className="font-semibold"
															style={{ color: "var(--text-color)" }}
														>
															{students.length} Students Shortlisted
														</span>
													</div>
													<Button
														variant="outline"
														size="sm"
														type="button"
														aria-expanded={expandedNotice === notice.id}
														onClick={() =>
															setExpandedNotice((prev) =>
																prev === notice.id ? null : notice.id
															)
														}
														className="hover-theme"
														style={{
															backgroundColor: "var(--card-bg)",
															borderColor: "var(--border-color)",
															color: "var(--accent-color)",
														}}
													>
														{expandedNotice === notice.id ? (
															<>
																Hide List{" "}
																<ChevronUpIcon className="w-3 h-3 ml-1" />
															</>
														) : (
															<>
																View List{" "}
																<ChevronDownIcon className="w-3 h-3 ml-1" />
															</>
														)}
													</Button>
												</div>

												{expandedNotice === notice.id && (
													<div
														className="rounded-lg border p-4"
														style={{
															backgroundColor: "var(--card-bg)",
															borderColor: "#bbf7d0",
														}}
													>
														<div className="flex items-center justify-between mb-4">
															<h4
																className="font-medium"
																style={{ color: "var(--text-color)" }}
															>
																Shortlisted Students
															</h4>
															<Button
																variant="outline"
																size="sm"
																type="button"
																onClick={() => {
																	const rows = [
																		[
																			"Name",
																			"Enrollment Number",
																			"Email",
																			"Venue",
																		],
																		...students.map((s: any) => [
																			s.name,
																			s.enrollment_number,
																			s.email || "",
																			s.venue || "",
																		]),
																	];
																	const csv = rows
																		.map((r) =>
																			r
																				.map(
																					(c) =>
																						'"' +
																						String(c).replace(/"/g, '""') +
																						'"'
																				)
																				.join(",")
																		)
																		.join("\n");
																	const blob = new Blob([csv], {
																		type: "text/csv;charset=utf-8;",
																	});
																	const url = URL.createObjectURL(blob);
																	const a = document.createElement("a");
																	a.href = url;
																	a.download = "shortlist.csv";
																	a.click();
																	URL.revokeObjectURL(url);
																}}
																className="text-sm font-medium hover-theme"
																style={{
																	backgroundColor: "var(--card-bg)",
																	borderColor: "var(--border-color)",
																	color: "var(--accent-color)",
																}}
															>
																<DownloadIcon className="w-4 h-4 mr-2" />
																Export CSV
															</Button>
														</div>
														<div
															className="overflow-x-auto max-h-80 overflow-y-auto border rounded-lg"
															style={{ borderColor: "var(--border-color)" }}
														>
															<table className="w-full text-sm">
																<thead
																	className="sticky top-0 border-b"
																	style={{
																		backgroundColor: "var(--primary-color)",
																		borderColor: "var(--border-color)",
																	}}
																>
																	<tr>
																		<th
																			className="text-left py-3 px-4 font-semibold"
																			style={{ color: "var(--accent-color)" }}
																		>
																			Name
																		</th>
																		<th
																			className="text-left py-3 px-4 font-semibold"
																			style={{ color: "var(--accent-color)" }}
																		>
																			Enrollment
																		</th>
																		<th
																			className="text-left py-3 px-4 font-semibold"
																			style={{ color: "var(--accent-color)" }}
																		>
																			Email
																		</th>
																		<th
																			className="text-left py-3 px-4 font-semibold"
																			style={{ color: "var(--accent-color)" }}
																		>
																			Venue
																		</th>
																	</tr>
																</thead>
																<tbody>
																	{students.map((student: any, idx: number) => (
																		<tr
																			key={idx}
																			className={`border-b last:border-b-0 hover-theme ${
																				idx % 2 ? "" : ""
																			}`}
																			style={{
																				borderColor: "var(--border-color)",
																				backgroundColor:
																					idx % 2
																						? "var(--card-bg)"
																						: "var(--primary-color)",
																			}}
																		>
																			<td
																				className="py-3 px-4 font-medium"
																				style={{ color: "var(--text-color)" }}
																			>
																				{student.name}
																			</td>
																			<td
																				className="py-3 px-4 font-mono text-sm"
																				style={{ color: "var(--label-color)" }}
																			>
																				{student.enrollment_number}
																			</td>
																			<td
																				className="py-3 px-4 text-sm"
																				style={{ color: "var(--label-color)" }}
																			>
																				{student.email ?? "-"}
																			</td>
																			<td
																				className="py-3 px-4 text-sm"
																				style={{ color: "var(--label-color)" }}
																			>
																				{student.venue ?? "-"}
																			</td>
																		</tr>
																	))}
																</tbody>
															</table>
														</div>
													</div>
												)}
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

									{/* Omitting raw source text as it's not available */}
								</CardContent>
							</Card>
						);
					})}

					{/* No results message */}
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

				{/* Pagination */}
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

								{/* First page */}
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

								{/* Page numbers around current page */}
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

								{/* Last page */}
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
		</Layout>
	);
}
