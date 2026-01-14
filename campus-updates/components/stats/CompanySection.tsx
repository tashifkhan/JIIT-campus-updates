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
import { Users } from "lucide-react";

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
		<Card className="card-theme bg-card border-border">
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-foreground">
					<div className="flex items-center gap-2">
						Company-wise Placements
						{hasActiveFilters && (
							<Badge className="rounded-full bg-primary text-primary-foreground">
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
								className="border card-theme cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-[0.98] bg-card border-border"
								onClick={() => {
									setSelectedCompany(company);
									setIsModalOpen(true);
								}}
							>
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-3">
											<h3
												className="font-bold text-lg leading-tight line-clamp-1 text-foreground"
												title={company}
											>
												{company}
											</h3>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
										<div>
											<p className="text-xs text-muted-foreground">
												Students Placed
											</p>
											<div className="flex items-center gap-1.5 mt-0.5">
												<Users className="w-3.5 h-3.5 text-muted-foreground" />
												<span className="font-bold text-foreground">
													{stats.studentsCount}
												</span>
											</div>
										</div>
										<div className="text-right">
											<p className="text-xs text-muted-foreground">
												Avg Package
											</p>
											<p className="font-bold text-success">
												{formatPackage(
													stats.avgPackage || getCompanyFallbackPackage(company)
												)}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
							<DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none m-0 p-0 border-none flex flex-col bg-background">
								<DialogHeader className="p-4 border-b border-border shrink-0">
									<DialogTitle className="text-foreground">
										{company} - Student Details
									</DialogTitle>
								</DialogHeader>
								<div className="p-4 overflow-hidden flex flex-col flex-1">
									<div className="hidden sm:block flex-1 overflow-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="text-foreground">
														Name
													</TableHead>
													<TableHead className="text-foreground">
														Enrollment
													</TableHead>

													<TableHead className="text-foreground">
														Role
													</TableHead>
													<TableHead className="text-foreground">
														Package
													</TableHead>
													<TableHead className="text-foreground">
														Location
													</TableHead>
													<TableHead className="text-foreground">
														Joining Date
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{getCompanyStudents(company).map((student, idx) => (
													<TableRow
														key={idx}
														className="hover:bg-muted/50 border-border"
													>
														<TableCell className="text-foreground">
															{student.name}
														</TableCell>
														<TableCell className="text-muted-foreground">
															{student.enrollment_number}
														</TableCell>

														<TableCell className="text-muted-foreground">
															{student.role || "N/A"}
														</TableCell>
														<TableCell className="text-success">
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
														<TableCell className="text-muted-foreground">
															{student.job_location?.join(", ") || "N/A"}
														</TableCell>
														<TableCell className="text-muted-foreground">
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
													className="border rounded-lg p-3 card-theme bg-card border-border"
												>
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<p className="font-semibold text-foreground">
																{student.name}
															</p>
															<p className="text-xs text-muted-foreground">
																{student.enrollment_number}
															</p>

															<div className="text-xs mt-2 text-muted-foreground">
																<strong className="text-muted-foreground">
																	Role:{" "}
																</strong>
																{student.role || "N/A"}
															</div>
															<div className="text-xs mt-1 text-muted-foreground">
																<strong className="text-muted-foreground">
																	Location:{" "}
																</strong>
																{student.job_location?.join(", ") || "N/A"}
															</div>
														</div>
														<div className="ml-4 text-right">
															<p className="font-semibold text-sm text-success">
																{packageValue
																	? formatPackage(packageValue)
																	: "TBD"}
															</p>
															<p className="text-xs mt-1 text-muted-foreground">
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
							className="hover-theme border-border text-foreground hover:bg-muted"
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
