"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	FilterIcon,
	XIcon,
	SearchIcon,
	MapPinIcon,
} from "lucide-react";

interface Role {
	role: string;
	package: number;
	package_details: string | null;
}

interface Student {
	name: string;
	enrollment_number: string;
	email: string | null;
	role: string;
	package: number | null;
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

	// Filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [packageRange, setPackageRange] = useState<[number, number]>([0, 70]);
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [showFilters, setShowFilters] = useState(false);

	const COMPANIES_LIMIT = 6;

	useEffect(() => {
		fetch("/data/placements.json")
			.then((res) => res.json())
			.then((data) => {
				setPlacements(data);
				setLoading(false);
			});
	}, []);

	const formatPackage = (packageValue: number | null) => {
		if (packageValue === null || packageValue === undefined) {
			return "TBD";
		}

		// Package value is already in LPA
		return `₹${packageValue.toFixed(1)} LPA`;
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return "TBD";
		return new Date(dateString).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Helper function to get package value with fallback to role package
	const getStudentPackage = (
		student: Student,
		placement: Placement
	): number | null => {
		// If student has a package, use it
		if (student.package !== null && student.package !== undefined) {
			return student.package;
		}

		// Try to find exact role match first
		const exactMatch = placement.roles.find(
			(role) => role.role === student.role
		);
		if (
			exactMatch &&
			exactMatch.package !== null &&
			exactMatch.package !== undefined
		) {
			return exactMatch.package;
		}

		// If no exact match or exact match has null package, look for viable alternatives
		const viableRoles = placement.roles.filter(
			(role) => role.package !== null && role.package !== undefined
		);

		// If only one viable role, use it regardless of role name match
		if (viableRoles.length === 1) {
			return viableRoles[0].package;
		}

		// If multiple viable roles, prefer the highest package (company's best offer)
		if (viableRoles.length > 1) {
			const maxPackage = Math.max(...viableRoles.map((role) => role.package));
			return maxPackage;
		}

		// No viable packages found
		return null;
	};

	// Calculate statistics
	const totalStudentsPlaced = placements.reduce(
		(total, placement) => total + placement.students_selected.length,
		0
	);

	const totalPlacements = placements.length;

	// Extract all package values for calculation from students
	const allPackages: number[] = [];
	placements.forEach((placement) => {
		placement.students_selected.forEach((student) => {
			const packageValue = getStudentPackage(student, placement);
			if (packageValue !== null && packageValue > 0) {
				allPackages.push(packageValue);
			}
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

		// Add all role profiles and student packages
		placement.roles.forEach((role) => {
			acc[placement.company].profiles.add(role.role);
		});

		placement.students_selected.forEach((student) => {
			const packageValue = getStudentPackage(student, placement);
			if (packageValue !== null && packageValue > 0) {
				acc[placement.company].packages.push(packageValue);
			}
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

	// Filter options
	const availableCompanies = Array.from(
		new Set(placements.map((p) => p.company))
	).sort();
	const availableRoles = Array.from(
		new Set(placements.flatMap((p) => p.roles.map((r) => r.role)))
	).sort();
	const availableLocations = Array.from(
		new Set(placements.flatMap((p) => p.job_location || []))
	)
		.filter(Boolean)
		.sort();

	// Filter logic
	const filteredPlacements = placements.filter((placement) => {
		// Company filter
		if (
			selectedCompanies.length > 0 &&
			!selectedCompanies.includes(placement.company)
		) {
			return false;
		}

		// Role filter - check if any student in this placement has a matching role
		if (selectedRoles.length > 0) {
			const hasMatchingRole = placement.students_selected.some((student) =>
				selectedRoles.includes(student.role)
			);
			if (!hasMatchingRole) return false;
		}

		// Location filter
		if (selectedLocations.length > 0) {
			const hasMatchingLocation = placement.job_location?.some((loc) =>
				selectedLocations.includes(loc)
			);
			if (!hasMatchingLocation) return false;
		}

		return true;
	});

	// Filter students based on search query and package range
	const filteredStudents = filteredPlacements.flatMap((placement) =>
		placement.students_selected
			.filter((student) => {
				// Search query filter
				if (searchQuery) {
					const query = searchQuery.toLowerCase();
					const matchesName = student.name.toLowerCase().includes(query);
					const matchesEnrollment = student.enrollment_number
						.toLowerCase()
						.includes(query);
					const matchesCompany = placement.company
						.toLowerCase()
						.includes(query);
					const matchesRole = student.role.toLowerCase().includes(query);

					if (
						!matchesName &&
						!matchesEnrollment &&
						!matchesCompany &&
						!matchesRole
					) {
						return false;
					}
				}

				// Package range filter
				const packageValue = getStudentPackage(student, placement);
				if (packageValue !== null) {
					if (
						packageValue < packageRange[0] ||
						packageValue > packageRange[1]
					) {
						return false;
					}
				}

				return true;
			})
			.map((student) => ({
				...student,
				company: placement.company,
				roles: placement.roles,
				joining_date: placement.joining_date,
				job_location: placement.job_location,
				placement: placement,
			}))
	);

	// Recalculate statistics for filtered data
	const filteredPackages: number[] = [];
	filteredStudents.forEach((student) => {
		const packageValue = getStudentPackage(student, student.placement);
		if (packageValue !== null && packageValue > 0) {
			filteredPackages.push(packageValue);
		}
	});

	const filteredAveragePackage =
		filteredPackages.length > 0
			? filteredPackages.reduce((a, b) => a + b, 0) / filteredPackages.length
			: 0;

	const filteredHighestPackage =
		filteredPackages.length > 0 ? Math.max(...filteredPackages) : 0;
	const filteredUniqueCompanies = new Set(
		filteredStudents.map((s) => s.company)
	).size;

	// Group filtered students by company for company-wise stats
	const filteredCompanyStats = filteredStudents.reduce((acc, student) => {
		const company = student.company;
		if (!acc[company]) {
			acc[company] = {
				count: 0,
				profiles: new Set(),
				avgPackage: 0,
				packages: [],
				studentsCount: 0,
			};
		}
		acc[company].studentsCount += 1;

		// Add profiles from the student's placement
		student.roles.forEach((role) => {
			acc[company].profiles.add(role.role);
		});

		const packageValue = getStudentPackage(student, student.placement);
		if (packageValue !== null && packageValue > 0) {
			acc[company].packages.push(packageValue);
		}

		return acc;
	}, {} as any);

	// Calculate average packages for filtered company stats
	Object.keys(filteredCompanyStats).forEach((company) => {
		const packages = filteredCompanyStats[company].packages;
		filteredCompanyStats[company].avgPackage =
			packages.length > 0
				? packages.reduce((a: number, b: number) => a + b, 0) / packages.length
				: 0;
	});

	// Clear filters function
	const clearFilters = () => {
		setSearchQuery("");
		setSelectedCompanies([]);
		setSelectedRoles([]);
		setPackageRange([0, 70]);
		setSelectedLocations([]);
	};

	// Check if any filters are active
	const hasActiveFilters =
		searchQuery !== "" ||
		selectedCompanies.length > 0 ||
		selectedRoles.length > 0 ||
		selectedLocations.length > 0 ||
		packageRange[0] !== 0 ||
		packageRange[1] !== 70;

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

		// Add data rows from filtered students
		filteredStudents.forEach((student) => {
			const packageValue = getStudentPackage(student, student.placement);
			csvData.push([
				student.name,
				student.enrollment_number,
				student.email || "N/A",
				student.company,
				student.role || "N/A",
				packageValue ? `₹${packageValue.toFixed(1)} LPA` : "TBD",
				student.job_location?.join(", ") || "N/A",
				student.joining_date || "TBD",
			]);
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
								Campus placement data and analytics ({filteredStudents.length}{" "}
								of {totalStudentsPlaced} students shown)
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

				{/* Floating Filter Button */}
				<div className="fixed bottom-6 right-6 z-50">
					<Sheet open={showFilters} onOpenChange={setShowFilters}>
						<SheetTrigger asChild>
							<Button
								className="rounded-full w-14 h-14 shadow-lg relative"
								style={{
									backgroundColor: "var(--accent-color)",
									color: "white",
								}}
							>
								<FilterIcon className="w-6 h-6" />
								{hasActiveFilters && (
									<Badge
										className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 flex items-center justify-center text-xs"
										style={{
											backgroundColor: "var(--error-color)",
											color: "white",
										}}
									>
										!
									</Badge>
								)}
							</Button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="w-[400px] sm:w-[540px]"
							style={{
								backgroundColor: "var(--primary-color)",
								borderColor: "var(--border-color)",
							}}
						>
							<SheetHeader>
								<SheetTitle style={{ color: "var(--text-color)" }}>
									Filter Placement Data
								</SheetTitle>
								<SheetDescription style={{ color: "var(--label-color)" }}>
									Filter students by company, role, location, and package range
								</SheetDescription>
							</SheetHeader>
							<div className="space-y-6 py-4">
								{/* Search */}
								<div className="space-y-2">
									<label
										className="text-sm font-medium"
										style={{ color: "var(--text-color)" }}
									>
										Search
									</label>
									<div className="flex items-center space-x-2">
										<SearchIcon
											className="w-4 h-4"
											style={{ color: "var(--label-color)" }}
										/>
										<Input
											placeholder="Search students, companies, or roles..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="flex-1"
											style={{
												backgroundColor: "var(--card-bg)",
												borderColor: "var(--border-color)",
												color: "var(--text-color)",
											}}
										/>
									</div>
								</div>

								{/* Company Filter */}
								<div className="space-y-2">
									<label
										className="text-sm font-medium"
										style={{ color: "var(--text-color)" }}
									>
										Companies
									</label>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												className="w-full justify-between"
												style={{
													backgroundColor: "var(--card-bg)",
													borderColor: "var(--border-color)",
													color: "var(--text-color)",
												}}
											>
												{selectedCompanies.length > 0
													? `${selectedCompanies.length} selected`
													: "All Companies"}
												<ChevronDownIcon className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-56"
											style={{
												backgroundColor: "var(--primary-color)",
												borderColor: "var(--border-color)",
											}}
										>
											<DropdownMenuLabel style={{ color: "var(--text-color)" }}>
												Select Companies
											</DropdownMenuLabel>
											<DropdownMenuSeparator
												style={{ backgroundColor: "var(--border-color)" }}
											/>
											{availableCompanies.map((company) => (
												<DropdownMenuCheckboxItem
													key={company}
													checked={selectedCompanies.includes(company)}
													onCheckedChange={(checked) =>
														setSelectedCompanies((prev) =>
															checked
																? [...prev, company]
																: prev.filter((c) => c !== company)
														)
													}
													style={{ color: "var(--text-color)" }}
												>
													{company}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								{/* Role Filter */}
								<div className="space-y-2">
									<label
										className="text-sm font-medium"
										style={{ color: "var(--text-color)" }}
									>
										Roles
									</label>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												className="w-full justify-between"
												style={{
													backgroundColor: "var(--card-bg)",
													borderColor: "var(--border-color)",
													color: "var(--text-color)",
												}}
											>
												{selectedRoles.length > 0
													? `${selectedRoles.length} selected`
													: "All Roles"}
												<ChevronDownIcon className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-56 max-h-64 overflow-y-auto"
											style={{
												backgroundColor: "var(--primary-color)",
												borderColor: "var(--border-color)",
											}}
										>
											<DropdownMenuLabel style={{ color: "var(--text-color)" }}>
												Select Roles
											</DropdownMenuLabel>
											<DropdownMenuSeparator
												style={{ backgroundColor: "var(--border-color)" }}
											/>
											{availableRoles.map((role) => (
												<DropdownMenuCheckboxItem
													key={role}
													checked={selectedRoles.includes(role)}
													onCheckedChange={(checked) =>
														setSelectedRoles((prev) =>
															checked
																? [...prev, role]
																: prev.filter((r) => r !== role)
														)
													}
													style={{ color: "var(--text-color)" }}
												>
													{role}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								{/* Location Filter */}
								<div className="space-y-2">
									<label
										className="text-sm font-medium"
										style={{ color: "var(--text-color)" }}
									>
										Locations
									</label>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												className="w-full justify-between"
												style={{
													backgroundColor: "var(--card-bg)",
													borderColor: "var(--border-color)",
													color: "var(--text-color)",
												}}
											>
												{selectedLocations.length > 0
													? `${selectedLocations.length} selected`
													: "All Locations"}
												<ChevronDownIcon className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-56 max-h-64 overflow-y-auto"
											style={{
												backgroundColor: "var(--primary-color)",
												borderColor: "var(--border-color)",
											}}
										>
											<DropdownMenuLabel style={{ color: "var(--text-color)" }}>
												Select Locations
											</DropdownMenuLabel>
											<DropdownMenuSeparator
												style={{ backgroundColor: "var(--border-color)" }}
											/>
											{availableLocations.map((location) => (
												<DropdownMenuCheckboxItem
													key={location}
													checked={selectedLocations.includes(location)}
													onCheckedChange={(checked) =>
														setSelectedLocations((prev) =>
															checked
																? [...prev, location]
																: prev.filter((l) => l !== location)
														)
													}
													style={{ color: "var(--text-color)" }}
												>
													{location}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								{/* Package Range Filter */}
								<div className="space-y-2">
									<label
										className="text-sm font-medium"
										style={{ color: "var(--text-color)" }}
									>
										Package Range (LPA)
									</label>
									<div className="space-y-2">
										<Slider
											value={packageRange}
											onValueChange={(value) =>
												setPackageRange(value as [number, number])
											}
											max={70}
											min={0}
											step={0.5}
											className="w-full"
										/>
										<div
											className="flex justify-between text-xs"
											style={{ color: "var(--label-color)" }}
										>
											<span>₹{packageRange[0]} LPA</span>
											<span>₹{packageRange[1]} LPA</span>
										</div>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex space-x-2 pt-4">
									<Button
										variant="outline"
										onClick={clearFilters}
										className="flex-1"
										style={{
											borderColor: "var(--border-color)",
											color: "var(--text-color)",
										}}
									>
										<XIcon className="w-4 h-4 mr-2" />
										Clear All
									</Button>
									<Button
										onClick={() => setShowFilters(false)}
										className="flex-1"
										style={{
											backgroundColor: "var(--accent-color)",
											color: "white",
										}}
									>
										Apply Filters
									</Button>
								</div>

								{/* Filter Summary */}
								<div
									className="border-t pt-4"
									style={{ borderColor: "var(--border-color)" }}
								>
									<p
										className="text-sm font-medium mb-2"
										style={{ color: "var(--text-color)" }}
									>
										Results
									</p>
									<p
										className="text-sm"
										style={{ color: "var(--label-color)" }}
									>
										{filteredStudents.length} of {totalStudentsPlaced} students
									</p>
									<p
										className="text-sm"
										style={{ color: "var(--label-color)" }}
									>
										{filteredUniqueCompanies} of {uniqueCompanies} companies
									</p>
								</div>
							</div>
						</SheetContent>
					</Sheet>
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
										{filteredStudents.length}
									</p>
									{filteredStudents.length !== totalStudentsPlaced && (
										<p
											className="text-xs"
											style={{ color: "var(--label-color)" }}
										>
											of {totalStudentsPlaced} total
										</p>
									)}
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
										{formatPackage(filteredAveragePackage)}
									</p>
									{filteredAveragePackage !== averagePackage && (
										<p
											className="text-xs"
											style={{ color: "var(--label-color)" }}
										>
											overall: {formatPackage(averagePackage)}
										</p>
									)}
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
										Highest Package
									</p>
									<p
										className="text-3xl font-bold"
										style={{ color: "var(--text-color)" }}
									>
										{formatPackage(filteredHighestPackage)}
									</p>
									{filteredHighestPackage !== highestPackage && (
										<p
											className="text-xs"
											style={{ color: "var(--label-color)" }}
										>
											overall: {formatPackage(highestPackage)}
										</p>
									)}
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
										{filteredUniqueCompanies}
									</p>
									{filteredUniqueCompanies !== uniqueCompanies && (
										<p
											className="text-xs"
											style={{ color: "var(--label-color)" }}
										>
											of {uniqueCompanies} total
										</p>
									)}
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
							<div className="flex items-center gap-2">
								<BuildingIcon
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
																				{student.role || "N/A"}
																			</TableCell>
																			<TableCell
																				style={{ color: "var(--success-dark)" }}
																			>
																				{(() => {
																					const placement = placements.find(
																						(p) => p.company === company
																					);
																					const packageValue = placement
																						? getStudentPackage(
																								student,
																								placement
																						  )
																						: student.package;
																					return packageValue
																						? formatPackage(packageValue)
																						: "TBD";
																				})()}
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
								className="flex items-center gap-2"
								style={{ color: "var(--text-color)" }}
							>
								<GraduationCapIcon
									className="w-5 h-5 mr-2"
									style={{ color: "var(--accent-color)" }}
								/>
								Placed Students
								{hasActiveFilters ? (
									<Badge
										className="rounded-full"
										style={{
											backgroundColor: "var(--accent-color)",
											color: "white",
										}}
									>
										{filteredStudents.length}
									</Badge>
								) : (
									<span style={{ color: "var(--label-color)" }}>
										({filteredStudents.length})
									</span>
								)}
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
								{showStudentList
									? "Hide List"
									: `View All Students (${filteredStudents.length})`}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{showStudentList ? (
							<div className="space-y-4">
								{filteredStudents.length > 0 ? (
									filteredStudents.map((student, studentIndex) => (
										<Card
											key={`${student.enrollment_number}-${studentIndex}`}
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
															{student.company}
														</p>
														<div className="text-sm space-y-1">
															{student.roles.map((role, roleIndex) => (
																<p
																	key={roleIndex}
																	style={{ color: "var(--label-color)" }}
																>
																	{role.role}
																</p>
															))}
														</div>
														{student.job_location &&
															student.job_location.length > 0 && (
																<div
																	className="flex items-center text-xs mt-1"
																	style={{ color: "var(--label-color)" }}
																>
																	<MapPinIcon className="w-3 h-3 mr-1" />
																	{student.job_location.join(", ")}
																</div>
															)}
													</div>
													<div className="text-right md:text-left">
														<div className="space-y-1">
															{(() => {
																const packageValue = getStudentPackage(
																	student,
																	student.placement
																);
																return packageValue ? (
																	<p
																		className="font-semibold text-sm"
																		style={{ color: "var(--success-dark)" }}
																	>
																		{formatPackage(packageValue)}
																	</p>
																) : (
																	<p
																		className="font-semibold text-sm"
																		style={{ color: "var(--label-color)" }}
																	>
																		TBD
																	</p>
																);
															})()}
														</div>
														{student.joining_date && (
															<div
																className="flex items-center text-sm mt-1"
																style={{ color: "var(--label-color)" }}
															>
																<CalendarIcon className="w-3 h-3 mr-1" />
																{formatDate(student.joining_date)}
															</div>
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									))
								) : (
									<div className="text-center py-8">
										<p style={{ color: "var(--label-color)" }}>
											No students match the current filters.
										</p>
										<Button
											variant="outline"
											onClick={clearFilters}
											className="mt-4"
											style={{
												borderColor: "var(--border-color)",
												color: "var(--text-color)",
											}}
										>
											Clear Filters
										</Button>
									</div>
								)}
							</div>
						) : (
							<div className="text-center py-8">
								<p className="mb-4" style={{ color: "var(--label-color)" }}>
									{filteredStudents.length} students{" "}
									{filteredStudents.length !== totalStudentsPlaced
										? `(of ${totalStudentsPlaced} total) `
										: ""}
									have been successfully placed across {filteredUniqueCompanies}{" "}
									companies
									{filteredUniqueCompanies !== uniqueCompanies
										? ` (of ${uniqueCompanies} total)`
										: ""}
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
											{formatPackage(filteredHighestPackage)}
										</p>
										{filteredHighestPackage !== highestPackage && (
											<p
												className="text-xs"
												style={{ color: "var(--label-color)" }}
											>
												overall: {formatPackage(highestPackage)}
											</p>
										)}
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
											{formatPackage(filteredAveragePackage)}
										</p>
										{filteredAveragePackage !== averagePackage && (
											<p
												className="text-xs"
												style={{ color: "var(--label-color)" }}
											>
												overall: {formatPackage(averagePackage)}
											</p>
										)}
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
