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
	CircleDollarSignIcon,
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

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

	// Normalize categories for consistency (treat '[shortlist]' as 'shortlisting')
	const normalizeCategory = (cat: string): string => {
		const c = (cat || "").toLowerCase().trim();
		if (/^\[?shortlist(ing)?\]?$/.test(c)) return "shortlisting";
		return c;
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

	if (loading) {
		return (
			<Layout>
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardContent className="p-6">
								<div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
								<div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
					<h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
						Latest Updates
					</h1>
					<p className="text-gray-600">
						Stay informed about placement activities
					</p>
				</div>

				{/* Filters */}
				<Card className="mb-4">
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
								<div className="flex items-center gap-2">
									<Checkbox
										id="onlyShortlisted"
										checked={onlyShortlisted}
										onCheckedChange={(v) => setOnlyShortlisted(!!v)}
									/>
									<label
										htmlFor="onlyShortlisted"
										className="text-sm text-gray-700 cursor-pointer"
									>
										Only with shortlisted students
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
					{filteredNotices.map((notice) => {
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
								className={`border-l-4 hover:shadow-lg transition-all duration-200 ${
									notice.category === "job posting"
										? "border-l-blue-500"
										: notice.category === "shortlisting"
										? "border-l-green-500"
										: "border-l-orange-500"
								}`}
							>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<Badge
											variant="outline"
											className={`${
												categoryColors[notice.category] ??
												"bg-gray-50 text-gray-700 border-gray-200"
											} px-3 py-1`}
										>
											<IconComponent className="w-3 h-3 mr-2" />
											{notice.category.charAt(0).toUpperCase() +
												notice.category.slice(1)}
										</Badge>
										{notice.createdAt && (
											<span className="text-xs text-gray-500">
												{new Date(notice.createdAt).toLocaleDateString()}
											</span>
										)}
									</div>
								</CardHeader>
								<CardContent className="pt-0">

									{notice.category === "update" ||
									notice.category === "job posting" ? (
										<div className="space-y-4">
											<div className="prose prose-sm max-w-none text-gray-800 bg-gray-50 rounded-lg p-4">
												<ReactMarkdown remarkPlugins={[remarkGfm]}>
													{notice.formatted_message}
												</ReactMarkdown>
											</div>
										</div>
									) : notice.category === "shortlisting" ? (
										<div className="space-y-4">
											{(() => {
												const {
													summaryMarkdown,
													hiringSteps,
													ctcMarkdown,
													company,
													role,
													ctcAmount,
												} = extractShortlistingSections(
													notice.formatted_message,
													notice
												);
												return (
													<>
														{/* Company and Role Header */}
														{(company || role || ctcAmount) && (
															<div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-100">
																<div className="flex flex-wrap gap-3 items-center justify-between">
																	<div className="flex flex-wrap gap-2">
																		{company && (
																			<Badge
																				variant="secondary"
																				className="bg-white text-blue-700 border-blue-200"
																			>
																				<BuildingIcon className="w-3 h-3 mr-1" />
																				{company}
																			</Badge>
																		)}
																		{role && (
																			<Badge
																				variant="secondary"
																				className="bg-white text-green-700 border-green-200"
																			>
																				{role}
																			</Badge>
																		)}
																	</div>
																	{ctcMarkdown && ctcAmount && (
																		<Popover>
																			<PopoverTrigger asChild>
																				<Button
																					variant="default"
																					size="sm"
																					type="button"
																					className="bg-green-600 hover:bg-green-700 text-white font-medium"
																				>
																					<CircleDollarSignIcon className="w-3 h-3 mr-1" />
																					{ctcAmount}
																				</Button>
																			</PopoverTrigger>
																			<PopoverContent className="w-80 max-w-[90vw] max-h-[60vh] overflow-auto">
																				<div className="space-y-2">
																					<h4 className="font-semibold text-gray-900">
																						Package Details
																					</h4>
																					<div className="prose prose-sm max-w-none text-gray-700">
																						<ReactMarkdown
																							remarkPlugins={[remarkGfm]}
																						>
																							{ctcMarkdown}
																						</ReactMarkdown>
																					</div>
																				</div>
																			</PopoverContent>
																		</Popover>
																	)}
																</div>
															</div>
														)}

														{/* Summary Content */}
														{summaryMarkdown && (
															<div className="bg-white rounded-lg border border-gray-200 p-4">
																<div className="prose prose-sm max-w-none text-gray-800">
																	<ReactMarkdown remarkPlugins={[remarkGfm]}>
																		{summaryMarkdown}
																	</ReactMarkdown>
																</div>
															</div>
														)}

														{/* Collapsible Sections */}
														{(hiringSteps.length > 0 || ctcMarkdown) && (
															<Accordion
																type="single"
																collapsible
																className="w-full bg-white rounded-lg border border-gray-200"
															>
																{hiringSteps.length > 0 && (
																	<AccordionItem value="hiring" className="border-b-0">
																		<AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
																			<div className="flex items-center">
																				<CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
																				Hiring Process
																			</div>
																		</AccordionTrigger>
																		<AccordionContent className="px-4 pb-4">
																			<div className="bg-blue-50 rounded-lg p-3">
																				<ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800">
																					{hiringSteps.map((s, i) => (
																						<li key={i} className="leading-relaxed">
																							{s}
																						</li>
																					))}
																				</ol>
																			</div>
																		</AccordionContent>
																	</AccordionItem>
																)}
																{ctcMarkdown && (
																	<AccordionItem value="ctc" className="border-b-0">
																		<AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
																			<div className="flex items-center">
																				<CircleDollarSignIcon className="w-4 h-4 mr-2 text-green-600" />
																				Compensation & Benefits
																			</div>
																		</AccordionTrigger>
																		<AccordionContent className="px-4 pb-4">
																			<div className="bg-green-50 rounded-lg p-3">
																				<div className="prose prose-sm max-w-none text-gray-800">
																					<ReactMarkdown
																						remarkPlugins={[remarkGfm]}
																					>
																						{ctcMarkdown}
																					</ReactMarkdown>
																				</div>
																			</div>
																		</AccordionContent>
																	</AccordionItem>
																)}
															</Accordion>
														)}
													</>
												);
											})()}
										</div>
									) : (
										<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
											<div className="text-gray-800 leading-relaxed">
												{notice.formatted_message}
											</div>
										</div>
									)}

									{hasShortlistedStudents && (
										<div className="border-t border-gray-200 pt-4">
											<div className="bg-green-50 rounded-lg p-4 border border-green-200">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center">
														<UsersIcon className="w-5 h-5 mr-2 text-green-600" />
														<span className="font-semibold text-green-800">
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
														className="bg-white hover:bg-green-50 border-green-300"
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
													<div className="bg-white rounded-lg border border-green-200 p-4">
														<div className="flex items-center justify-between mb-4">
															<h4 className="font-medium text-gray-900">
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
																className="bg-green-600 text-white hover:bg-green-700"
															>
																📥 Export CSV
															</Button>
														</div>
														<div className="overflow-x-auto max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
															<table className="w-full text-sm">
																<thead className="sticky top-0 bg-green-100 border-b border-green-200">
																	<tr>
																		<th className="text-left py-3 px-4 font-semibold text-green-800">
																			Name
																		</th>
																		<th className="text-left py-3 px-4 font-semibold text-green-800">
																			Enrollment
																		</th>
																		<th className="text-left py-3 px-4 font-semibold text-green-800">
																			Email
																		</th>
																		<th className="text-left py-3 px-4 font-semibold text-green-800">
																			Venue
																		</th>
																	</tr>
																</thead>
																<tbody>
																	{students.map((student: any, idx: number) => (
																		<tr
																			key={idx}
																			className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
																				idx % 2 ? "bg-white" : "bg-gray-50"
																			}`}
																		>
																			<td className="py-3 px-4 text-gray-900 font-medium">
																				{student.name}
																			</td>
																			<td className="py-3 px-4 text-gray-600 font-mono text-sm">
																				{student.enrollment_number}
																			</td>
																			<td className="py-3 px-4 text-gray-600 text-sm">
																				{student.email ?? "-"}
																			</td>
																			<td className="py-3 px-4 text-gray-600 text-sm">
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
										<div className="border-t border-gray-200 pt-4">
											<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
												<div className="flex items-start">
													<BellIcon className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
													<div>
														<h4 className="font-medium text-blue-900 mb-1">
															Related Job Posting
														</h4>
														<p className="text-sm text-blue-800">
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
				</div>
			</div>
		</Layout>
	);
}
