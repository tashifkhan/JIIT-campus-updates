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
import { ChevronDown, ChevronUp } from "lucide-react";
import {
	Placement,
	StudentWithPlacement,
	formatDate,
	formatPackage,
} from "@/lib/stats";
import { Building2, Users } from "lucide-react";

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
								className="border card-theme cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
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
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-3">
											<div className="p-2 rounded-lg bg-muted/50">
												<Building2 className="w-5 h-5 text-muted-foreground" />
											</div>
											<div>
												<h3
													className="font-bold text-lg leading-tight line-clamp-1"
													style={{ color: "var(--text-color)" }}
													title={company}
												>
													{company}
												</h3>
											</div>
										</div>
									</div>

									<div
										className="grid grid-cols-2 gap-4 pt-2 border-t"
										style={{ borderColor: "var(--border-color)" }}
									>
										<div>
											<p
												className="text-xs"
												style={{ color: "var(--label-color)" }}
											>
												Students Placed
											</p>
											<div className="flex items-center gap-1.5 mt-0.5">
												<Users className="w-3.5 h-3.5 text-muted-foreground" />
												<span
													className="font-bold"
													style={{ color: "var(--text-color)" }}
												>
													{stats.studentsCount}
												</span>
											</div>
										</div>
										<div className="text-right">
											<p
												className="text-xs"
												style={{ color: "var(--label-color)" }}
											>
												Avg Package
											</p>
											<p
												className="font-bold"
												style={{ color: "var(--success-dark)" }}
											>
												{formatPackage(
													stats.avgPackage || getCompanyFallbackPackage(company)
												)}
											</p>
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
