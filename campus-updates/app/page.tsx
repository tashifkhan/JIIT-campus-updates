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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

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
	const extractShortlistingSections = (text: string) => {
		const src = (text || "").replace(/\r/g, "\n");
		const lines = src
			.split(/\n+/)
			.map((l) => l.trim())
			.filter(Boolean);
		const summary: string[] = [];
		const hiringSteps: string[] = [];
		const companyRole: { company?: string; role?: string } = {};
		let ctcLines: string[] = [];
		let inHiring = false;
		let inCTC = false;

		const isStudentLine = (l: string) =>
			/\(\d{7,}\)/.test(l) || /\b\d{7,}\b/.test(l);

		// Try to capture company/role from common patterns
		for (const l of lines.slice(0, 6)) {
			const m1 = l.match(/Company\s*:\s*([^|]+?)(?:\s*\||$)/i);
			if (m1) companyRole.company = m1[1].trim();
			const m2 = l.match(/Role\s*:\s*([^|]+?)(?:\s*\||$)/i);
			if (m2) companyRole.role = m2[1].trim();
		}

		for (const l of lines) {
			const lower = l.toLowerCase();
			if (/^hiring process\s*:/.test(lower)) {
				inHiring = true;
				inCTC = false;
				continue;
			}
			if (/^(ctc|package|compensation|salary component)/i.test(l)) {
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

				<div className="space-y-4">
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
								className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow"
							>
								<CardContent className="p-6">
									<div className="flex items-start justify-between mb-3">
										<Badge
											variant="outline"
											className={
												categoryColors[notice.category] ??
												"bg-gray-50 text-gray-700 border-gray-200"
											}
										>
											<IconComponent className="w-3 h-3 mr-1" />
											{notice.category.charAt(0).toUpperCase() +
												notice.category.slice(1)}
										</Badge>
									</div>

									{notice.category === "update" ||
									notice.category === "job posting" ? (
										<div className="prose prose-sm max-w-none text-gray-800">
											<ReactMarkdown remarkPlugins={[remarkGfm]}>
												{notice.formatted_message}
											</ReactMarkdown>
										</div>
									) : notice.category === "shortlisting" ? (
										<div className="space-y-3">
											{(() => {
												const {
													summaryMarkdown,
													hiringSteps,
													ctcMarkdown,
													company,
													role,
												} = extractShortlistingSections(
													notice.formatted_message
												);
												return (
													<>
														{(company || role) && (
															<div className="flex flex-wrap gap-2">
																{company && (
																	<Badge variant="secondary">
																		Company: {company}
																	</Badge>
																)}
																{role && (
																	<Badge variant="secondary">
																		Role: {role}
																	</Badge>
																)}
															</div>
														)}
														{summaryMarkdown && (
															<div className="prose prose-sm max-w-none text-gray-800">
																<ReactMarkdown remarkPlugins={[remarkGfm]}>
																	{summaryMarkdown}
																</ReactMarkdown>
															</div>
														)}
														{(hiringSteps.length > 0 || ctcMarkdown) && (
															<Accordion
																type="single"
																collapsible
																className="w-full"
															>
																{hiringSteps.length > 0 && (
																	<AccordionItem value="hiring">
																		<AccordionTrigger>
																			Hiring Process
																		</AccordionTrigger>
																		<AccordionContent>
																			<ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
																				{hiringSteps.map((s, i) => (
																					<li key={i}>{s}</li>
																				))}
																			</ul>
																		</AccordionContent>
																	</AccordionItem>
																)}
																{ctcMarkdown && (
																	<AccordionItem value="ctc">
																		<AccordionTrigger>
																			Compensation & Benefits
																		</AccordionTrigger>
																		<AccordionContent>
																			<div className="prose prose-sm max-w-none text-gray-800">
																				<ReactMarkdown
																					remarkPlugins={[remarkGfm]}
																				>
																					{ctcMarkdown}
																				</ReactMarkdown>
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
										<div className="text-gray-800 leading-relaxed">
											{notice.formatted_message}
										</div>
									)}

									{hasShortlistedStudents && (
										<div className="mb-4">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center">
													<UsersIcon className="w-4 h-4 mr-2 text-green-600" />
													<span className="font-medium text-gray-900">
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
												<div className="bg-gray-50 rounded-lg p-4">
													<div className="flex items-center justify-between mb-2">
														<div className="text-sm text-gray-600">
															Download or copy the shortlisted students.
														</div>
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
														>
															Export CSV
														</Button>
													</div>
													<div className="overflow-x-auto max-h-96 overflow-y-auto">
														<table className="w-full text-sm">
															<thead className="sticky top-0 bg-gray-100">
																<tr className="border-b border-gray-200">
																	<th className="text-left py-2 font-medium text-gray-700">
																		Name
																	</th>
																	<th className="text-left py-2 font-medium text-gray-700">
																		Enrollment Number
																	</th>
																	<th className="text-left py-2 font-medium text-gray-700">
																		Email
																	</th>
																	<th className="text-left py-2 font-medium text-gray-700">
																		Venue
																	</th>
																</tr>
															</thead>
															<tbody>
																{students.map((student: any, idx: number) => (
																	<tr
																		key={idx}
																		className={
																			"border-b border-gray-100 last:border-b-0 " +
																			(idx % 2 ? "bg-white" : "bg-gray-50")
																		}
																	>
																		<td className="py-2 text-gray-900">
																			{student.name}
																		</td>
																		<td className="py-2 text-gray-600 font-mono text-xs">
																			{student.enrollment_number}
																		</td>
																		<td className="py-2 text-gray-600 text-xs">
																			{student.email ?? "-"}
																		</td>
																		<td className="py-2 text-gray-600 text-xs">
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
									)}

									{notice.matched_job && (
										<div className="mt-4 p-3 bg-gray-50 rounded-lg">
											<p className="text-sm font-medium text-gray-700">
												Related Job: {notice.matched_job.company} -{" "}
												{notice.matched_job.job_profile}
											</p>
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
