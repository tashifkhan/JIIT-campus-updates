"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStatsData } from "@/lib/hooks/useStatsData";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	ArrowLeftIcon,
	Search,
	Users,
	MapPin,
	Building2,
	ArrowUp,
	ArrowDown,
	ArrowUpDown,
} from "lucide-react";
import { Placement, formatPackage, StudentWithPlacement } from "@/lib/stats";
import React from "react";

// Reusing helper function for calculating package
const pkgFrom = (s: StudentWithPlacement, p: Placement) => {
	if (s.package != null) return s.package;
	if (s.role && p.roles) {
		const r = p.roles.find((x) => x.role === s.role);
		if (r && r.package) return r.package;
	}
	const viable = p.roles?.filter((r) => r.package != null) || [];
	return viable.length
		? Math.max(...viable.map((r) => r.package as number))
		: 0;
};

export default function CompanyStatsPage({
	params,
}: {
	params: Promise<{ company: string }>;
}) {
	const { company } = React.use(params);
	const decodedCompany = decodeURIComponent(company);
	const router = useRouter();

	const { placements, allStudents } = useStatsData();

	// Calculate company stats
	// We need to filter allStudents by company
	const students = allStudents
		.filter((s) => s.company === decodedCompany)
		.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

	const placement = placements.find((p) => p.company === decodedCompany);

	// Fallback package calculation logic
	const fallbackPackage = (() => {
		if (!placement) return 0;
		const viable = placement.roles.filter((r) => r.package != null);
		return viable.length
			? Math.max(...viable.map((r) => r.package as number))
			: 0;
	})();

	const getStudentPkg = (s: StudentWithPlacement) => {
		if (s.package != null) return s.package;
		if (placement && s.role) {
			const r = placement.roles.find((x) => x.role === s.role);
			if (r && r.package) return r.package;
		}
		return fallbackPackage;
	};

	const avgPackage = (() => {
		const pkgs: number[] = [];
		students.forEach((s) => {
			const v = getStudentPkg(s);
			if (v > 0) pkgs.push(v);
		});
		// If we have individual packages, average them, otherwise use fallback
		if (pkgs.length > 0) return pkgs.reduce((a, b) => a + b, 0) / pkgs.length;
		return fallbackPackage;
	})();

	const uniqueLocations = Array.from(
		new Set(
			students
				.flatMap((s) => s.job_location)
				.filter(Boolean)
				.map((l) => (l || "").trim()),
		),
	).filter((l) => l.length > 0);

	// Local state for list
	const [query, setQuery] = useState("");
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	} | null>(null);

	const handleSort = (key: string) => {
		let direction: "asc" | "desc" = "asc";
		if (
			sortConfig &&
			sortConfig.key === key &&
			sortConfig.direction === "asc"
		) {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	const filteredList = (() => {
		let displayedStudents = students;

		if (query) {
			const q = query.toLowerCase();
			displayedStudents = displayedStudents.filter(
				(s) =>
					s.name.toLowerCase().includes(q) ||
					(s.enrollment_number || "").toLowerCase().includes(q) ||
					(s.role || "").toLowerCase().includes(q) ||
					(s.job_location || []).join(" ").toLowerCase().includes(q),
			);
		}

		if (sortConfig) {
			displayedStudents = [...displayedStudents].sort((a, b) => {
				if (sortConfig.key === "package") {
					const pkgA = getStudentPkg(a);
					const pkgB = getStudentPkg(b);
					return sortConfig.direction === "asc"
						? (pkgA || 0) - (pkgB || 0)
						: (pkgB || 0) - (pkgA || 0);
				}
				const valA = (a as any)[sortConfig.key] || "";
				const valB = (b as any)[sortConfig.key] || "";
				return sortConfig.direction === "asc"
					? String(valA).localeCompare(String(valB))
					: String(valB).localeCompare(String(valA));
			});
		}
		return displayedStudents;
	})();

	return (
		<div className="min-h-screen bg-background pb-12">
			{/* Top Navigation */}
			<div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
				<div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
					<Button
						variant="ghost"
						onClick={() => router.back()}
						className="hover:bg-accent/50 -ml-2"
					>
						<ArrowLeftIcon className="w-5 h-5 mr-2 text-muted-foreground" />
						<span className="text-muted-foreground font-medium">Back</span>
					</Button>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 pt-8">
				<div className="mb-8">
					<div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
						<div className="flex-1">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
									<Building2 className="w-6 h-6" />
								</div>
								<h1 className="text-3xl font-bold text-foreground">
									{decodedCompany}
								</h1>
							</div>

							{uniqueLocations.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-3">
									{uniqueLocations.map((loc, i) => (
										<Badge
											key={i}
											variant="outline"
											className="rounded-full px-3 py-0.5 border-border/60 text-muted-foreground font-normal"
										>
											<MapPin className="w-3 h-3 mr-1" />
											{loc}
										</Badge>
									))}
								</div>
							)}
						</div>

						<div className="flex gap-4">
							<div className="border rounded-xl p-4 card-theme bg-card shadow-sm min-w-[140px]">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
									Total Placed
								</p>
								<div className="flex items-center gap-2">
									<Users className="w-4 h-4 text-primary" />
									<span className="text-2xl font-bold text-foreground">
										{students.length}
									</span>
								</div>
							</div>

							<div className="border rounded-xl p-4 card-theme bg-card shadow-sm min-w-[140px]">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
									Avg Package
								</p>
								<div className="flex items-center gap-2">
									<span className="text-2xl font-bold text-foreground">
										{formatPackage(avgPackage)}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Students List */}
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
								<Users className="w-5 h-5 text-primary" />
								Student Details
								<Badge variant="secondary" className="ml-2">
									{filteredList.length} results
								</Badge>
							</h3>
							<div className="relative w-full sm:w-72">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Search className="h-4 w-4 text-muted-foreground" />
								</div>
								<Input
									placeholder="Search name, role, location..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="pl-10 h-10 bg-background"
								/>
							</div>
						</div>

						{/* Desktop Table */}
						<div className="hidden sm:block border rounded-xl overflow-hidden bg-card shadow-sm">
							<Table>
								<TableHeader className="bg-muted/30">
									<TableRow className="hover:bg-transparent">
										<TableHead
											className="cursor-pointer hover:text-primary transition-colors h-12 group"
											onClick={() => handleSort("name")}
										>
											<div className="flex items-center">
												Name
												{sortConfig?.key === "name" ? (
													sortConfig.direction === "asc" ? (
														<ArrowUp className="ml-1 h-4 w-4" />
													) : (
														<ArrowDown className="ml-1 h-4 w-4" />
													)
												) : (
													<ArrowUpDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100" />
												)}
											</div>
										</TableHead>
										<TableHead
											className="cursor-pointer hover:text-primary transition-colors h-12 group"
											onClick={() => handleSort("enrollment_number")}
										>
											<div className="flex items-center">
												Enrollment
												{sortConfig?.key === "enrollment_number" ? (
													sortConfig.direction === "asc" ? (
														<ArrowUp className="ml-1 h-4 w-4" />
													) : (
														<ArrowDown className="ml-1 h-4 w-4" />
													)
												) : (
													<ArrowUpDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100" />
												)}
											</div>
										</TableHead>
										<TableHead
											className="cursor-pointer hover:text-primary transition-colors h-12 group"
											onClick={() => handleSort("role")}
										>
											<div className="flex items-center">
												Role
												{sortConfig?.key === "role" ? (
													sortConfig.direction === "asc" ? (
														<ArrowUp className="ml-1 h-4 w-4" />
													) : (
														<ArrowDown className="ml-1 h-4 w-4" />
													)
												) : (
													<ArrowUpDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100" />
												)}
											</div>
										</TableHead>
										<TableHead
											className="cursor-pointer hover:text-primary transition-colors h-12 text-right group"
											onClick={() => handleSort("package")}
										>
											<div className="flex items-center justify-end">
												Package
												{sortConfig?.key === "package" ? (
													sortConfig.direction === "asc" ? (
														<ArrowUp className="ml-1 h-4 w-4" />
													) : (
														<ArrowDown className="ml-1 h-4 w-4" />
													)
												) : (
													<ArrowUpDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100" />
												)}
											</div>
										</TableHead>
										<TableHead
											className="cursor-pointer hover:text-primary transition-colors h-12 group"
											onClick={() => handleSort("job_location")}
										>
											<div className="flex items-center">
												Location
												{sortConfig?.key === "job_location" ? (
													sortConfig.direction === "asc" ? (
														<ArrowUp className="ml-1 h-4 w-4" />
													) : (
														<ArrowDown className="ml-1 h-4 w-4" />
													)
												) : (
													<ArrowUpDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100" />
												)}
											</div>
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredList.map((student, idx) => (
										<TableRow
											key={idx}
											className="hover:bg-muted/30 transition-colors"
										>
											<TableCell className="font-semibold text-foreground py-3">
												{student.name}
											</TableCell>
											<TableCell className="text-muted-foreground font-mono text-xs py-3">
												{student.enrollment_number}
											</TableCell>
											<TableCell className="text-muted-foreground py-3">
												{student.role || "N/A"}
											</TableCell>
											<TableCell className="text-right py-3">
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
													{(() => {
														const pkg = getStudentPkg(student);
														return pkg ? formatPackage(pkg) : "TBD";
													})()}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground py-3">
												{student.job_location?.join(", ") || "N/A"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Mobile List */}
						<div className="sm:hidden space-y-3">
							{filteredList.map((student, idx) => (
								<div
									key={idx}
									className="border rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-shadow"
								>
									<div className="flex justify-between items-start mb-3">
										<div>
											<h4 className="font-bold text-foreground">
												{student.name}
											</h4>
											<p className="text-xs text-muted-foreground font-mono mt-0.5">
												{student.enrollment_number}
											</p>
										</div>
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
											{(() => {
												const pkg = getStudentPkg(student);
												return pkg ? formatPackage(pkg) : "TBD";
											})()}
										</span>
									</div>
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>
											<span className="text-xs text-muted-foreground block mb-0.5">
												Role
											</span>
											<span className="font-medium">
												{student.role || "N/A"}
											</span>
										</div>
										<div className="text-right">
											<span className="text-xs text-muted-foreground block mb-0.5">
												Location
											</span>
											<span className="font-medium">
												{student.job_location?.join(", ") || "N/A"}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
