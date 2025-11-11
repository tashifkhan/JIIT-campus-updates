"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Calendar,
	ChevronDown,
	Eye,
	EyeOff,
	MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentWithPlacement, formatDate, formatPackage } from "@/lib/stats";

type SortKey =
	| "name"
	| "package"
	| "company"
	| "joining_date"
	| "enrollment"
	| "role";

type Props = {
	filteredStudents: StudentWithPlacement[];
	totalStudentsPlaced: number;
	filteredHighestPackage: number;
	highestPackage: number;
	filteredAveragePackage: number;
	averagePackage: number;
	filteredUniqueCompanies: number;
	uniqueCompanies: number;
};

export default function PlacedStudentsSection({
	filteredStudents,
	totalStudentsPlaced,
	filteredHighestPackage,
	highestPackage,
	filteredAveragePackage,
	averagePackage,
	filteredUniqueCompanies,
	uniqueCompanies,
}: Props) {
	const [showStudentList, setShowStudentList] = useState(false);
	const [sortKey, setSortKey] = useState<SortKey>("name");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

	// Helper function to get the correct package value
	const getStudentPackage = (student: StudentWithPlacement): number => {
		// If student has a package, use it
		if (student.package != null) {
			return student.package;
		}

		// Otherwise, try to get package from the matching role in placement
		if (student.placement && student.role) {
			const matchingRole = student.placement.roles.find(
				(r) => r.role === student.role
			);
			if (matchingRole?.package != null) {
				return matchingRole.package;
			}
		}

		// Fallback to the highest package in placement roles
		if (student.placement) {
			const packages = student.placement.roles
				.filter((r) => r.package != null)
				.map((r) => r.package as number);
			if (packages.length > 0) {
				return Math.max(...packages);
			}
		}

		return 0;
	};

	const sortStudentsList = (students: StudentWithPlacement[]) => {
		const list = [...students];
		list.sort((a, b) => {
			const dir = sortDir === "asc" ? 1 : -1;
			if (sortKey === "name")
				return (a.name || "").localeCompare(b.name || "") * dir;
			if (sortKey === "company")
				return (a.company || "").localeCompare(b.company || "") * dir;
			if (sortKey === "enrollment")
				return (
					(a.enrollment_number || "").localeCompare(b.enrollment_number || "") *
					dir
				);
			if (sortKey === "role")
				return (a.role || "").localeCompare(b.role || "") * dir;
			if (sortKey === "joining_date") {
				const da = a.joining_date ? new Date(a.joining_date).getTime() : 0;
				const db = b.joining_date ? new Date(b.joining_date).getTime() : 0;
				return (da - db) * dir;
			}
			const pa = getStudentPackage(a);
			const pb = getStudentPackage(b);
			return (pa - pb) * dir;
		});
		return list;
	};

	return (
		<Card className="card-theme">
			<CardHeader className="pb-6">
				<div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
					<CardTitle className="flex items-center gap-3 text-xl">
						<div>
							<h2 className="text-xl font-bold">Placed Students</h2>
						</div>
						{filteredStudents.length !== totalStudentsPlaced && (
							<Badge variant="secondary" className="ml-auto lg:ml-0">
								{filteredStudents.length} filtered
							</Badge>
						)}
					</CardTitle>

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
							sortStudentsList(filteredStudents).map((student, idx) => (
								<Card
									key={`${student.enrollment_number}-${idx}`}
									className="border card-theme"
									style={{
										backgroundColor: "var(--primary-color)",
										borderColor: "var(--border-color)",
									}}
								>
									<CardContent className="p-3 sm:p-4">
										<div className="flex flex-col space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:space-y-0">
											<div className="order-1">
												<h3
													className="font-semibold text-sm sm:text-base"
													style={{ color: "var(--text-color)" }}
												>
													{student.name}
												</h3>
												<p
													className="text-xs sm:text-sm"
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
											<div className="order-2">
												<p
													className="font-medium text-sm sm:text-base"
													style={{ color: "var(--text-color)" }}
												>
													{student.company}
												</p>
												<div className="text-xs sm:text-sm space-y-1">
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
											<div className="order-3 flex justify-between items-start sm:block sm:text-left">
												<div className="space-y-1">
													<p
														className="font-semibold text-sm"
														style={{ color: "var(--success-dark)" }}
													>
														{formatPackage(getStudentPackage(student))}
													</p>
												</div>
												{student.joining_date && (
													<div
														className="flex items-center text-xs mt-1"
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
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
