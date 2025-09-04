"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
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
	Users,
	TrendingUp,
	IndianRupee,
	Building,
	GraduationCap,
	Calendar,
	Download,
	Eye,
	EyeOff,
	ChevronDown,
	ChevronUp,
	Filter,
	X,
	Search,
	MapPin,
} from "lucide-react";

import enrollmentRanges from "./enrollmemt_range.json"; // enrollment mapping
// Mtech & JUIT enrollment pattern i didn't want to figure out sooo
// 24* -> MTech
// contains alphabets -> JUIT
// len 9 -> JUIT

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
	const [showAllBranches, setShowAllBranches] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
	const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

	// Filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [packageRange, setPackageRange] = useState<[number, number]>([0, 100]);
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [showFilters, setShowFilters] = useState(false);

	// Sorting state for students
	const [sortKey, setSortKey] = useState<
		"name" | "package" | "company" | "joining_date" | "enrollment" | "role"
	>("name");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

	const COMPANIES_LIMIT = 6;
	const BRANCHES_LIMIT = 3;

	// Use react-query to fetch placements
	const { data: placementsResp, isLoading: placementsLoading } = useQuery<
		Placement[]
	>({
		queryKey: ["placement-offers"],
		queryFn: async () => {
			const res = await fetch("/api/placement-offers");
			const json = await res.json();
			return (json?.ok ? json.data : []) as Placement[];
		},
	});

	useEffect(() => {
		if (placementsResp) {
			setPlacements(placementsResp);
			setLoading(false);
		}
	}, [placementsResp]);

	useEffect(() => setLoading(placementsLoading), [placementsLoading]);

	const formatPackage = (packageValue: number | null) => {
		if (packageValue === null || packageValue === undefined) {
			return "TBD";
		}

		// Package value is already in LPA
		return `₹${packageValue.toFixed(1)} LPA`;
	};

	// Compute a fallback package for a company when no students are recorded.
	const getCompanyFallbackPackage = (companyName: string): number => {
		const companyPlacements = placements.filter(
			(p: Placement) => p.company === companyName
		);
		const rolePackages: number[] = companyPlacements.flatMap((p: Placement) =>
			(p.roles || [])
				.map((r: Role) => r.package)
				.filter((pk): pk is number => pk != null)
		);
		return rolePackages.length > 0 ? Math.max(...rolePackages) : 0;
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return "TBD";
		return new Date(dateString).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Determine student's branch from enrollment number using mapping + heuristics
	const getBranch = (enroll?: string | null): string => {
		if (!enroll) return "Unknown";
		const s = String(enroll).trim();
		// JUIT contains alphabets in enrollment
		if (/[A-Za-z]/.test(s)) return "JUIT";
		// If enrollment length is 9, classify as JUIT
		if (s.length === 9) return "JUIT";
		// Heuristic: 24* => MTech
		if (s.startsWith("24")) return "MTech";
		const n = Number(s);
		if (!Number.isFinite(n)) return "Unknown";
		try {
			for (const [branch, ranges] of Object.entries(
				enrollmentRanges as unknown as Record<string, any>
			)) {
				if (branch === "Intg. MTech") {
					for (const nested of Object.values(ranges || {})) {
						const { start, end } = nested as { start: number; end: number };
						if (
							typeof start === "number" &&
							typeof end === "number" &&
							n >= start &&
							n < end
						) {
							return "Intg. MTech";
						}
					}
					continue;
				}
				for (const entry of Object.values(ranges || {})) {
					const { start, end } = entry as { start: number; end: number };
					if (
						typeof start === "number" &&
						typeof end === "number" &&
						n >= start &&
						n < end
					) {
						return branch;
					}
				}
			}
		} catch {
			// ignore
		}
		return "Unknown";
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
		(total: number, placement: Placement) =>
			total + placement.students_selected.length,
		0
	);

	const totalPlacements = placements.length;

	// Extract all package values for calculation from students
	const allPackages: number[] = [];
	placements.forEach((placement: Placement) => {
		placement.students_selected.forEach((student: Student) => {
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
	const uniqueCompanies = new Set(placements.map((p: Placement) => p.company))
		.size;

	// Group placements by company
	const companyStats = placements.reduce((acc: any, placement: Placement) => {
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
		placement.roles.forEach((role: Role) => {
			acc[placement.company].profiles.add(role.role);
		});

		placement.students_selected.forEach((student: Student) => {
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
		new Set(placements.map((p: Placement) => p.company))
	).sort();
	const availableRoles = Array.from(
		new Set(
			placements.flatMap((p: Placement) => p.roles.map((r: Role) => r.role))
		)
	).sort();
	const availableLocations = Array.from(
		new Set(placements.flatMap((p: Placement) => p.job_location || []))
	)
		.filter(Boolean)
		.sort();

	// Filter logic
	const filteredPlacements = placements.filter((placement: Placement) => {
		// Company filter
		if (
			selectedCompanies.length > 0 &&
			!selectedCompanies.includes(placement.company)
		) {
			return false;
		}

		// Role filter - check if any student in this placement has a matching role
		if (selectedRoles.length > 0) {
			const hasMatchingRole = placement.students_selected.some(
				(student: Student) => selectedRoles.includes(student.role)
			);
			if (!hasMatchingRole) return false;
		}

		// Location filter
		if (selectedLocations.length > 0) {
			const hasMatchingLocation = placement.job_location?.some((loc: string) =>
				selectedLocations.includes(loc)
			);
			if (!hasMatchingLocation) return false;
		}

		return true;
	});

	// Filter students based on search query and package range
	const filteredStudents = filteredPlacements.flatMap((placement: Placement) =>
		placement.students_selected
			.filter((student: Student) => {
				// Search query filter
				if (searchQuery) {
					const query = searchQuery.toLowerCase();
					const matchesName =
						!!student.name && student.name.toLowerCase().includes(query);
					const matchesEnrollment =
						!!student.enrollment_number &&
						student.enrollment_number.toLowerCase().includes(query);
					const matchesCompany =
						!!placement.company &&
						placement.company.toLowerCase().includes(query);
					const matchesRole =
						!!student.role && student.role.toLowerCase().includes(query);

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
			.map((student: Student) => ({
				...student,
				company: placement.company,
				roles: placement.roles,
				joining_date: placement.joining_date || undefined,
				job_location: placement.job_location,
				placement: placement,
			}))
	);

	// Recalculate statistics for filtered data
	const filteredPackages: number[] = [];
	filteredStudents.forEach((student: Student & { placement: Placement }) => {
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
	const filteredSortedPackages = [...filteredPackages].sort((a, b) => a - b);
	const filteredMedianPackage =
		filteredSortedPackages.length > 0
			? filteredSortedPackages.length % 2 === 0
				? (filteredSortedPackages[filteredSortedPackages.length / 2 - 1] +
						filteredSortedPackages[filteredSortedPackages.length / 2]) /
				  2
				: filteredSortedPackages[Math.floor(filteredSortedPackages.length / 2)]
			: 0;
	const filteredUniqueCompanies = new Set(
		filteredStudents.map((s: any) => s.company)
	).size;

	// Sort helper for lists of students
	const sortStudentsList = (
		students: Array<
			Student & {
				company?: string;
				placement?: Placement;
				joining_date?: string;
				roles?: Role[];
				job_location?: string[] | null;
			}
		>
	) => {
		const list = [...students];
		list.sort((a, b) => {
			const dir = sortDir === "asc" ? 1 : -1;

			if (sortKey === "name") {
				return ((a.name || "") as string).localeCompare(b.name || "") * dir;
			}

			if (sortKey === "company") {
				return (
					((a.company || "") as string).localeCompare(b.company || "") * dir
				);
			}

			if (sortKey === "enrollment") {
				return (
					((a.enrollment_number || "") as string).localeCompare(
						b.enrollment_number || ""
					) * dir
				);
			}

			if (sortKey === "role") {
				return ((a.role || "") as string).localeCompare(b.role || "") * dir;
			}

			if (sortKey === "joining_date") {
				const da = a.joining_date ? new Date(a.joining_date).getTime() : 0;
				const db = b.joining_date ? new Date(b.joining_date).getTime() : 0;
				return (da - db) * dir;
			}

			// package
			const pa = a.placement
				? getStudentPackage(a, a.placement)
				: getStudentPackage(
						a,
						placements.find(
							(p: Placement) => p.company === a.company
						) as Placement
				  ) ?? 0;
			const pb = b.placement
				? getStudentPackage(b, b.placement)
				: getStudentPackage(
						b,
						placements.find(
							(p: Placement) => p.company === b.company
						) as Placement
				  ) ?? 0;
			return ((pa ?? 0) - (pb ?? 0)) * dir;
		});
		return list;
	};

	// Group filtered students by company for company-wise stats
	const filteredCompanyStats = filteredStudents.reduce(
		(
			acc: any,
			student: Student & {
				company: string;
				roles: Role[];
				placement: Placement;
			}
		) => {
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
		},
		{} as any
	);

	// Calculate average packages for filtered company stats
	Object.keys(filteredCompanyStats).forEach((company) => {
		const packages = filteredCompanyStats[company].packages;
		filteredCompanyStats[company].avgPackage =
			packages.length > 0
				? packages.reduce((a: number, b: number) => a + b, 0) / packages.length
				: 0;
	});

	// Branch-wise stats from filtered students
	const branchStats = filteredStudents.reduce(
		(
			acc: Record<
				string,
				{
					count: number;
					packages: number[];
					avgPackage: number;
					highest: number;
					median: number;
				}
			>,
			s: any
		) => {
			const b = getBranch(s.enrollment_number);
			if (!acc[b])
				acc[b] = {
					count: 0,
					packages: [],
					avgPackage: 0,
					highest: 0,
					median: 0,
				};
			acc[b].count += 1;
			const pkg = getStudentPackage(s, s.placement);
			if (pkg != null && pkg > 0) acc[b].packages.push(pkg);
			return acc;
		},
		{}
	);

	Object.keys(branchStats).forEach((b) => {
		const pkgs = branchStats[b].packages;
		branchStats[b].avgPackage = pkgs.length
			? pkgs.reduce((a, c) => a + c, 0) / pkgs.length
			: 0;
		branchStats[b].highest = pkgs.length ? Math.max(...pkgs) : 0;
		const sorted = [...pkgs].sort((a, c) => a - c);
		branchStats[b].median = sorted.length
			? sorted.length % 2 === 0
				? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
				: sorted[Math.floor(sorted.length / 2)]
			: 0;
	});

	// Clear filters function
	const clearFilters = () => {
		setSearchQuery("");
		setSelectedCompanies([]);
		setSelectedRoles([]);
		setPackageRange([0, 100]);
		setSelectedLocations([]);
	};

	// Check if any filters are active
	const hasActiveFilters =
		searchQuery !== "" ||
		selectedCompanies.length > 0 ||
		selectedRoles.length > 0 ||
		selectedLocations.length > 0 ||
		packageRange[0] !== 0 ||
		packageRange[1] !== 100;

	// Helper function to get students for a specific company
	const getCompanyStudents = (companyName: string) => {
		// If filters are active, return students from the filtered set so company dialog
		// reflects current filters; otherwise return all students from placements.
		if (hasActiveFilters) {
			return sortStudentsList(
				filteredStudents
					.filter((s: any) => s.company === companyName)
					.map((s: any) => s)
			);
		}
		return sortStudentsList(
			placements
				.filter((placement: Placement) => placement.company === companyName)
				.flatMap((placement: Placement) =>
					placement.students_selected.map((student: Student) => ({
						...student,
						company: placement.company,
						roles: placement.roles,
						joining_date: placement.joining_date || undefined,
						job_location: placement.job_location,
						placement: placement,
					}))
				)
		);
	};

	// Helper function to get students for a specific branch
	const getBranchStudents = (branchName: string) => {
		const base = hasActiveFilters
			? filteredStudents
			: placements.flatMap((placement: Placement) =>
					placement.students_selected.map((student: Student) => ({
						...student,
						company: placement.company,
						roles: placement.roles,
						joining_date: placement.joining_date || undefined,
						job_location: placement.job_location,
						placement: placement,
					}))
			  );

		return sortStudentsList(
			base
				.filter((s: any) => getBranch(s.enrollment_number) === branchName)
				.map((s: any) => s)
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
				student.email ||
					`${student.enrollment_number}@${
						/[A-Za-z]/.test(student.enrollment_number || "")
							? "mail.juit.ac.in"
							: "mail.jiit.ac.in"
					}`,
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

	// Get companies to display (limited or all). If filters are active, use the
	// filteredCompanyStats so the company list matches the current filters.
	const sourceCompanyStats = hasActiveFilters
		? filteredCompanyStats
		: companyStats;
	// Sort company entries alphabetically by company name before slicing/showing
	const companyEntries = Object.entries(sourceCompanyStats).sort(([a], [b]) =>
		a.localeCompare(b)
	);
	const companiesToShow = showAllCompanies
		? companyEntries
		: companyEntries.slice(0, COMPANIES_LIMIT);

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
					<div className="text-center sm:text-left">
						<h1
							className="text-2xl text-center lg:text-3xl font-bold mb-2"
							style={{ color: "var(--text-color)" }}
						>
							Placement Statistics
						</h1>
						<p className="text-center" style={{ color: "var(--label-color)" }}>
							Campus placement data and analytics
						</p>
					</div>
				</div>

				{/* Floating Filter Button */}
				<div className="fixed bottom-24 md:bottom-6 right-6 z-50">
					<Sheet open={showFilters} onOpenChange={setShowFilters}>
						<SheetTrigger asChild>
							<Button
								className="rounded-2xl w-14 h-14 shadow-lg relative"
								style={{
									backgroundColor: "var(--accent-color)",
									color: "white",
								}}
							>
								<Filter className="w-6 h-6" />
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
							className="w-[400px] sm:w-[540px] overflow-y-auto"
						>
							<SheetHeader className="pb-6">
								<SheetTitle className="text-xl font-bold flex items-center gap-2">
									<Filter className="w-5 h-5" />
									Filter Placement Data
								</SheetTitle>
								<SheetDescription className="text-sm text-muted-foreground">
									Refine your view by filtering students based on company, role,
									location, and package range
								</SheetDescription>
							</SheetHeader>

							<div className="space-y-8 py-2">
								{/* Search Section */}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<Search className="w-4 h-4 text-muted-foreground" />
										<label className="text-sm font-semibold text-foreground">
											Search
										</label>
									</div>
									<Input
										placeholder="Search students, companies, or roles..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="h-11"
									/>
									{searchQuery && (
										<p className="text-xs text-muted-foreground">
											Searching across names, enrollment numbers, companies, and
											roles
										</p>
									)}
								</div>

								{/* Company Filter Section */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Building className="w-4 h-4 text-muted-foreground" />
											<label className="text-sm font-semibold text-foreground">
												Companies
											</label>
										</div>
										{selectedCompanies.length > 0 && (
											<Badge variant="secondary" className="text-xs">
												{selectedCompanies.length} selected
											</Badge>
										)}
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												className="w-full justify-between h-11"
											>
												{selectedCompanies.length > 0
													? `${selectedCompanies.length} companies selected`
													: "Select companies"}
												<ChevronDown className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-80 max-h-60 overflow-y-auto">
											<DropdownMenuLabel className="font-semibold">
												Select Companies
											</DropdownMenuLabel>
											<DropdownMenuSeparator />
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
													className="py-2"
												>
													{company}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
									{selectedCompanies.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{selectedCompanies.slice(0, 3).map((company) => (
												<Badge
													key={company}
													variant="outline"
													className="text-xs"
												>
													{company}
												</Badge>
											))}
											{selectedCompanies.length > 3 && (
												<Badge variant="outline" className="text-xs">
													+{selectedCompanies.length - 3} more
												</Badge>
											)}
										</div>
									)}
								</div>

								{/* Role Filter Section */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<GraduationCap className="w-4 h-4 text-muted-foreground" />
											<label className="text-sm font-semibold text-foreground">
												Roles
											</label>
										</div>
										{selectedRoles.length > 0 && (
											<Badge variant="secondary" className="text-xs">
												{selectedRoles.length} selected
											</Badge>
										)}
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												className="w-full justify-between h-11"
											>
												{selectedRoles.length > 0
													? `${selectedRoles.length} roles selected`
													: "Select roles"}
												<ChevronDown className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-80 max-h-60 overflow-y-auto">
											<DropdownMenuLabel className="font-semibold">
												Select Roles
											</DropdownMenuLabel>
											<DropdownMenuSeparator />
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
													className="py-2"
												>
													{role}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
									{selectedRoles.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{selectedRoles.slice(0, 3).map((role) => (
												<Badge key={role} variant="outline" className="text-xs">
													{role}
												</Badge>
											))}
											{selectedRoles.length > 3 && (
												<Badge variant="outline" className="text-xs">
													+{selectedRoles.length - 3} more
												</Badge>
											)}
										</div>
									)}
								</div>

								{/* Location Filter Section */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<MapPin className="w-4 h-4 text-muted-foreground" />
											<label className="text-sm font-semibold text-foreground">
												Locations
											</label>
										</div>
										{selectedLocations.length > 0 && (
											<Badge variant="secondary" className="text-xs">
												{selectedLocations.length} selected
											</Badge>
										)}
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												className="w-full justify-between h-11"
											>
												{selectedLocations.length > 0
													? `${selectedLocations.length} locations selected`
													: "Select locations"}
												<ChevronDown className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-80 max-h-60 overflow-y-auto">
											<DropdownMenuLabel className="font-semibold">
												Select Locations
											</DropdownMenuLabel>
											<DropdownMenuSeparator />
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
													className="py-2"
												>
													{location}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
									{selectedLocations.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{selectedLocations.slice(0, 3).map((location) => (
												<Badge
													key={location}
													variant="outline"
													className="text-xs"
												>
													{location}
												</Badge>
											))}
											{selectedLocations.length > 3 && (
												<Badge variant="outline" className="text-xs">
													+{selectedLocations.length - 3} more
												</Badge>
											)}
										</div>
									)}
								</div>

								{/* Package Range Filter Section */}
								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<IndianRupee className="w-4 h-4 text-muted-foreground" />
										<label className="text-sm font-semibold text-foreground">
											Package Range
										</label>
									</div>
									<div className="space-y-4">
										<div className="px-2">
											<Slider
												value={packageRange}
												onValueChange={(value) =>
													setPackageRange(value as [number, number])
												}
												max={100}
												min={0}
												step={0.5}
												className="w-full"
											/>
										</div>
										<div className="flex items-center justify-between text-sm">
											<div className="flex items-center gap-1">
												<span className="text-muted-foreground">Min:</span>
												<Badge variant="outline" className="font-mono">
													₹{packageRange[0]} LPA
												</Badge>
											</div>
											<div className="flex items-center gap-1">
												<span className="text-muted-foreground">Max:</span>
												<Badge variant="outline" className="font-mono">
													₹{packageRange[1]} LPA
												</Badge>
											</div>
										</div>
										{(packageRange[0] !== 0 || packageRange[1] !== 100) && (
											<p className="text-xs text-muted-foreground text-center">
												Showing packages between ₹{packageRange[0]} - ₹
												{packageRange[1]} LPA
											</p>
										)}
									</div>
								</div>

								{/* Action Buttons Section */}
								<div className="space-y-3 pt-6 border-t">
									<div className="flex gap-3">
										<Button
											variant="outline"
											onClick={clearFilters}
											className="flex-1 h-11"
											disabled={!hasActiveFilters}
										>
											<X className="w-4 h-4 mr-2" />
											Clear All
										</Button>
										<Button
											onClick={() => setShowFilters(false)}
											className="flex-1 h-11"
										>
											Apply Filters
										</Button>
									</div>

									{/* Filter Summary Card */}
									<div className="bg-muted/30 rounded-lg p-4 space-y-2">
										<h4 className="text-sm font-semibold text-foreground">
											Filter Results
										</h4>
										<div className="grid grid-cols-2 gap-4 text-sm">
											<div>
												<p className="text-muted-foreground">Students</p>
												<p className="font-semibold">
													{filteredStudents.length} of {totalStudentsPlaced}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Companies</p>
												<p className="font-semibold">
													{filteredUniqueCompanies} of {uniqueCompanies}
												</p>
											</div>
										</div>
										{hasActiveFilters && (
											<div className="pt-2 border-t border-border/50">
												<p className="text-xs text-muted-foreground">
													{[
														searchQuery && "text search",
														selectedCompanies.length > 0 &&
															`${selectedCompanies.length} companies`,
														selectedRoles.length > 0 &&
															`${selectedRoles.length} roles`,
														selectedLocations.length > 0 &&
															`${selectedLocations.length} locations`,
														(packageRange[0] !== 0 ||
															packageRange[1] !== 100) &&
															"package range",
													]
														.filter(Boolean)
														.join(", ")}{" "}
													applied
												</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>

				{/* Floating Export CSV Button */}
				<div className="fixed bottom-24 md:bottom-6 right-20 z-50 mr-1">
					<Button
						onClick={() => {
							exportToCSV();

							// Create a temporary toast/notification element appended to body
							const toast = document.createElement("div");
							toast.setAttribute("role", "status");
							toast.setAttribute("aria-live", "polite");
							toast.textContent = "CSV downloaded";

							// Style the toast (keeps styling inline so no extra CSS is required)
							Object.assign(toast.style, {
								position: "fixed",
								right: "20px",
								bottom: "96px",
								zIndex: "9999",
								background: "var(--accent-color)",
								color: "white",
								padding: "8px 12px",
								borderRadius: "9999px",
								boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
								fontSize: "13px",
								fontWeight: "600",
								opacity: "0",
								transform: "translateY(6px)",
								transition: "opacity 180ms ease, transform 180ms ease",
								pointerEvents: "none",
							});

							document.body.appendChild(toast);

							// Trigger appear animation
							requestAnimationFrame(() => {
								toast.style.opacity = "1";
								toast.style.transform = "translateY(0)";
							});

							// Remove after 2.5s with fade out
							setTimeout(() => {
								toast.style.opacity = "0";
								toast.style.transform = "translateY(6px)";
								setTimeout(() => {
									if (toast.parentNode) toast.parentNode.removeChild(toast);
								}, 200);
							}, 2500);
						}}
						className="rounded-2xl w-14 h-14 shadow-lg"
						style={{
							backgroundColor: "var(--accent-color)",
							color: "white",
						}}
						aria-label="Export CSV"
					>
						<Download className="w-5 h-5" />
					</Button>
				</div>

				{/* Key Statistics */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
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
								<Users
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
								<TrendingUp
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
										{formatPackage(filteredMedianPackage)}
									</p>
									{filteredMedianPackage !== medianPackage && (
										<p
											className="text-xs"
											style={{ color: "var(--label-color)" }}
										>
											overall: {formatPackage(medianPackage)}
										</p>
									)}
								</div>
								<TrendingUp
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
								<IndianRupee
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
								<Building
									className="w-8 h-8"
									style={{ color: "var(--accent-color)" }}
								/>
							</div>
						</CardContent>
					</Card>
				</div>
				{/* Branch-wise Statistics */}
				<Card className="card-theme">
					<CardHeader>
						<CardTitle
							className="flex items-center justify-between"
							style={{ color: "var(--text-color)" }}
						>
							<div className="flex items-center gap-2">
								<GraduationCap
									className="w-5 h-5 mr-2"
									style={{ color: "var(--accent-color)" }}
								/>
								Branch-wise Placements
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						{Object.keys(branchStats).length === 0 ? (
							<div
								className="text-center py-6"
								style={{ color: "var(--label-color)" }}
							>
								No branch data for current filters.
							</div>
						) : (
							<>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{(() => {
										const branchEntries = Object.entries(branchStats)
											.sort((a, b) => b[1].count - a[1].count);
										const branchesToShow = showAllBranches
											? branchEntries
											: branchEntries.slice(0, BRANCHES_LIMIT);
										
										return branchesToShow.map(([branch, stats]) => (
										<Dialog
											key={branch}
											open={isBranchModalOpen && selectedBranch === branch}
											onOpenChange={(open) => {
												setIsBranchModalOpen(open);
												if (!open) setSelectedBranch(null);
											}}
										>
											{/* Compact grid-based design */}
											<Card
												className="border card-theme cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
												style={{
													backgroundColor: "var(--primary-color)",
													borderColor: "var(--border-color)",
												}}
												onClick={() => {
													setSelectedBranch(branch);
													setIsBranchModalOpen(true);
												}}
											>
												<CardContent className="p-4">
													{/* Mobile Layout (default) */}
													<div className="sm:hidden">
														<div className="flex items-center justify-between mb-3">
															<div className="flex items-center gap-3">
																<div
																	className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
																	style={{
																		backgroundColor: "var(--accent-color)",
																	}}
																>
																	{branch.charAt(0)}
																</div>
																<div>
																	<h3
																		className="font-bold text-base leading-tight"
																		style={{ color: "var(--text-color)" }}
																	>
																		{branch}
																	</h3>
																	<p
																		className="text-xs"
																		style={{ color: "var(--label-color)" }}
																	>
																		{(stats as any).count} students
																	</p>
																</div>
															</div>
															<div className="text-right">
																<div
																	className="text-lg font-bold"
																	style={{ color: "var(--success-dark)" }}
																>
																	{formatPackage((stats as any).avgPackage)}
																</div>
																<p
																	className="text-xs"
																	style={{ color: "var(--label-color)" }}
																>
																	Average
																</p>
															</div>
														</div>

														<div className="grid grid-cols-2 gap-2">
															<div
																className="text-center p-2 rounded bg-opacity-50"
																style={{ backgroundColor: "var(--card-bg)" }}
															>
																<div
																	className="text-sm font-bold"
																	style={{ color: "var(--success-dark)" }}
																>
																	{formatPackage((stats as any).median)}
																</div>
																<p
																	className="text-xs"
																	style={{ color: "var(--label-color)" }}
																>
																	Median
																</p>
															</div>
															<div
																className="text-center p-2 rounded bg-opacity-50"
																style={{ backgroundColor: "var(--card-bg)" }}
															>
																<div
																	className="text-sm font-bold"
																	style={{ color: "var(--success-dark)" }}
																>
																	{formatPackage((stats as any).highest)}
																</div>
																<p
																	className="text-xs"
																	style={{ color: "var(--label-color)" }}
																>
																	Highest
																</p>
															</div>
														</div>
													</div>

													{/* Desktop/Tablet Layout (sm and above) - Compact */}
													<div className="hidden sm:block">
														<div className="flex items-center justify-between mb-3">
															<div className="flex items-center gap-3">
																<div
																	className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
																	style={{
																		backgroundColor: "var(--accent-color)",
																	}}
																>
																	{branch.charAt(0)}
																</div>
																<div>
																	<h3
																		className="font-bold text-lg"
																		style={{ color: "var(--text-color)" }}
																	>
																		{branch}
																	</h3>
																	<p
																		className="text-xs"
																		style={{ color: "var(--label-color)" }}
																	>
																		{(stats as any).count} students placed
																	</p>
																</div>
															</div>
															<Badge
																variant="secondary"
																className="px-2 py-1 text-xs font-semibold"
																style={{
																	backgroundColor: "var(--accent-color)",
																	color: "white",
																}}
															>
																{(stats as any).count}
															</Badge>
														</div>

														<div className="space-y-2">
															<div className="flex justify-between items-center">
																<span
																	className="text-sm"
																	style={{ color: "var(--label-color)" }}
																>
																	Average:
																</span>
																<span
																	className="font-bold text-sm"
																	style={{ color: "var(--success-dark)" }}
																>
																	{formatPackage((stats as any).avgPackage)}
																</span>
															</div>
															<div className="flex justify-between items-center">
																<span
																	className="text-sm"
																	style={{ color: "var(--label-color)" }}
																>
																	Median:
																</span>
																<span
																	className="font-bold text-sm"
																	style={{ color: "var(--success-dark)" }}
																>
																	{formatPackage((stats as any).median)}
																</span>
															</div>
															<div className="flex justify-between items-center">
																<span
																	className="text-sm"
																	style={{ color: "var(--label-color)" }}
																>
																	Highest:
																</span>
																<span
																	className="font-bold text-sm"
																	style={{ color: "var(--success-dark)" }}
																>
																	{formatPackage((stats as any).highest)}
																</span>
															</div>
														</div>
													</div>
												</CardContent>
											</Card>

											<DialogContent className="w-full sm:w-[95vw] md:w-[98vw] lg:w-screen sm:max-w-[95vw] md:max-w-[98vw] lg:max-w-screen max-h-[95vh] sm:rounded-lg overflow-hidden">
												<DialogHeader className="pb-2 sm:pb-4">
													{/* Mobile Header - Compact */}
													<div className="sm:hidden">
														<DialogTitle
															className="text-lg font-bold flex items-center gap-2"
															style={{ color: "var(--text-color)" }}
														>
															<div
																className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
																style={{
																	backgroundColor: "var(--accent-color)",
																}}
															>
																{branch.charAt(0)}
															</div>
															{branch} Details
														</DialogTitle>
														<p
															className="text-xs mt-1"
															style={{ color: "var(--label-color)" }}
														>
															{(stats as any).count} students • Avg:{" "}
															{formatPackage((stats as any).avgPackage)}
														</p>
													</div>

													{/* Desktop Header */}
													<div className="hidden sm:block">
														<DialogTitle
															className="text-xl sm:text-2xl font-bold flex items-center gap-3"
															style={{ color: "var(--text-color)" }}
														>
															<div
																className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold"
																style={{
																	backgroundColor: "var(--accent-color)",
																}}
															>
																{branch.charAt(0)}
															</div>
															{branch} - Detailed Analytics
														</DialogTitle>
														<p
															className="text-sm sm:text-base mt-2"
															style={{ color: "var(--label-color)" }}
														>
															Comprehensive breakdown of placement statistics
															and student data
														</p>
													</div>
												</DialogHeader>
												<div className="mt-1 sm:mt-2 space-y-4 sm:space-y-6 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
													{/* Enhanced Branch Summary */}
													<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
														<div
															className="border rounded-lg p-2 sm:p-4 text-center card-theme"
															style={{
																backgroundColor: "var(--primary-color)",
																borderColor: "var(--border-color)",
															}}
														>
															<div
																className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2"
																style={{ color: "var(--text-color)" }}
															>
																{(stats as any).count}
															</div>
															<p
																className="text-xs sm:text-sm font-medium"
																style={{ color: "var(--label-color)" }}
															>
																Students
															</p>
														</div>
														<div
															className="border rounded-lg p-2 sm:p-4 text-center card-theme"
															style={{
																backgroundColor: "var(--primary-color)",
																borderColor: "var(--border-color)",
															}}
														>
															<div
																className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2"
																style={{ color: "var(--success-dark)" }}
															>
																{formatPackage((stats as any).avgPackage)}
															</div>
															<p
																className="text-xs sm:text-sm font-medium"
																style={{ color: "var(--label-color)" }}
															>
																Average
															</p>
														</div>
														<div
															className="border rounded-lg p-2 sm:p-4 text-center card-theme"
															style={{
																backgroundColor: "var(--primary-color)",
																borderColor: "var(--border-color)",
															}}
														>
															<div
																className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2"
																style={{ color: "var(--success-dark)" }}
															>
																{formatPackage((stats as any).median)}
															</div>
															<p
																className="text-xs sm:text-sm font-medium"
																style={{ color: "var(--label-color)" }}
															>
																Median
															</p>
														</div>
														<div
															className="border rounded-lg p-2 sm:p-4 text-center card-theme"
															style={{
																backgroundColor: "var(--primary-color)",
																borderColor: "var(--border-color)",
															}}
														>
															<div
																className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2"
																style={{ color: "var(--success-dark)" }}
															>
																{formatPackage((stats as any).highest)}
															</div>
															<p
																className="text-xs sm:text-sm font-medium"
																style={{ color: "var(--label-color)" }}
															>
																Highest
															</p>
														</div>
													</div>

													{/* Subgroup stats with improved mobile layout - only show if there's data */}
													{(() => {
														const students = getBranchStudents(branch);
														const calc = (
															filterFn: (s: any) => boolean
														) => {
															const list = students.filter(filterFn);
															const pkgs = list
																.map((s) => {
																	const plc = s.placement
																		? (s.placement as Placement)
																		: (placements.find(
																				(p) => p.company === s.company
																		  ) as Placement);
																	return getStudentPackage(s, plc);
																})
																.filter((n): n is number => !!n && n > 0);
															const avg = pkgs.length
																? pkgs.reduce((a, c) => a + c, 0) /
																  pkgs.length
																: 0;
															const sorted = [...pkgs].sort(
																(a, b) => a - b
															);
															const median = sorted.length
																? sorted.length % 2 === 0
																	? (sorted[sorted.length / 2 - 1] +
																			sorted[sorted.length / 2]) /
																	  2
																	: sorted[Math.floor(sorted.length / 2)]
																: 0;
															return { count: list.length, avg, median };
														};

														const cards: Array<{
															title: string;
															subtitle: string;
															info: {
																count: number;
																avg: number;
																median: number;
															};
														}> = [];
														if (branch === "CSE" || branch === "ECE") {
															const ranges =
																(enrollmentRanges as any)[branch] || {};
															const r62 = ranges["62"] as
																| { start: number; end: number }
																| undefined;
															const r128 = ranges["128"] as
																| { start: number; end: number }
																| undefined;
															if (r62) {
																cards.push({
																	title: `${branch} - 62`,
																	subtitle: "Batch of 62 students",
																	info: calc((s) => {
																		const n = Number(s.enrollment_number);
																		return (
																			Number.isFinite(n) &&
																			n >= r62.start &&
																			n < r62.end
																		);
																	}),
																});
															}
															if (r128) {
																cards.push({
																	title: `${branch} - 128`,
																	subtitle: "Batch of 128 students",
																	info: calc((s) => {
																		const n = Number(s.enrollment_number);
																		return (
																			Number.isFinite(n) &&
																			n >= r128.start &&
																			n < r128.end
																		);
																	}),
																});
															}
														} else if (branch === "Intg. MTech") {
															cards.push({
																title: "Intg. MTech - CSE",
																subtitle: "Computer Science Engineering",
																info: calc((s) => {
																	const n = Number(s.enrollment_number);
																	const { CSE } =
																		(enrollmentRanges as any)[
																			"Intg. MTech"
																		] || {};
																	return (
																		CSE && n >= CSE.start && n < CSE.end
																	);
																}),
															});
															cards.push({
																title: "Intg. MTech - ECE",
																subtitle: "Electronics & Communication",
																info: calc((s) => {
																	const n = Number(s.enrollment_number);
																	const { ECE } =
																		(enrollmentRanges as any)[
																			"Intg. MTech"
																		] || {};
																	return (
																		ECE && n >= ECE.start && n < ECE.end
																	);
																}),
															});
															cards.push({
																title: "Intg. MTech - BT",
																subtitle: "Biotechnology",
																info: calc((s) => {
																	const n = Number(s.enrollment_number);
																	const { BT } =
																		(enrollmentRanges as any)[
																			"Intg. MTech"
																		] || {};
																	return BT && n >= BT.start && n < BT.end;
																}),
															});
														}

														// Only render the section if there are cards to show
														return cards.length > 0 ? (
															<div>
																<h3
																	className="text-base sm:text-lg font-bold mb-2 sm:mb-4 flex items-center gap-2"
																	style={{ color: "var(--text-color)" }}
																>
																	<TrendingUp
																		className="w-4 h-4 sm:w-5 sm:h-5"
																		style={{ color: "var(--accent-color)" }}
																	/>
																	Branch Specializations
																</h3>
																<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
																	{cards.map(({ title, subtitle, info }, i) => (
																		<Card
																			key={i}
																			className="border card-theme overflow-hidden"
																			style={{
																				backgroundColor: "var(--primary-color)",
																				borderColor: "var(--border-color)",
																			}}
																		>
																			<CardContent className="p-4">
																				<div className="flex items-center justify-between mb-3">
																					<div>
																						<h4
																							className="font-bold text-sm sm:text-base"
																							style={{
																								color: "var(--text-color)",
																							}}
																						>
																							{title}
																						</h4>
																						<p
																							className="text-xs"
																							style={{
																								color: "var(--label-color)",
																							}}
																						>
																							{subtitle}
																						</p>
																					</div>
																					<Badge
																						variant="secondary"
																						className="text-sm font-bold px-3 py-1"
																						style={{
																							backgroundColor:
																								"var(--accent-color)",
																							color: "white",
																						}}
																					>
																						{info.count}
																					</Badge>
																				</div>
																				<div className="space-y-2">
																					<div className="flex justify-between items-center">
																						<span
																							className="text-sm"
																							style={{
																								color: "var(--label-color)",
																							}}
																						>
																							Average:
																						</span>
																						<span
																							className="font-bold text-sm"
																							style={{
																								color: "var(--success-dark)",
																							}}
																						>
																							{formatPackage(info.avg)}
																						</span>
																					</div>
																					<div className="flex justify-between items-center">
																						<span
																							className="text-sm"
																							style={{
																								color: "var(--label-color)",
																							}}
																						>
																							Median:
																						</span>
																						<span
																							className="font-bold text-sm"
																							style={{
																								color: "var(--success-dark)",
																							}}
																						>
																							{formatPackage(info.median)}
																						</span>
																					</div>
																				</div>
																			</CardContent>
																		</Card>
																	))}
																</div>
															</div>
														) : null;
													})()}

													{/* Student list with improved mobile design */}
													<div className="flex-1 overflow-hidden">
														<div className="flex items-center justify-between mb-4">
															<h3
																className="text-lg font-bold flex items-center gap-2"
																style={{ color: "var(--text-color)" }}
															>
																<Users
																	className="w-5 h-5"
																	style={{ color: "var(--accent-color)" }}
																/>
																Student Details
															</h3>
															<Badge
																variant="outline"
																className="text-sm"
																style={{
																	borderColor: "var(--border-color)",
																	color: "var(--text-color)",
																}}
															>
																{getBranchStudents(branch).length} students
															</Badge>
														</div>

														<div className="overflow-auto max-h-96">
															<div className="hidden sm:block">
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
																				Company
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
																				Joining Date
																			</TableHead>
																		</TableRow>
																	</TableHeader>
																	<TableBody>
																		{getBranchStudents(branch).map(
																			(student, idx) => (
																				<TableRow key={idx}>
																					<TableCell
																						style={{
																							color: "var(--text-color)",
																						}}
																					>
																						{student.name}
																					</TableCell>
																					<TableCell
																						style={{
																							color: "var(--label-color)",
																						}}
																					>
																						{student.enrollment_number}
																					</TableCell>
																					<TableCell
																						style={{
																							color: "var(--label-color)",
																						}}
																					>
																						{student.email ||
																							`${student.enrollment_number}@${
																								/[A-Za-z]/.test(
																									student.enrollment_number ||
																										""
																								)
																									? "mail.juit.ac.in"
																									: "mail.jiit.ac.in"
																							}`}
																					</TableCell>
																					<TableCell
																						style={{
																							color: "var(--label-color)",
																						}}
																					>
																						{student.company}
																					</TableCell>
																					<TableCell
																						style={{
																							color: "var(--label-color)",
																						}}
																					>
																						{student.role || "N/A"}
																					</TableCell>
																					<TableCell
																						style={{
																							color: "var(--success-dark)",
																						}}
																					>
																						{(() => {
																							const plc = student.placement
																								? (student.placement as Placement)
																								: (placements.find(
																										(p) =>
																											p.company ===
																											student.company
																								  ) as Placement);
																							const pkg = getStudentPackage(
																								student,
																								plc
																							);
																							return pkg
																								? formatPackage(pkg)
																								: "TBD";
																						})()}
																					</TableCell>
																					<TableCell
																						style={{
																							color: "var(--label-color)",
																						}}
																					>
																						{formatDate(
																							student.joining_date || ""
																						)}
																					</TableCell>
																				</TableRow>
																			)
																		)}
																	</TableBody>
																</Table>
															</div>

															{/* Enhanced Mobile list */}
															<div className="space-y-3 sm:hidden">
																{getBranchStudents(branch).map(
																	(student, idx) => (
																		<div
																			key={idx}
																			className="border rounded-xl p-4 card-theme"
																			style={{
																				backgroundColor: "var(--primary-color)",
																				borderColor: "var(--border-color)",
																			}}
																		>
																			<div className="flex items-start justify-between mb-3">
																				<div className="flex-1">
																					<h4
																						className="font-bold text-base"
																						style={{
																							color: "var(--text-color)",
																						}}
																					>
																						{student.name}
																					</h4>
																					<p
																						className="text-sm font-mono"
																						style={{
																							color: "var(--label-color)",
																						}}
																					>
																						{student.enrollment_number}
																					</p>
																				</div>
																				<div className="text-right">
																					<div
																						className="text-lg font-bold"
																						style={{
																							color: "var(--success-dark)",
																						}}
																					>
																						{(() => {
																							const plc = student.placement
																								? (student.placement as Placement)
																								: (placements.find(
																										(p) =>
																											p.company ===
																											student.company
																								  ) as Placement);
																							const pkg = getStudentPackage(
																								student,
																								plc
																							);
																							return pkg
																								? formatPackage(pkg)
																								: "TBD";
																						})()}
																					</div>
																				</div>
																			</div>

																			<div className="space-y-2">
																				<div className="flex items-center gap-2">
																					<Building
																						className="w-4 h-4"
																						style={{
																							color: "var(--accent-color)",
																						}}
																					/>
																					<span
																						className="font-semibold text-sm"
																						style={{
																							color: "var(--text-color)",
																						}}
																					>
																						{student.company}
																					</span>
																				</div>
																				<div className="flex items-center gap-2">
																					<GraduationCap
																						className="w-4 h-4"
																						style={{
																							color: "var(--accent-color)",
																						}}
																					/>
																					<span
																						className="text-sm"
																						style={{
																							color: "var(--label-color)",
																						}}
																					>
																						{student.role || "N/A"}
																					</span>
																				</div>
																				{student.joining_date && (
																					<div className="flex items-center gap-2">
																						<Calendar
																							className="w-4 h-4"
																							style={{
																								color: "var(--accent-color)",
																							}}
																						/>
																						<span
																							className="text-sm"
																							style={{
																								color: "var(--label-color)",
																							}}
																						>
																							{formatDate(student.joining_date)}
																						</span>
																					</div>
																				)}
																			</div>
																		</div>
																	)
																)}
															</div>
														</div>
													</div>
												</div>
											</DialogContent>
										</Dialog>
									));
								})()}
								</div>
								
								{/* Show More Button */}
								{Object.entries(branchStats).length > BRANCHES_LIMIT && (
									<div className="text-center mt-6">
										<Button
											variant="outline"
											onClick={() => setShowAllBranches(!showAllBranches)}
											style={{
												borderColor: "var(--border-color)",
												color: "var(--text-color)",
											}}
											className="hover-theme"
										>
											{showAllBranches ? (
												<>
													<ChevronUp className="w-4 h-4 mr-2" />
													Show Less Branches
												</>
											) : (
												<>
													<ChevronDown className="w-4 h-4 mr-2" />
													Show All {Object.entries(branchStats).length} Branches
												</>
											)}
										</Button>
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>

				{/* Company-wise Statistics */}
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
							{companiesToShow.map(([company, stats]: [string, any]) => (
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
											{/* Desktop / tablet: keep table layout for sm and above */}
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
																	{student.email ||
																		`${student.enrollment_number}@${
																			/[A-Za-z]/.test(
																				student.enrollment_number || ""
																			)
																				? "mail.juit.ac.in"
																				: "mail.jiit.ac.in"
																		}`}
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
																			? getStudentPackage(student, placement)
																			: student.package;
																		return packageValue
																			? formatPackage(packageValue)
																			: "TBD";
																	})()}
																</TableCell>
																<TableCell
																	style={{ color: "var(--label-color)" }}
																>
																	{student.job_location?.join(", ") || "N/A"}
																</TableCell>
																<TableCell
																	style={{ color: "var(--label-color)" }}
																>
																	{formatDate(student.joining_date || "")}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>

											{/* Mobile: stacked, readable rows */}
											<div className="space-y-3 sm:hidden flex-1 overflow-auto">
												{getCompanyStudents(company).map((student, idx) => {
													const placement = placements.find(
														(p) => p.company === company
													);
													const packageValue = placement
														? getStudentPackage(student, placement)
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
																		<strong
																			style={{ color: "var(--label-color)" }}
																		>
																			Role:{" "}
																		</strong>
																		{student.role || "N/A"}
																	</div>
																	<div
																		className="text-xs mt-1"
																		style={{ color: "var(--label-color)" }}
																	>
																		<strong
																			style={{ color: "var(--label-color)" }}
																		>
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
											<ChevronUp className="w-4 h-4 mr-2" />
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

				{/* Placed Students Section */}
				<Card className="card-theme">
					<CardHeader className="pb-6">
						<div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
							<CardTitle className="flex items-center gap-3 text-xl">
								<GraduationCap className="w-6 h-6 text-primary" />
								<div>
									<h2 className="text-xl font-bold">Placed Students</h2>
								</div>
								{hasActiveFilters && (
									<Badge variant="secondary" className="ml-auto lg:ml-0">
										{filteredStudents.length} filtered
									</Badge>
								)}
							</CardTitle>

							{/* Enhanced Sorting Controls */}
							<div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
								<div className="flex items-center space-x-3">
									<span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
										Sort by:
									</span>
									<div className="flex items-center space-x-2">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													className="h-10 px-3 justify-between min-w-[140px]"
												>
													{sortKey === "name" && "Name"}
													{sortKey === "package" && "Package"}
													{sortKey === "company" && "Company"}
													{sortKey === "enrollment" && "Enrollment"}
													{sortKey === "role" && "Role"}
													{sortKey === "joining_date" && "Joining Date"}
													<ChevronDown className="w-4 h-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent className="w-[140px]">
												<DropdownMenuLabel className="font-semibold">
													Sort by
												</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuCheckboxItem
													checked={sortKey === "name"}
													onCheckedChange={() => setSortKey("name")}
												>
													Name
												</DropdownMenuCheckboxItem>
												<DropdownMenuCheckboxItem
													checked={sortKey === "package"}
													onCheckedChange={() => setSortKey("package")}
												>
													Package
												</DropdownMenuCheckboxItem>
												<DropdownMenuCheckboxItem
													checked={sortKey === "company"}
													onCheckedChange={() => setSortKey("company")}
												>
													Company
												</DropdownMenuCheckboxItem>
												<DropdownMenuCheckboxItem
													checked={sortKey === "enrollment"}
													onCheckedChange={() => setSortKey("enrollment")}
												>
													Enrollment
												</DropdownMenuCheckboxItem>
												<DropdownMenuCheckboxItem
													checked={sortKey === "role"}
													onCheckedChange={() => setSortKey("role")}
												>
													Role
												</DropdownMenuCheckboxItem>
												<DropdownMenuCheckboxItem
													checked={sortKey === "joining_date"}
													onCheckedChange={() => setSortKey("joining_date")}
												>
													Joining Date
												</DropdownMenuCheckboxItem>
											</DropdownMenuContent>
										</DropdownMenu>
										<Button
											variant="outline"
											size="icon"
											onClick={() =>
												setSortDir((d) => (d === "asc" ? "desc" : "asc"))
											}
											className={cn(
												"h-10 w-10 transition-all",
												sortDir === "asc"
													? "bg-primary text-primary-foreground hover:bg-primary/90"
													: "hover:bg-muted"
											)}
											title={`Currently: ${
												sortDir === "asc" ? "Ascending" : "Descending"
											}. Click to toggle.`}
										>
											{sortDir === "asc" ? "↑" : "↓"}
										</Button>
									</div>
								</div>
								<Button
									variant="outline"
									onClick={() => setShowStudentList(!showStudentList)}
									className="h-10 px-4"
								>
									{showStudentList ? (
										<>
											<EyeOff className="w-4 h-4 mr-2" />
											Hide List
										</>
									) : (
										<>
											<Eye className="w-4 h-4 mr-2" />
											View All Students
										</>
									)}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{showStudentList ? (
							<div className="space-y-4">
								{/* Sorting indicator */}
								{showStudentList && filteredStudents.length > 0 && (
									<div
										className="flex items-center justify-between mb-4 pb-3 border-b"
										style={{ borderColor: "var(--border-color)" }}
									>
										<div className="flex items-center space-x-2">
											<span
												className="text-sm font-medium"
												style={{ color: "var(--text-color)" }}
											>
												Currently sorted by:
											</span>
											<Badge
												variant="outline"
												className="px-3 py-1"
												style={{
													backgroundColor: "var(--accent-color)",
													borderColor: "var(--accent-color)",
													color: "white",
												}}
											>
												{sortKey.charAt(0).toUpperCase() +
													sortKey.slice(1).replace("_", " ")}{" "}
												{sortDir === "asc" ? "↑" : "↓"}
											</Badge>
										</div>
										<span
											className="text-sm font-medium"
											style={{ color: "var(--text-color)" }}
										>
											{filteredStudents.length} students
										</span>
									</div>
								)}

								{filteredStudents.length > 0 ? (
									sortStudentsList(
										filteredStudents.map((student) => ({
											...student,
											company: student.company,
											placement: student.placement,
											joining_date: student.joining_date,
											job_location: student.job_location,
										}))
									).map((student, studentIndex) => (
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
															{student.roles?.map((role, roleIndex) => (
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
																	<MapPin className="w-3 h-3 mr-1" />
																	{student.job_location.join(", ")}
																</div>
															)}
													</div>
													<div className="text-right md:text-left">
														<div className="space-y-1">
															{(() => {
																const packageValue = student.placement
																	? getStudentPackage(
																			student,
																			student.placement
																	  )
																	: null;
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
																<Calendar className="w-3 h-3 mr-1" />
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
