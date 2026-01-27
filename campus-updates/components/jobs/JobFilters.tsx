"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, Search } from "lucide-react";
import { Job } from "./types";
import { categoryMapping, getCategoryClass } from "./helpers";

type Props = {
	jobs: Job[];
	values: {
		query: string;
		selectedCategories: number[];
		selectedLocations: string[];
		selectedGenders: string[];
		selectedCourses: string[];
		minPackageLpa: number;
		cgpaRange: [number, number];
		cgpaInputMin: string;
		cgpaInputMax: string;
		openOnly: boolean;
	};
	onChange: {
		setQuery: (v: string) => void;
		setSelectedCategories: (updater: (prev: number[]) => number[]) => void;
		setSelectedLocations: (updater: (prev: string[]) => string[]) => void;
		setSelectedGenders: (updater: (prev: string[]) => string[]) => void;
		setSelectedCourses: (updater: (prev: string[]) => string[]) => void;
		setMinPackageLpa: (v: number) => void;
		setCgpaRange: (v: [number, number]) => void;
		setCgpaInputMin: (v: string) => void;
		setCgpaInputMax: (v: string) => void;
		setOpenOnly: (v: boolean) => void;
		clearFilters: () => void;
	};
	derived: {
		maxPackageLpa: number;
		maxCgpa: number;
		resultsCount: number;
	};
};

