"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	UsersIcon,
	TrendingUpIcon,
	IndianRupeeIcon,
	BuildingIcon,
	GraduationCapIcon,
	CalendarIcon,
} from "lucide-react";

interface Placement {
	id: string;
	student_name: string;
	roll_number: string;
	company: string;
	job_profile: string;
	package: number;
	placement_date: string;
	course: string;
}

export default function StatsPage() {
	const [placements, setPlacements] = useState<Placement[]>([]);
	const [showStudentList, setShowStudentList] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/data/placements.json")
			.then((res) => res.json())
			.then((data) => {
				setPlacements(data);
				setLoading(false);
			});
	}, []);

	const formatPackage = (amount: number) => {
		if (amount >= 100000) {
			return `₹${(amount / 100000).toFixed(1)} LPA`;
		}
		return `₹${amount.toLocaleString()}`;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Calculate statistics
	const totalPlacements = placements.length;
	const packages = placements.map((p) => p.package);
	const averagePackage =
		packages.length > 0
			? packages.reduce((a, b) => a + b, 0) / packages.length
			: 0;
	const sortedPackages = [...packages].sort((a, b) => a - b);
	const medianPackage =
		sortedPackages.length > 0
			? sortedPackages.length % 2 === 0
				? (sortedPackages[sortedPackages.length / 2 - 1] +
						sortedPackages[sortedPackages.length / 2]) /
				  2
				: sortedPackages[Math.floor(sortedPackages.length / 2)]
			: 0;

	const highestPackage = packages.length > 0 ? Math.max(...packages) : 0;
	const uniqueCompanies = new Set(placements.map((p) => p.company)).size;

	// Group placements by company
	const companyStats = placements.reduce((acc, placement) => {
		if (!acc[placement.company]) {
			acc[placement.company] = {
				count: 0,
				profiles: new Set(),
				avgPackage: 0,
				packages: [],
			};
		}
		acc[placement.company].count += 1;
		acc[placement.company].profiles.add(placement.job_profile);
		acc[placement.company].packages.push(placement.package);
		return acc;
	}, {} as any);

	// Calculate average packages for companies
	Object.keys(companyStats).forEach((company) => {
		const packages = companyStats[company].packages;
		companyStats[company].avgPackage =
			packages.reduce((a: number, b: number) => a + b, 0) / packages.length;
	});

	if (loading) {
		return (
			<Layout>
				<div className="max-w-7xl mx-auto space-y-8">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
						{[...Array(4)].map((_, i) => (
							<Card key={i} className="animate-pulse card-theme">
								<CardContent className="p-6">
									<div
										className="h-8 rounded mb-2"
										style={{ backgroundColor: "var(--primary-color)" }}
									></div>
									<div
										className="h-4 rounded w-1/2"
										style={{ backgroundColor: "var(--primary-color)" }}
									></div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="max-w-7xl mx-auto space-y-8">
				<div className="text-center mb-8">
					<h1
						className="text-2xl lg:text-3xl font-bold mb-2"
						style={{ color: "var(--text-color)" }}
					>
						Placement Statistics
					</h1>
					<p style={{ color: "var(--label-color)" }}>
						Campus placement data and analytics
					</p>
				</div>

				{/* Key Statistics */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card
						className="border card-theme hover:shadow-md transition-all duration-300"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
							color: "var(--text-color)",
						}}
					>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p
										className="text-sm font-medium mb-1"
										style={{ color: "var(--label-color)" }}
									>
										Total Placements
									</p>
									<p
										className="text-3xl font-bold"
										style={{ color: "var(--text-color)" }}
									>
										{totalPlacements}
									</p>
								</div>
								<UsersIcon
									className="w-8 h-8"
									style={{ color: "var(--accent-color)" }}
								/>
							</div>
						</CardContent>
					</Card>

					<Card
						className="border card-theme hover:shadow-md transition-all duration-300"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
							color: "var(--text-color)",
						}}
					>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p
										className="text-sm font-medium mb-1"
										style={{ color: "var(--label-color)" }}
									>
										Average Package
									</p>
									<p
										className="text-3xl font-bold"
										style={{ color: "var(--text-color)" }}
									>
										{formatPackage(averagePackage)}
									</p>
								</div>
								<TrendingUpIcon
									className="w-8 h-8"
									style={{ color: "var(--accent-color)" }}
								/>
							</div>
						</CardContent>
					</Card>

					<Card
						className="border card-theme hover:shadow-md transition-all duration-300"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
							color: "var(--text-color)",
						}}
					>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p
										className="text-sm font-medium mb-1"
										style={{ color: "var(--label-color)" }}
									>
										Median Package
									</p>
									<p
										className="text-3xl font-bold"
										style={{ color: "var(--text-color)" }}
									>
										{formatPackage(medianPackage)}
									</p>
								</div>
								<IndianRupeeIcon
									className="w-8 h-8"
									style={{ color: "var(--accent-color)" }}
								/>
							</div>
						</CardContent>
					</Card>

					<Card
						className="border card-theme hover:shadow-md transition-all duration-300"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
							color: "var(--text-color)",
						}}
					>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p
										className="text-sm font-medium mb-1"
										style={{ color: "var(--label-color)" }}
									>
										Companies
									</p>
									<p
										className="text-3xl font-bold"
										style={{ color: "var(--text-color)" }}
									>
										{uniqueCompanies}
									</p>
								</div>
								<BuildingIcon
									className="w-8 h-8"
									style={{ color: "var(--accent-color)" }}
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Company-wise Statistics */}
				<Card className="card-theme">
					<CardHeader>
						<CardTitle
							className="flex items-center"
							style={{ color: "var(--text-color)" }}
						>
							<BuildingIcon
								className="w-5 h-5 mr-2"
								style={{ color: "var(--accent-color)" }}
							/>
							Company-wise Placements
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{Object.entries(companyStats).map(
								([company, stats]: [string, any]) => (
									<Card
										key={company}
										className="border card-theme"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--border-color)",
										}}
									>
										<CardContent className="p-4">
											<h3
												className="font-semibold mb-2"
												style={{ color: "var(--text-color)" }}
											>
												{company}
											</h3>
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
														{stats.count}
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
														{formatPackage(stats.avgPackage)}
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
														{Array.from(stats.profiles).map(
															(profile: any, idx: number) => (
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
															)
														)}
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								)
							)}
						</div>
					</CardContent>
				</Card>

				{/* Placed Students Section */}
				<Card className="card-theme">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle
								className="flex items-center"
								style={{ color: "var(--text-color)" }}
							>
								<GraduationCapIcon
									className="w-5 h-5 mr-2"
									style={{ color: "var(--accent-color)" }}
								/>
								Placed Students
							</CardTitle>
							<Button
								variant="outline"
								onClick={() => setShowStudentList(!showStudentList)}
								style={{
									borderColor: "var(--border-color)",
									color: "var(--text-color)",
								}}
								className="hover-theme"
							>
								{showStudentList ? "Hide List" : "View All Students"}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{showStudentList ? (
							<div className="space-y-4">
								{placements.map((placement) => (
									<Card
										key={placement.id}
										className="border card-theme"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--border-color)",
										}}
									>
										<CardContent className="p-4">
											<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
												<div>
													<h3
														className="font-semibold"
														style={{ color: "var(--text-color)" }}
													>
														{placement.student_name}
													</h3>
													<p
														className="text-sm"
														style={{ color: "var(--label-color)" }}
													>
														{placement.roll_number}
													</p>
													<Badge
														variant="secondary"
														className="mt-1 text-xs"
														style={{
															backgroundColor: "var(--card-bg)",
															color: "var(--accent-color)",
															borderColor: "var(--border-color)",
														}}
													>
														{placement.course}
													</Badge>
												</div>
												<div>
													<p
														className="font-medium"
														style={{ color: "var(--text-color)" }}
													>
														{placement.company}
													</p>
													<p
														className="text-sm"
														style={{ color: "var(--label-color)" }}
													>
														{placement.job_profile}
													</p>
												</div>
												<div className="text-right md:text-left">
													<p
														className="font-semibold text-lg"
														style={{ color: "var(--success-dark)" }}
													>
														{formatPackage(placement.package)}
													</p>
													<div
														className="flex items-center text-sm mt-1"
														style={{ color: "var(--label-color)" }}
													>
														<CalendarIcon className="w-3 h-3 mr-1" />
														{formatDate(placement.placement_date)}
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className="text-center py-8">
								<p className="mb-4" style={{ color: "var(--label-color)" }}>
									{totalPlacements} students have been successfully placed
								</p>
								<div className="flex justify-center items-center space-x-6 text-sm">
									<div className="text-center">
										<p
											className="font-semibold"
											style={{ color: "var(--text-color)" }}
										>
											Highest Package
										</p>
										<p
											className="font-bold"
											style={{ color: "var(--success-dark)" }}
										>
											{formatPackage(highestPackage)}
										</p>
									</div>
									<div className="text-center">
										<p
											className="font-semibold"
											style={{ color: "var(--text-color)" }}
										>
											Average Package
										</p>
										<p
											className="font-bold"
											style={{ color: "var(--accent-color)" }}
										>
											{formatPackage(averagePackage)}
										</p>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
}
