"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Filter } from "lucide-react";
import { Job } from "./types";
import { categoryMapping, getCategoryColor } from "./helpers";

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
		[jobs]
	);
	const allCategories = useMemo(
		() =>
			unique(jobs.map((j) => j.placement_category_code)).sort((a, b) => a - b),
		[jobs]
	);
	const allGenders = useMemo(
		() => unique(jobs.flatMap((j) => j.allowed_genders || [])).sort(),
		[jobs]
	);
	const allCourses = useMemo(
		() => unique(jobs.flatMap((j) => j.eligibility_courses || [])).sort(),
		[jobs]
	);

	return (
		<Card className="mb-6">
			<CardContent className="p-4 lg:p-6 space-y-4">
				<div className="flex flex-col md:flex-row gap-3 md:items-center">
					<div className="flex-1 flex gap-2">
						<Input
							placeholder="Search by role, company or location"
							value={values.query}
							onChange={(e) => onChange.setQuery(e.target.value)}
						/>
						<Button
							variant="outline"
							size="icon"
							className="md:hidden shrink-0"
							onClick={() => setShowFilters(!showFilters)}
						>
							<Filter className="h-4 w-4" />
						</Button>
					</div>
					<div
						className={`gap-2 flex-wrap ${
							showFilters ? "flex" : "hidden"
						} md:flex`}
					>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="whitespace-nowrap">
									Category
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
													: prev.filter((c) => c !== code)
											);
										}}
									>
										<span
											className="inline-flex items-center px-2 py-0.5 border rounded"
											style={getCategoryColor(code)}
										>
											{categoryMapping[code] || code}
										</span>
									</DropdownMenuCheckboxItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="whitespace-nowrap">
									Location
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
												checked ? [...prev, loc] : prev.filter((l) => l !== loc)
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
								<Button variant="outline" className="whitespace-nowrap">
									Gender
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
												checked ? [...prev, g] : prev.filter((x) => x !== g)
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
								<Button variant="outline" className="whitespace-nowrap">
									Branches
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
													: prev.filter((c) => c !== course)
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

				<div
					className={`grid grid-cols-1 md:grid-cols-5 gap-4 md:items-end ${
						showFilters ? "grid" : "hidden"
					} md:grid`}
				>
					<div className="space-y-2">
						<div
							className="text-sm flex items-center justify-between"
							style={{ color: "var(--label-color)" }}
						>
							<span>Minimum package (LPA)</span>
							<span
								className="font-medium"
								style={{ color: "var(--text-color)" }}
							>
								{values.minPackageLpa}+
							</span>
						</div>
						<Slider
							min={0}
							max={Math.max(derived.maxPackageLpa, 1)}
							step={1}
							value={[values.minPackageLpa]}
							onValueChange={(v) => onChange.setMinPackageLpa(v[0] ?? 0)}
						/>
					</div>

					<div className="space-y-2">
						<div
							className="text-sm flex items-center justify-between"
							style={{ color: "var(--label-color)" }}
						>
							<span>CGPA Range</span>
							<span
								className="font-medium"
								style={{ color: "var(--text-color)" }}
							>
								{values.cgpaRange[0].toFixed(1)} -{" "}
								{values.cgpaRange[1].toFixed(1)}
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
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
										Math.min(10, parseFloat(e.target.value) || 0)
									);
									onChange.setCgpaRange([
										minVal,
										Math.max(minVal, values.cgpaRange[1]),
									]);
									onChange.setCgpaInputMin(minVal.toFixed(1));
								}}
								placeholder="Min"
								className="text-sm h-9"
							/>
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
										Math.min(10, parseFloat(e.target.value) || 10)
									);
									onChange.setCgpaRange([
										Math.min(values.cgpaRange[0], maxVal),
										maxVal,
									]);
									onChange.setCgpaInputMax(maxVal.toFixed(1));
								}}
								placeholder="Max"
								className="text-sm h-9"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<div className="text-sm" style={{ color: "var(--label-color)" }}>
							Quick CGPA Filters
						</div>
						<div className="flex gap-1 flex-wrap">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									onChange.setCgpaRange([6.0, 8.0]);
									onChange.setCgpaInputMin("6.0");
									onChange.setCgpaInputMax("8.0");
								}}
								className={`text-xs h-7 px-2 ${
									values.cgpaRange[0] === 6.0 && values.cgpaRange[1] === 8.0
										? "border-theme"
										: "hover-theme"
								}`}
								style={{
									backgroundColor:
										values.cgpaRange[0] === 6.0 && values.cgpaRange[1] === 8.0
											? "var(--primary-color)"
											: "transparent",
									color:
										values.cgpaRange[0] === 6.0 && values.cgpaRange[1] === 8.0
											? "var(--accent-color)"
											: "var(--text-color)",
									borderColor:
										values.cgpaRange[0] === 6.0 && values.cgpaRange[1] === 8.0
											? "var(--accent-color)"
											: "var(--border-color)",
								}}
							>
								6.0-8.0
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									onChange.setCgpaRange([7.0, 9.0]);
									onChange.setCgpaInputMin("7.0");
									onChange.setCgpaInputMax("9.0");
								}}
								className={`text-xs h-7 px-2 ${
									values.cgpaRange[0] === 7.0 && values.cgpaRange[1] === 9.0
										? "border-theme"
										: "hover-theme"
								}`}
								style={{
									backgroundColor:
										values.cgpaRange[0] === 7.0 && values.cgpaRange[1] === 9.0
											? "var(--primary-color)"
											: "transparent",
									color:
										values.cgpaRange[0] === 7.0 && values.cgpaRange[1] === 9.0
											? "var(--accent-color)"
											: "var(--text-color)",
									borderColor:
										values.cgpaRange[0] === 7.0 && values.cgpaRange[1] === 9.0
											? "var(--accent-color)"
											: "var(--border-color)",
								}}
							>
								7.0-9.0
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									onChange.setCgpaRange([0, 10]);
									onChange.setCgpaInputMin("0.0");
									onChange.setCgpaInputMax("10.0");
								}}
								className={`text-xs h-7 px-2 ${
									values.cgpaRange[0] === 0 && values.cgpaRange[1] === 10
										? "border-theme"
										: "hover-theme"
								}`}
								style={{
									backgroundColor:
										values.cgpaRange[0] === 0 && values.cgpaRange[1] === 10
											? "var(--primary-color)"
											: "transparent",
									color:
										values.cgpaRange[0] === 0 && values.cgpaRange[1] === 10
											? "var(--accent-color)"
											: "var(--text-color)",
									borderColor:
										values.cgpaRange[0] === 0 && values.cgpaRange[1] === 10
											? "var(--accent-color)"
											: "var(--border-color)",
								}}
							>
								All
							</Button>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							id="openOnly"
							checked={values.openOnly}
							onCheckedChange={(v) => onChange.setOpenOnly(!!v)}
						/>
						<label
							htmlFor="openOnly"
							className="text-sm cursor-pointer"
							style={{ color: "var(--text-color)" }}
						>
							Show only open postings (deadline in future)
						</label>
					</div>

					<div className="flex gap-2 md:justify-end">
						<Button variant="ghost" onClick={onChange.clearFilters}>
							Reset
						</Button>
						<Badge variant="secondary" className="self-center">
							{derived.resultsCount} results
						</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default JobFilters;