export function JobFilters({ jobs, values, onChange, derived }: Props) {
	const [showFilters, setShowFilters] = useState(false);
	const unique = <T,>(arr: T[]) => Array.from(new Set(arr));
	const allLocations = useMemo(
		() => unique(jobs.map((j) => j.location).filter(Boolean)).sort(),
		[jobs],
	);
	const allCategories = useMemo(
		() =>
			unique(jobs.map((j) => j.placement_category_code)).sort((a, b) => a - b),
		[jobs],
	);
	const allGenders = useMemo(
		() => unique(jobs.flatMap((j) => j.allowed_genders || [])).sort(),
		[jobs],
	);
	const allCourses = useMemo(
		() => unique(jobs.flatMap((j) => j.eligibility_courses || [])).sort(),
		[jobs],
	);

	const minPackageValue = useMemo(
		() => [values.minPackageLpa],
		[values.minPackageLpa],
	);

	const handleSliderChange = useCallback(
		(v: number[]) => {
			onChange.setMinPackageLpa(v[0] ?? 0);
		},
		[onChange],
	);

	return (
		<div className="mb-6 space-y-4">
			{/* Top Row: Search and Dropdowns */}
			<div className="flex flex-col md:flex-row gap-3">
				<div className="flex flex-1 gap-2">
					{/* Search Bar */}
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by role, company or location"
							value={values.query}
							onChange={(e) => onChange.setQuery(e.target.value)}
							className="pl-9 bg-card border-border/50 focus-visible:ring-primary/20 h-10"
						/>
					</div>

					{/* Mobile Filter Toggle */}
					<Button
						variant="outline"
						size="icon"
						className="md:hidden shrink-0"
						onClick={() => setShowFilters(!showFilters)}
					>
						<ChevronDown
							className={`h-4 w-4 transition-transform ${
								showFilters ? "rotate-180" : ""
							}`}
						/>
					</Button>
				</div>

				{/* Dropdowns */}
				<div
					className={`gap-2 flex-wrap ${
						showFilters ? "flex" : "hidden"
					} md:flex`}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="bg-card border-border/50">
								Category <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56">
							<DropdownMenuLabel>Select categories</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{allCategories.map((code) => (
								<DropdownMenuCheckboxItem
									key={code}
									checked={values.selectedCategories.includes(code)}
									onCheckedChange={(checked) => {
										onChange.setSelectedCategories((prev) =>
											checked
												? [...prev, code]
												: prev.filter((c) => c !== code),
										);
									}}
								>
									<span
										className={`inline-flex items-center px-2 py-0.5 border rounded ${getCategoryClass(
											code,
										)}`}
									>
										{categoryMapping[code] || code}
									</span>
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="bg-card border-border/50">
								Location <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-64 max-h-72 overflow-auto">
							<DropdownMenuLabel>Select locations</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{allLocations.map((loc) => (
								<DropdownMenuCheckboxItem
									key={loc}
									checked={values.selectedLocations.includes(loc)}
									onCheckedChange={(checked) => {
										onChange.setSelectedLocations((prev) =>
											checked ? [...prev, loc] : prev.filter((l) => l !== loc),
										);
									}}
								>
									{loc}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="bg-card border-border/50">
								Gender <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56">
							<DropdownMenuLabel>Select genders</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{allGenders.map((g) => (
								<DropdownMenuCheckboxItem
									key={g}
									checked={values.selectedGenders.includes(g)}
									onCheckedChange={(checked) => {
										onChange.setSelectedGenders((prev) =>
											checked ? [...prev, g] : prev.filter((x) => x !== g),
										);
									}}
								>
									{g}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="bg-card border-border/50">
								Branches <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-72 max-h-80 overflow-auto">
							<DropdownMenuLabel>Select eligible branches</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{allCourses.map((course) => (
								<DropdownMenuCheckboxItem
									key={course}
									checked={values.selectedCourses.includes(course)}
									onCheckedChange={(checked) => {
										onChange.setSelectedCourses((prev) =>
											checked
												? [...prev, course]
												: prev.filter((c) => c !== course),
										);
									}}
								>
									{course}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Bottom Row: Filters */}
			<div
				className={`flex flex-col md:flex-row gap-4 md:items-center justify-between p-4 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm ${
					showFilters ? "flex" : "hidden"
				} md:flex`}
			>
				{/* Package Slider */}
				<div className="space-y-3 min-w-[200px]">
					<div className="flex items-center justify-between text-sm">
						<span className="text-primary/80 font-medium">
							Minimum package (LPA)
						</span>
						<span className="font-bold text-foreground">
							{values.minPackageLpa}+
						</span>
					</div>
					<Slider
						min={0}
						max={Math.max(derived.maxPackageLpa, 1)}
						step={1}
						value={minPackageValue}
						onValueChange={handleSliderChange}
						className="[&>.relative>.absolute]:bg-primary"
					/>
				</div>

				{/* CGPA Range */}
				<div className="flex items-center gap-3">
					<div className="text-sm font-medium text-primary/80 whitespace-nowrap">
						CGPA Range
					</div>
					<Input
						type="number"
						min="0"
						max="10"
						step="0.1"
						value={values.cgpaInputMin}
						onChange={(e) => onChange.setCgpaInputMin(e.target.value)}
						onBlur={(e) => {
							const minVal = Math.max(
								0,
								Math.min(10, parseFloat(e.target.value) || 0),
							);
							onChange.setCgpaRange([
								minVal,
								Math.max(minVal, values.cgpaRange[1]),
							]);
							onChange.setCgpaInputMin(minVal.toFixed(1));
						}}
						className="w-20 h-9 text-sm text-center bg-card border-border/60 rounded-xl"
					/>
					<span className="text-muted-foreground">-</span>
					<Input
						type="number"
						min="0"
						max="10"
						step="0.1"
						value={values.cgpaInputMax}
						onChange={(e) => onChange.setCgpaInputMax(e.target.value)}
						onBlur={(e) => {
							const maxVal = Math.max(
								0,
								Math.min(10, parseFloat(e.target.value) || 10),
							);
							onChange.setCgpaRange([
								Math.min(values.cgpaRange[0], maxVal),
								maxVal,
							]);
							onChange.setCgpaInputMax(maxVal.toFixed(1));
						}}
						className="w-20 h-9 text-sm text-center bg-card border-border/60 rounded-xl"
					/>
				</div>

				{/* Quick CGPA Filters */}
				<div className="flex flex-col gap-1.5">
					<div className="text-xs text-primary/80 font-medium">
						Quick CGPA Filters
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								onChange.setCgpaRange([0.0, 8.0]);
								onChange.setCgpaInputMin("0.0");
								onChange.setCgpaInputMax("8.0");
							}}
							className={`text-xs h-8 px-4 rounded-xl border-dashed ${
								values.cgpaRange[0] === 0.0 && values.cgpaRange[1] === 8.0
									? "border-primary text-primary bg-primary/5"
									: "border-border/60 bg-card text-muted-foreground hover:text-foreground"
							}`}
						>
							0.0 - 8.0
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								onChange.setCgpaRange([0.0, 6.0]);
								onChange.setCgpaInputMin("0.0");
								onChange.setCgpaInputMax("6.0");
							}}
							className={`text-xs h-8 px-4 rounded-xl border-dashed ${
								values.cgpaRange[0] === 0.0 && values.cgpaRange[1] === 6.0
									? "border-primary text-primary bg-primary/5"
									: "border-border/60 bg-card text-muted-foreground hover:text-foreground"
							}`}
						>
							0.0 - 6.0
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								onChange.setCgpaRange([0, 10]);
								onChange.setCgpaInputMin("0.0");
								onChange.setCgpaInputMax("10.0");
							}}
							className={`text-xs h-8 px-4 rounded-xl ${
								values.cgpaRange[0] === 0 && values.cgpaRange[1] === 10
									? "border-yellow-500 text-yellow-500 bg-yellow-500/5"
									: "border-border/60 bg-card text-muted-foreground hover:text-foreground"
							}`}
						>
							All
						</Button>
					</div>
				</div>

				{/* Open Only & Reset & Results */}
				<div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 flex-1 justify-end">
					<div className="flex items-center gap-2">
						<div
							className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
								values.openOnly
									? "border-primary bg-primary/20"
									: "border-muted-foreground bg-transparent"
							}`}
							onClick={() => onChange.setOpenOnly(!values.openOnly)}
						>
							{values.openOnly && (
								<div className="w-2 h-2 rounded-full bg-primary" />
							)}
						</div>
						<span
							className="text-sm cursor-pointer text-muted-foreground select-none"
							onClick={() => onChange.setOpenOnly(!values.openOnly)}
						>
							Show only open postings
							<br />
							<span className="text-xs opacity-70">(deadline in future)</span>
						</span>
					</div>

					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							onClick={onChange.clearFilters}
							className="text-muted-foreground hover:text-foreground hover:bg-transparent px-2"
						>
							Reset
						</Button>
						<Badge
							variant="secondary"
							className="bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 text-sm font-medium rounded-full"
						>
							{derived.resultsCount} results
						</Badge>
					</div>
				</div>
			</div>
		</div>
	);
}

export default JobFilters;
