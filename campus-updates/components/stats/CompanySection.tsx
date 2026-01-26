"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { Placement, StudentWithPlacement, formatPackage } from "@/lib/stats";
import { Users } from "lucide-react";

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
	hasActiveFilters,
	getCompanyFallbackPackage,
}: Props) {
	const [showAllCompanies, setShowAllCompanies] = useState(false);

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
						<Link
							key={company}
							href={`/stats/company/${encodeURIComponent(company)}`}
						>
							<Card className="border card-theme cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-[0.98] bg-card border-border h-full">
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
													stats.avgPackage ||
														getCompanyFallbackPackage(company),
												)}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
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
