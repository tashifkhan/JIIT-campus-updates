"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
// import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	ChevronDown,
	ChevronUp,
	ExternalLink,
	TrendingUp,
	CheckCircle2,
	Award,
	BarChart3,
	AlertCircle,
	Clock,
} from "lucide-react";

type PackageDistribution = {
	category: string;
	average: string;
	median: string;
};

type Batch = {
	batch_name: string;
	is_active: boolean;
	placement_pointers: string[];
	package_distribution?: PackageDistribution[];
};

type RecruiterLogo = {
	src: string;
	alt: string;
};

type OfficialData = {
	_id: string;
	batches: Batch[];
	intro_text: string;
	main_heading: string;
	recruiter_logos: RecruiterLogo[];
	scrape_timestamp: string;
};

export default function OfficialPlacements() {
	const [isOpen, setIsOpen] = useState(false);

	const { data, isLoading, error } = useQuery<OfficialData>({
		queryKey: ["official-placement"],
		queryFn: async () => {
			const res = await fetch("/api/official-placements", {
				cache: "no-store",
			});
			if (!res.ok) throw new Error("Failed to fetch");
			return res.json();
		},
		staleTime: 1000 * 60 * 30,
	});

	const activeBatch = data?.batches?.find((b) => b.is_active);
	const defaultBatchValue =
		activeBatch?.batch_name || data?.batches?.[0]?.batch_name || "";

	// Helper function to extract main batch name and additional info from parentheses
	const parseBatchName = (batchName: string) => {
		const match = batchName.match(/^(.+?)\s*\((.+)\)$/);
		if (match) {
			return {
				main: match[1].trim(),
				extra: match[2].trim(),
			};
		}
		return {
			main: batchName,
			extra: null,
		};
	};

	// Helper to highlight numbers in text
	const highlightNumbers = (text: string) => {
		// Matches patterns like "94.25 Lacs", "178", "37 Cos", "Rs 6.00"
		const parts = text.split(/(\d+(?:\.\d+)?\s*(?:Lacs?|Cos)?)/g);
		return (
			<span>
				{parts.map((part, i) =>
					/\d/.test(part) ? (
						<span key={i} className="font-bold text-primary">
							{part}
						</span>
					) : (
						<span key={i}>{part}</span>
					)
				)}
			</span>
		);
	};

	return (
		<Card className="border card-theme hover:shadow-lg transition-all duration-300 bg-card border-border text-foreground overflow-hidden">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors select-none">
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-full bg-primary/10 text-primary">
									<TrendingUp className="w-5 h-5" />
								</div>
								<div>
									<CardTitle className="text-lg font-bold text-foreground">
										Official Placement Data
									</CardTitle>
									{!isOpen && !isLoading && data && (
										<p className="text-xs text-muted-foreground mt-1">
											Click to view detailed statistics
										</p>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<a
									href="https://jiit.ac.in"
									target="_blank"
									rel="noopener noreferrer"
									onClick={(e) => e.stopPropagation()}
									className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 text-primary transition-colors border border-primary/10"
								>
									<span className="hidden sm:inline font-medium">
										Visit Source
									</span>
									<ExternalLink className="w-3.5 h-3.5" />
								</a>
								<div className="p-2 rounded-full hover:bg-background/80 transition-opacity">
									{isOpen ? (
										<ChevronUp className="w-5 h-5 text-muted-foreground" />
									) : (
										<ChevronDown className="w-5 h-5 text-muted-foreground" />
									)}
								</div>
							</div>
						</div>
					</CardHeader>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<CardContent className="pt-2 pb-6">
						{isLoading && (
							<div className="flex flex-col items-center justify-center py-8 space-y-3 opacity-70">
								<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
								<div className="text-sm font-medium">
									Loading official placement data…
								</div>
							</div>
						)}

						{error && (
							<div className="flex flex-col items-center justify-center py-8 text-destructive space-y-2">
								<AlertCircle className="w-8 h-8 opacity-80" />
								<div className="text-sm font-medium">
									Failed to load official data.
								</div>
							</div>
						)}

						{data && !isLoading && !error && (
							<div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
								{/* Tabs for different batches */}
								{data.batches && data.batches.length > 0 && (
									<Tabs defaultValue={defaultBatchValue} className="w-full">
										<TabsList className="w-full h-auto p-1 bg-muted border border-border/50 rounded-xl grid grid-cols-2 mb-6">
											{data.batches.map((batch) => {
												const { main } = parseBatchName(batch.batch_name);
												return (
													<TabsTrigger
														key={batch.batch_name}
														value={batch.batch_name}
														className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:font-bold rounded-lg px-3 py-2.5 text-sm transition-all text-muted-foreground hover:text-foreground"
													>
														{main}
													</TabsTrigger>
												);
											})}
										</TabsList>

										{data.batches.map((batch) => {
											const { extra } = parseBatchName(batch.batch_name);

											return (
												<TabsContent
													key={batch.batch_name}
													value={batch.batch_name}
													className="space-y-6 focus-visible:outline-none"
												>
													{/* Batch Status Header */}
													<div className="flex items-center justify-between flex-wrap gap-2">
														{extra && (
															<div className="text-sm font-medium text-muted-foreground px-3 py-1 bg-muted/50 rounded-full border border-border/50">
																{extra}
															</div>
														)}
														{batch.is_active && (
															<Badge
																variant="outline"
																className="text-xs font-medium px-3 py-1 rounded-full border-primary/30 text-primary bg-primary/5"
															>
																<span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" />
																Active Batch
															</Badge>
														)}
													</div>

													{/* Placement Pointers Grid */}
													<div className="space-y-3">
														<h4 className="flex items-center gap-2 font-semibold text-sm text-foreground/90">
															<Award className="w-4 h-4 text-primary" />
															Placement Highlights
														</h4>
														<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
															{batch.placement_pointers.map((pointer, i) => (
																<div
																	key={i}
																	className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors"
																>
																	<CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
																	<span className="text-sm leading-relaxed text-muted-foreground">
																		{highlightNumbers(pointer)}
																	</span>
																</div>
															))}
														</div>
													</div>

													{/* Package Distribution Table */}
													{batch.package_distribution &&
														batch.package_distribution.length > 0 && (
															<div className="space-y-3">
																<h4 className="flex items-center gap-2 font-semibold text-sm text-foreground/90">
																	<BarChart3 className="w-4 h-4 text-primary" />
																	Package Distribution (LPA)
																</h4>
																<div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
																	<div className="overflow-x-auto">
																		<Table className="min-w-[320px]">
																			<TableHeader className="bg-muted/30">
																				<TableRow className="hover:bg-transparent border-border/60">
																					<TableHead className="w-[40%] font-semibold text-foreground/80 pl-3 py-3 h-auto text-xs sm:text-sm whitespace-nowrap">
																						Category
																					</TableHead>
																					<TableHead className="text-right font-semibold text-foreground/80 px-2 py-3 h-auto text-xs sm:text-sm whitespace-nowrap">
																						Average
																					</TableHead>
																					<TableHead className="text-right font-semibold text-foreground/80 pl-2 pr-3 py-3 h-auto text-xs sm:text-sm whitespace-nowrap">
																						Median
																					</TableHead>
																				</TableRow>
																			</TableHeader>
																			<TableBody>
																				{batch.package_distribution.map(
																					(item, idx) => {
																						return (
																							<TableRow
																								key={idx}
																								className="hover:bg-muted/40 border-border/50 transition-colors"
																							>
																								<TableCell className="font-medium text-foreground pl-3 pr-2 py-3 text-xs sm:text-sm whitespace-nowrap">
																									{item.category}
																								</TableCell>
																								<TableCell className="text-right px-2 py-3">
																									<div className="flex flex-col items-end gap-1">
																										<span className="font-bold tabular-nums text-foreground text-xs sm:text-sm">
																											₹{item.average}
																										</span>
																									</div>
																								</TableCell>
																								<TableCell className="text-right pl-2 pr-3 py-3">
																									<div className="flex flex-col items-end gap-1">
																										<span className="font-medium tabular-nums text-muted-foreground text-xs sm:text-sm">
																											₹{item.median}
																										</span>
																									</div>
																								</TableCell>
																							</TableRow>
																						);
																					}
																				)}
																			</TableBody>
																		</Table>
																	</div>
																</div>
															</div>
														)}
												</TabsContent>
											);
										})}
									</Tabs>
								)}

								{/* Timestamp */}
								{data.scrape_timestamp && (
									<div className="flex items-center justify-end gap-1.5 pt-4 border-t border-border/60">
										<Clock className="w-3 h-3 text-muted-foreground/60" />
										<span className="text-[10px] text-muted-foreground/60 font-medium">
											Last updated:{" "}
											{new Date(data.scrape_timestamp).toLocaleString(
												undefined,
												{
													dateStyle: "medium",
													timeStyle: "short",
												}
											)}
										</span>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
