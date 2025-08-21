"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	CalendarIcon,
	BuildingIcon,
	UsersIcon,
	BellIcon,
	TrendingUpIcon,
	ChevronDownIcon,
	ChevronUpIcon,
} from "lucide-react";

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

	useEffect(() => {
		fetch("/data/notices.json")
			.then((res) => res.json())
			.then((data) => {
				const sorted = [...data].sort(
					(a: Notice, b: Notice) => (b.createdAt || 0) - (a.createdAt || 0)
				);
				setNotices(sorted);
				setLoading(false);
			});
	}, []);

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

				<div className="space-y-4">
					{notices.map((notice) => {
						const IconComponent = categoryIcons[notice.category] ?? BellIcon;
						const hasShortlistedStudents =
							notice.shortlisted_students &&
							notice.shortlisted_students.length > 0;
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

									<div className="text-gray-800 leading-relaxed">
										{notice.formatted_message}
									</div>

									{hasShortlistedStudents && (
										<div className="mb-4">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center">
													<UsersIcon className="w-4 h-4 mr-2 text-green-600" />
													<span className="font-medium text-gray-900">
														{notice.shortlisted_students!.length} Students
														Shortlisted
													</span>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setExpandedNotice(
															expandedNotice === notice.id ? null : notice.id
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
													<div className="overflow-x-auto">
														<table className="w-full text-sm">
															<thead>
																<tr className="border-b border-gray-200">
																	<th className="text-left py-2 font-medium text-gray-700">
																		Name
																	</th>
																	<th className="text-left py-2 font-medium text-gray-700">
																		Enrollment Number
																	</th>
																</tr>
															</thead>
															<tbody>
																{notice.shortlisted_students!.map(
																	(student, idx) => (
																		<tr
																			key={idx}
																			className="border-b border-gray-100 last:border-b-0"
																		>
																			<td className="py-2 text-gray-900">
																				{student.name}
																			</td>
																			<td className="py-2 text-gray-600 font-mono text-xs">
																				{student.enrollment_number}
																			</td>
																		</tr>
																	)
																)}
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
