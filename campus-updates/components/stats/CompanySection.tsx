"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPackage } from "@/lib/stats";
import type { CompanyStats } from "@/lib/stats-api";

type Props = {
	limit: number;
	companies: CompanyStats[];
	hasActiveFilters: boolean;
	buildHref: (pathname: string) => string;
};

export default function CompanySection({
	limit,
	companies,
	hasActiveFilters,
	buildHref,
}: Props) {
	const [showAll, setShowAll] = useState(true);
	const visibleCompanies = showAll ? companies : companies.slice(0, limit);

	return (
		<Card className="card-theme bg-card border-border">
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-foreground">
					<div className="flex items-center gap-2">
						Company-wise Placements
						{hasActiveFilters ? (
							<Badge className="rounded-full bg-primary text-primary-foreground">
								{companies.length}
							</Badge>
						) : null}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{companies.length === 0 ? (
					<div className="text-center py-6 text-muted-foreground">
						No company data for current filters.
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{visibleCompanies.map((company) => (
							<Link
								key={company.company}
								href={buildHref(
									`/stats/company/${encodeURIComponent(company.company)}`,
								)}
							>
								<Card className="border card-theme cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-[0.98] bg-card border-border h-full">
									<CardContent className="p-4">
										<h3
											className="font-bold text-lg leading-tight line-clamp-1 text-foreground mb-3"
											title={company.company}
										>
											{company.company}
										</h3>
										<div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
											<div>
												<p className="text-xs text-muted-foreground">Students Placed</p>
												<div className="flex items-center gap-1.5 mt-0.5">
													<Users className="w-3.5 h-3.5 text-muted-foreground" />
													<span className="font-bold text-foreground">
														{company.studentsCount}
													</span>
												</div>
											</div>
											<div className="text-right">
												<p className="text-xs text-muted-foreground">Avg Package</p>
												<p className="font-bold text-success">
													{formatPackage(company.avgPackage || company.fallbackPackage)}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}

				{companies.length > limit ? (
					<div className="text-center mt-6">
						<Button
							variant="outline"
							onClick={() => setShowAll((current) => !current)}
							className="hover-theme border-border text-foreground hover:bg-muted"
						>
							<ChevronDown className={`w-4 h-4 mr-2 ${showAll ? "rotate-180" : ""}`} />
							{showAll ? "Show Less Companies" : `Show All ${companies.length} Companies`}
						</Button>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
