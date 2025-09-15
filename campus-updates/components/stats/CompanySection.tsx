"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Building, ChevronDown, ChevronUp } from "lucide-react";
import {
	Placement,
	StudentWithPlacement,
	formatDate,
	formatPackage,
} from "@/lib/stats";

type CompanyStats = Record<
	string,
	{
		count: number;
		profiles: Set<string>;
		avgPackage: number;
		packages: number[];
		studentsCount: number;
	}
>;

type Props = {
	COMPANIES_LIMIT: number;
	companyEntries: Array<[string, any]>; // sorted entries
	filteredUniqueCompanies: number;
	uniqueCompanies: number;
	hasActiveFilters: boolean;
	placements: Placement[];
	getCompanyStudents: (company: string) => StudentWithPlacement[];
	getCompanyFallbackPackage: (company: string) => number;
};

export default function CompanySection({
	COMPANIES_LIMIT,
	companyEntries,
	filteredUniqueCompanies,
	uniqueCompanies,
	hasActiveFilters,
	placements,
	getCompanyStudents,
	getCompanyFallbackPackage,
}: Props) {
	const [showAllCompanies, setShowAllCompanies] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const companiesToRender = showAllCompanies
		? companyEntries
		: companyEntries.slice(0, COMPANIES_LIMIT);

	return (
		<Card className="card-theme">
			<CardHeader>
				<CardTitle
					className="flex items-center justify-between"
					style={{ color: "var(--text-color)" }}
				>
					<div className="flex items-center gap-2">
						<Building
							className="w-5 h-5 mr-2"
							style={{ color: "var(--accent-color)" }}
						/>
						Company-wise Placements
						{hasActiveFilters && (
							<Badge
								className="rounded-full"
								style={{
									backgroundColor: "var(--accent-color)",
									color: "white",
								}}
							>
								{filteredUniqueCompanies}
							</Badge>
						)}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{companiesToRender.map(([company, stats]) => (
						<Dialog
							key={company}
							open={isModalOpen && selectedCompany === company}
							onOpenChange={(open) => {
								setIsModalOpen(open);
								if (!open) setSelectedCompany(null);
							}}
						>
							<Card
								className="border card-theme cursor-pointer hover:shadow-lg transition-all duration-300"
								style={{
									backgroundColor: "var(--primary-color)",
									borderColor: "var(--border-color)",
								}}
								onClick={() => {
									setSelectedCompany(company);
									setIsModalOpen(true);
								}}
							>
								<CardContent className="p-4">
									<div className="flex justify-between items-start mb-2">
										<h3
											className="font-semibold flex-1"
											style={{ color: "var(--text-color)" }}
										>
											{company}
										</h3>
									</div>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span style={{ color: "var(--label-color)" }}>
												Students Placed:
											</span>
											<Badge
												variant="secondary"
												style={{
													backgroundColor: "var(--card-bg)",
													color: "var(--accent-color)",
													borderColor: "var(--border-color)",
												}}
											>
												{stats.studentsCount}
											</Badge>
										</div>
										<div className="flex justify-between">
											<span style={{ color: "var(--label-color)" }}>
												Avg Package:
											</span>
											<span
												className="font-semibold"
												style={{ color: "var(--success-dark)" }}
											>
												{stats.studentsCount > 0
													? formatPackage(stats.avgPackage)
													: getCompanyFallbackPackage(company) > 0
													? `${formatPackage(
															getCompanyFallbackPackage(company)
													  )} (assumed)`
													: formatPackage(0)}
											</span>
										</div>
										<div>
											<span
												className="block mb-1"
												style={{ color: "var(--label-color)" }}
											>
												Profiles:
											</span>
											<div className="flex flex-wrap gap-1">
												{Array.from(stats.profiles)
													.slice(0, 3)
													.map((profile: any, idx: number) => (
														<Badge
															key={idx}
															variant="outline"
															className="text-xs"
															style={{
																backgroundColor: "var(--card-bg)",
																borderColor: "var(--border-color)",
																color: "var(--text-color)",
															}}
														>
															{profile}
														</Badge>
													))}
												{Array.from(stats.profiles).length > 3 && (
													<Badge
														variant="outline"
														className="text-xs"
														style={{
															backgroundColor: "var(--card-bg)",
															borderColor: "var(--border-color)",
															color: "var(--text-color)",
														}}
													>
														+{Array.from(stats.profiles).length - 3} more
													</Badge>
												)}
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
							<DialogContent className="w-full sm:w-[95vw] md:w-[98vw] lg:w-screen sm:max-w-[95vw] md:max-w-[98vw] lg:max-w-screen max-h-[90vh] sm:rounded-lg overflow-hidden">
								<DialogHeader>
									<DialogTitle style={{ color: "var(--text-color)" }}>
										{company} - Student Details
									</DialogTitle>
								</DialogHeader>
								<div className="mt-4 max-h-[80vh] overflow-hidden flex flex-col">
									<div className="hidden sm:block flex-1 overflow-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead style={{ color: "var(--text-color)" }}>
														Name
													</TableHead>
													<TableHead style={{ color: "var(--text-color)" }}>
														Enrollment
													</TableHead>
													<TableHead style={{ color: "var(--text-color)" }}>
														Email
													</TableHead>
													<TableHead style={{ color: "var(--text-color)" }}>
														Role
													</TableHead>
													<TableHead style={{ color: "var(--text-color)" }}>
														Package
													</TableHead>
													<TableHead style={{ color: "var(--text-color)" }}>
														Location
													</TableHead>
													<TableHead style={{ color: "var(--text-color)" }}>
														Joining Date
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{getCompanyStudents(company).map((student, idx) => (
													<TableRow key={idx}>
														<TableCell style={{ color: "var(--text-color)" }}>
															{student.name}
														</TableCell>
														<TableCell style={{ color: "var(--label-color)" }}>
															{student.enrollment_number}
														</TableCell>
														<TableCell style={{ color: "var(--label-color)" }}>
															{student.email ||
																`${student.enrollment_number}@${
																	/[A-Za-z]/.test(
																		student.enrollment_number || ""
																	)
																		? "mail.juit.ac.in"
																		: "mail.jiit.ac.in"
																}`}
														</TableCell>
														<TableCell style={{ color: "var(--label-color)" }}>
															{student.role || "N/A"}
														</TableCell>
														<TableCell style={{ color: "var(--success-dark)" }}>
															{(() => {
																const placement = placements.find(
																	(p) => p.company === company
																);
																const packageValue = placement
																	? student.package ??
																	  placement.roles.find(
																			(r) => r.role === student.role
																	  )?.package ??
																	  Math.max(
																			...placement.roles
																				.filter((r) => r.package != null)
																				.map((r) => r.package as number)
																	  )
																	: student.package;
																return packageValue
																	? formatPackage(packageValue)
																	: "TBD";
															})()}
														</TableCell>
														<TableCell style={{ color: "var(--label-color)" }}>
															{student.job_location?.join(", ") || "N/A"}
														</TableCell>
														<TableCell style={{ color: "var(--label-color)" }}>
															{formatDate(student.joining_date)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>

									{/* Mobile */}
									<div className="space-y-3 sm:hidden flex-1 overflow-auto">
										{getCompanyStudents(company).map((student, idx) => {
											const placement = placements.find(
												(p) => p.company === company
											);
											const packageValue = placement
												? student.package ??
												  placement.roles.find((r) => r.role === student.role)
														?.package ??
												  Math.max(
														...placement.roles
															.filter((r) => r.package != null)
															.map((r) => r.package as number)
												  )
												: student.package;
											return (
												<div
													key={idx}
													className="border rounded-lg p-3 card-theme"
													style={{
														backgroundColor: "var(--primary-color)",
														borderColor: "var(--border-color)",
													}}
												>
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<p
																className="font-semibold"
																style={{ color: "var(--text-color)" }}
															>
																{student.name}
															</p>
															<p
																className="text-xs"
																style={{ color: "var(--label-color)" }}
															>
																{student.enrollment_number}
															</p>
															<p
																className="text-xs mt-1"
																style={{ color: "var(--label-color)" }}
															>
																{student.email ||
																	`${student.enrollment_number}@${
																		/[A-Za-z]/.test(
																			student.enrollment_number || ""
																		)
																			? "mail.juit.ac.in"
																			: "mail.jiit.ac.in"
																	}`}
															</p>
															<div
																className="text-xs mt-2"
																style={{ color: "var(--label-color)" }}
															>
																<strong style={{ color: "var(--label-color)" }}>
																	Role:{" "}
																</strong>
																{student.role || "N/A"}
															</div>
															<div
																className="text-xs mt-1"
																style={{ color: "var(--label-color)" }}
															>
																<strong style={{ color: "var(--label-color)" }}>
																	Location:{" "}
																</strong>
																{student.job_location?.join(", ") || "N/A"}
															</div>
														</div>
														<div className="ml-4 text-right">
															<p
																className="font-semibold text-sm"
																style={{ color: "var(--success-dark)" }}
															>
																{packageValue
																	? formatPackage(packageValue)
																	: "TBD"}
															</p>
															<p
																className="text-xs mt-1"
																style={{ color: "var(--label-color)" }}
															>
																{student.joining_date
																	? formatDate(student.joining_date)
																	: "TBD"}
															</p>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</DialogContent>
						</Dialog>
					))}
				</div>

				{companyEntries.length > COMPANIES_LIMIT && (
					<div className="text-center mt-6">
						<Button
							variant="outline"
							onClick={() => setShowAllCompanies(!showAllCompanies)}
							style={{
								borderColor: "var(--border-color)",
								color: "var(--text-color)",
							}}
							className="hover-theme"
						>
							{showAllCompanies ? (
								<>
									<ChevronDown className="w-4 h-4 mr-2 rotate-180" />
									Show Less Companies
								</>
							) : (
								<>
									<ChevronDown className="w-4 h-4 mr-2" />
									Show All {companyEntries.length} Companies
								</>
							)}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
