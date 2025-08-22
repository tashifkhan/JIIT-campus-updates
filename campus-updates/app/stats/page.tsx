"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	UsersIcon,
	TrendingUpIcon,
	IndianRupeeIcon,
	BuildingIcon,
	GraduationCapIcon,
	CalendarIcon,
	DownloadIcon,
	EyeIcon,
	ChevronDownIcon,
	ChevronUpIcon,
} from "lucide-react";

interface Role {
	role: string;
	packages: string[];
	package_details: string | null;
}

interface Student {
	name: string;
	enrollment_number: string;
	email: string | null;
	role: string | null;
}

interface Placement {
	company: string;
	roles: Role[];
	job_location: string[] | null;
	joining_date: string | null;
	students_selected: Student[];
	number_of_offers: number;
	additional_info: string;
	email_subject: string;
	email_sender: string;
}

export default function StatsPage() {
	const [placements, setPlacements] = useState<Placement[]>([]);
	const [showStudentList, setShowStudentList] = useState(false);
	const [loading, setLoading] = useState(true);
	const [showAllCompanies, setShowAllCompanies] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const COMPANIES_LIMIT = 6;

	useEffect(() => {
		fetch("/data/placements.json")
			.then((res) => res.json())
			.then((data) => {
				setPlacements(data);
				setLoading(false);
			});
	}, []);

	const formatPackage = (packageStr: string | number) => {
		if (typeof packageStr === "number") {
			// Convert number to string format
			if (packageStr >= 100000) {
				return `₹${(packageStr / 100000).toFixed(1)} LPA`;
			}
			return `₹${packageStr.toLocaleString()}`;
		}

		// Handle different package formats
		if (
			packageStr.includes("LPA") ||
			packageStr.includes("Lacs") ||
			packageStr.includes("Lakhs")
		) {
			return packageStr;
		}
		// If it's a number, convert to LPA format
		const amount = parseFloat(packageStr.replace(/[^\d.]/g, ""));
		if (amount >= 100000) {
			return `₹${(amount / 100000).toFixed(1)} LPA`;
		}
		return `₹${amount.toLocaleString()}`;
	};

	const extractPackageValue = (packageStr: string): number => {
		// Extract numeric value from package string for calculations
		const matches = packageStr.match(/[\d.]+/g);
		if (!matches) return 0;

		// If package contains "LPA" or "Lacs", it's already in lakhs
		if (
			packageStr.includes("LPA") ||
			packageStr.includes("Lacs") ||
			packageStr.includes("Lakhs")
		) {
			return parseFloat(matches[0]) * 100000; // Convert to actual amount
		}

		return parseFloat(matches[0]);
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return "TBD";
		return new Date(dateString).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Calculate statistics
	const totalStudentsPlaced = placements.reduce(
		(total, placement) => total + placement.students_selected.length,
		0
	);

	const totalPlacements = placements.length;

	// Extract all package values for calculation
	const allPackages: number[] = [];
	placements.forEach((placement) => {
		placement.roles.forEach((role) => {
			role.packages.forEach((pkg) => {
				const value = extractPackageValue(pkg);
				if (value > 0) allPackages.push(value);
			});
		});
	});

	const averagePackage =
		allPackages.length > 0
			? allPackages.reduce((a, b) => a + b, 0) / allPackages.length
			: 0;

	const sortedPackages = [...allPackages].sort((a, b) => a - b);
	const medianPackage =
		sortedPackages.length > 0
			? sortedPackages.length % 2 === 0
				? (sortedPackages[sortedPackages.length / 2 - 1] +
						sortedPackages[sortedPackages.length / 2]) /
				  2
				: sortedPackages[Math.floor(sortedPackages.length / 2)]
			: 0;

	const highestPackage = allPackages.length > 0 ? Math.max(...allPackages) : 0;
	const uniqueCompanies = new Set(placements.map((p) => p.company)).size;

	// Group placements by company
	const companyStats = placements.reduce((acc, placement) => {
		if (!acc[placement.company]) {
			acc[placement.company] = {
				count: 0,
				profiles: new Set(),
				avgPackage: 0,
				packages: [],
				studentsCount: 0,
			};
		}
		acc[placement.company].count += 1;
		acc[placement.company].studentsCount += placement.students_selected.length;

		// Add all role profiles
		placement.roles.forEach((role) => {
			acc[placement.company].profiles.add(role.role);
			// Add package values for average calculation
			role.packages.forEach((pkg) => {
				const value = extractPackageValue(pkg);
				if (value > 0) acc[placement.company].packages.push(value);
			});
		});

		return acc;
	}, {} as any);

	// Calculate average packages for companies
	Object.keys(companyStats).forEach((company) => {
		const packages = companyStats[company].packages;
		companyStats[company].avgPackage =
			packages.length > 0
				? packages.reduce((a: number, b: number) => a + b, 0) / packages.length
				: 0;
	});

	// Helper function to get students for a specific company
	const getCompanyStudents = (companyName: string) => {
		return placements
			.filter((placement) => placement.company === companyName)
			.flatMap((placement) =>
				placement.students_selected.map((student) => ({
					...student,
					company: placement.company,
					roles: placement.roles,
					joining_date: placement.joining_date,
					job_location: placement.job_location,
				}))
			);
	};

	// CSV Export function
	const exportToCSV = () => {
		const csvData = [];

		// Add headers
		csvData.push([
			"Student Name",
			"Enrollment Number",
			"Email",
			"Company",
			"Role",
			"Package",
			"Job Location",
			"Joining Date",
		]);

		// Add data rows
		placements.forEach((placement) => {
			placement.students_selected.forEach((student) => {
				placement.roles.forEach((role) => {
					role.packages.forEach((pkg) => {
						csvData.push([
							student.name,
							student.enrollment_number,
							student.email || "N/A",
							placement.company,
							student.role || role.role || "N/A",
							pkg,
							placement.job_location?.join(", ") || "N/A",
							placement.joining_date || "TBD",
						]);
					});
				});
			});
		});

		// Convert to CSV string
		const csvContent = csvData
			.map((row) => row.map((cell) => `"${cell}"`).join(","))
			.join("\n");

		// Download CSV
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`placement_statistics_${new Date().toISOString().split("T")[0]}.csv`
		);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Get companies to display (limited or all)
	const companiesToShow = showAllCompanies
		? Object.entries(companyStats)
		: Object.entries(companyStats).slice(0, COMPANIES_LIMIT);

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
					<div className="flex flex-col sm:flex-row justify-between items-center mb-4">
						<div className="text-center sm:text-left">
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
						<Button
							onClick={exportToCSV}
							className="mt-4 sm:mt-0"
							style={{
								backgroundColor: "var(--accent-color)",
								color: "white",
							}}
						>
							<DownloadIcon className="w-4 h-4 mr-2" />
							Export CSV
						</Button>
					</div>
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
										{totalStudentsPlaced}
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
							className="flex items-center justify-between"
							style={{ color: "var(--text-color)" }}
						>
							<div className="flex items-center">
								<BuildingIcon
									className="w-5 h-5 mr-2"
									style={{ color: "var(--accent-color)" }}
								/>
								Company-wise Placements
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{companiesToShow.map(([company, stats]: [string, any]) => (
								<Card
									key={company}
									className="border card-theme cursor-pointer hover:shadow-lg transition-all duration-300"
									style={{
										backgroundColor: "var(--primary-color)",
										borderColor: "var(--border-color)",
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
											<Dialog
												open={isModalOpen && selectedCompany === company}
												onOpenChange={(open) => {
													setIsModalOpen(open);
													if (!open) setSelectedCompany(null);
												}}
											>
												<DialogTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setSelectedCompany(company);
															setIsModalOpen(true);
														}}
														style={{ color: "var(--accent-color)" }}
													>
														<EyeIcon className="w-4 h-4" />
													</Button>
												</DialogTrigger>
												<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
													<DialogHeader>
														<DialogTitle style={{ color: "var(--text-color)" }}>
															{company} - Student Details
														</DialogTitle>
													</DialogHeader>
													<div className="mt-4">
														<Table>
															<TableHeader>
																<TableRow>
																	<TableHead
																		style={{ color: "var(--text-color)" }}
																	>
																		Name
																	</TableHead>
																	<TableHead
																		style={{ color: "var(--text-color)" }}
																	>
																		Enrollment
																	</TableHead>
																	<TableHead
																		style={{ color: "var(--text-color)" }}
																	>
																		Email
																	</TableHead>
																	<TableHead
																		style={{ color: "var(--text-color)" }}
																	>
																		Role
																	</TableHead>
																	<TableHead
																		style={{ color: "var(--text-color)" }}
																	>
																		Package
																	</TableHead>
																	<TableHead
																		style={{ color: "var(--text-color)" }}
																	>
																		Location
																	</TableHead>
																	<TableHead
																		style={{ color: "var(--text-color)" }}
																	>
																		Joining Date
																	</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{getCompanyStudents(company).map(
																	(student, idx) => (
																		<TableRow key={idx}>
																			<TableCell
																				style={{ color: "var(--text-color)" }}
																			>
																				{student.name}
																			</TableCell>
																			<TableCell
																				style={{ color: "var(--label-color)" }}
																			>
																				{student.enrollment_number}
																			</TableCell>
																			<TableCell
																				style={{ color: "var(--label-color)" }}
																			>
																				{student.email || "N/A"}
																			</TableCell>
																			<TableCell
																				style={{ color: "var(--label-color)" }}
																			>
																				{student.role ||
																					student.roles?.[0]?.role ||
																					"N/A"}
																			</TableCell>
																			<TableCell
																				style={{ color: "var(--success-dark)" }}
																			>
																				{student.roles?.[0]?.packages?.[0]
																					? formatPackage(
																							student.roles[0].packages[0]
																					  )
																					: "N/A"}
																			</TableCell>
																			<TableCell
																				style={{ color: "var(--label-color)" }}
																			>
																				{student.job_location?.join(", ") ||
																					"N/A"}
																			</TableCell>
																			<TableCell
																				style={{ color: "var(--label-color)" }}
																			>
																				{formatDate(student.joining_date || "")}
																			</TableCell>
																		</TableRow>
																	)
																)}
															</TableBody>
														</Table>
													</div>
												</DialogContent>
											</Dialog>
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
							))}
						</div>

						{Object.entries(companyStats).length > COMPANIES_LIMIT && (
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
											<ChevronUpIcon className="w-4 h-4 mr-2" />
											Show Less Companies
										</>
									) : (
										<>
											<ChevronDownIcon className="w-4 h-4 mr-2" />
											Show All {Object.entries(companyStats).length} Companies
										</>
									)}
								</Button>
							</div>
						)}
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
								{placements.map((placement, placementIndex) =>
									placement.students_selected.map((student, studentIndex) => (
										<Card
											key={`${placementIndex}-${studentIndex}`}
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
															{student.name}
														</h3>
														<p
															className="text-sm"
															style={{ color: "var(--label-color)" }}
														>
															{student.enrollment_number}
														</p>
														{student.role && (
															<Badge
																variant="secondary"
																className="mt-1 text-xs"
																style={{
																	backgroundColor: "var(--card-bg)",
																	color: "var(--accent-color)",
																	borderColor: "var(--border-color)",
																}}
															>
																{student.role}
															</Badge>
														)}
													</div>
													<div>
														<p
															className="font-medium"
															style={{ color: "var(--text-color)" }}
														>
															{placement.company}
														</p>
														<div className="text-sm space-y-1">
															{placement.roles.map((role, roleIndex) => (
																<p
																	key={roleIndex}
																	style={{ color: "var(--label-color)" }}
																>
																	{role.role}
																</p>
															))}
														</div>
													</div>
													<div className="text-right md:text-left">
														<div className="space-y-1">
															{placement.roles.map((role, roleIndex) =>
																role.packages.map((pkg, pkgIndex) => (
																	<p
																		key={`${roleIndex}-${pkgIndex}`}
																		className="font-semibold text-sm"
																		style={{ color: "var(--success-dark)" }}
																	>
																		{formatPackage(pkg)}
																	</p>
																))
															)}
														</div>
														{placement.joining_date && (
															<div
																className="flex items-center text-sm mt-1"
																style={{ color: "var(--label-color)" }}
															>
																<CalendarIcon className="w-3 h-3 mr-1" />
																{formatDate(placement.joining_date)}
															</div>
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									))
								)}
							</div>
						) : (
							<div className="text-center py-8">
								<p className="mb-4" style={{ color: "var(--label-color)" }}>
									{totalStudentsPlaced} students have been successfully placed
									across {totalPlacements} companies
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
