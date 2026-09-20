"use client";

import { useMemo, useState } from "react";
import {
	Building2,
	CircleDot,
	GraduationCap,
	ListFilter,
	MapPin,
	Tags,
	VenetianMask,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterChips, type FilterChip } from "@/components/ui/filter-chips";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { SearchableFilterDropdown } from "@/components/ui/searchable-filter-dropdown";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { JobFacets } from "@/lib/jobs";
import { cn } from "@/lib/utils";
import { getCategoryClass } from "./helpers";

type Props = {
	facets: JobFacets;
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
		resultsCount: number;
	};
};

const FULL_CGPA_RANGE: [number, number] = [0, 10];

export function JobFilters({ facets, values, onChange, derived }: Props) {
	const [showFilters, setShowFilters] = useState(false);

	const minPackageValue = [values.minPackageLpa];
	const handleSliderChange = (value: number[]) => {
		onChange.setMinPackageLpa(value[0] ?? 0);
	};

	const setCgpa = (range: [number, number]) => {
		onChange.setCgpaRange(range);
		onChange.setCgpaInputMin(range[0].toFixed(1));
		onChange.setCgpaInputMax(range[1].toFixed(1));
	};

	// Shared shell for the three numeric filter groups so their label rows and
	// control rows line up on the same baselines.
	const groupBox =
		"flex flex-col gap-2 rounded-lg border px-3.5 py-2.5 transition-colors";
	const groupLabel =
		"flex h-5 items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase";
	const groupControls = "flex h-8 items-center gap-2";

	const categoryLabel = (code: number) =>
		facets.categories.find((c) => c.code === code)?.label ?? String(code);

	// Removable chips describing every active filter.
	const chips = useMemo<FilterChip[]>(() => {
		const list: FilterChip[] = [];
		if (values.query.trim()) {
			list.push({
				key: "query",
				label: `“${values.query.trim()}”`,
				onRemove: () => onChange.setQuery(""),
			});
		}
		values.selectedCategories.forEach((code) =>
			list.push({
				key: `cat-${code}`,
				label: categoryLabel(code),
				onRemove: () =>
					onChange.setSelectedCategories((prev) =>
						prev.filter((c) => c !== code),
					),
			}),
		);
		values.selectedLocations.forEach((loc) =>
			list.push({
				key: `loc-${loc}`,
				label: loc,
				onRemove: () =>
					onChange.setSelectedLocations((prev) =>
						prev.filter((l) => l !== loc),
					),
			}),
		);
		values.selectedGenders.forEach((g) =>
			list.push({
				key: `gen-${g}`,
				label: g,
				onRemove: () =>
					onChange.setSelectedGenders((prev) => prev.filter((x) => x !== g)),
			}),
		);
		values.selectedCourses.forEach((course) =>
			list.push({
				key: `course-${course}`,
				label: course,
				onRemove: () =>
					onChange.setSelectedCourses((prev) =>
						prev.filter((c) => c !== course),
					),
			}),
		);
		if (values.minPackageLpa > 0) {
			list.push({
				key: "pkg",
				label: `₹${values.minPackageLpa}+ LPA`,
				onRemove: () => onChange.setMinPackageLpa(0),
			});
		}
		if (
			values.cgpaRange[0] !== FULL_CGPA_RANGE[0] ||
			values.cgpaRange[1] !== FULL_CGPA_RANGE[1]
		) {
			list.push({
				key: "cgpa",
				label: `CGPA ${values.cgpaRange[0].toFixed(1)}–${values.cgpaRange[1].toFixed(1)}`,
				onRemove: () => setCgpa(FULL_CGPA_RANGE),
			});
		}
		if (values.openOnly) {
			list.push({
				key: "open",
				label: "Open only",
				onRemove: () => onChange.setOpenOnly(false),
			});
		}
		return list;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [values, facets]);

	// Category dropdowns: rendered beside the search bar on desktop and inside
	// the collapsible panel on mobile.
	const dropdowns = (
		<>
			<SearchableFilterDropdown<number>
				label="Category"
				icon={<Tags className="h-3.5 w-3.5 opacity-60" />}
				options={facets.categories.map(({ code, label }) => ({
					value: code,
					label,
					hint: (
						<span
							className={cn(
								"h-2 w-2 shrink-0 rounded-full border",
								getCategoryClass(code),
							)}
						/>
					),
				}))}
				selected={values.selectedCategories}
				onChange={(next) => onChange.setSelectedCategories(() => next)}
				searchPlaceholder="Search categories..."
				contentClassName="w-60"
			/>

			<SearchableFilterDropdown<string>
				label="Location"
				icon={<MapPin className="h-3.5 w-3.5 opacity-60" />}
				options={facets.locations.map((loc) => ({
					value: loc,
					label: loc,
				}))}
				selected={values.selectedLocations}
				onChange={(next) => onChange.setSelectedLocations(() => next)}
				searchPlaceholder="Search locations..."
				contentClassName="w-64"
			/>

			<SearchableFilterDropdown<string>
				label="Gender"
				icon={<VenetianMask className="h-3.5 w-3.5 opacity-60" />}
				options={facets.genders.map((g) => ({ value: g, label: g }))}
				selected={values.selectedGenders}
				onChange={(next) => onChange.setSelectedGenders(() => next)}
				searchPlaceholder="Search genders..."
				contentClassName="w-52"
			/>

			<SearchableFilterDropdown<string>
				label="Branches"
				icon={<GraduationCap className="h-3.5 w-3.5 opacity-60" />}
				options={facets.courses.map((course) => ({
					value: course,
					label: course,
				}))}
				selected={values.selectedCourses}
				onChange={(next) => onChange.setSelectedCourses(() => next)}
				searchPlaceholder="Search branches..."
				contentClassName="w-80"
				maxHeight={320}
			/>
		</>
	);

	const resetAndCount = (
		<>
			<Button
				variant="ghost"
				size="sm"
				onClick={onChange.clearFilters}
				disabled={chips.length === 0}
				className="h-8 px-2 text-muted-foreground hover:text-foreground"
			>
				Reset
			</Button>
			<Badge
				variant="secondary"
				className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary hover:bg-primary/20"
			>
				{derived.resultsCount} results
			</Badge>
		</>
	);

	return (
		<div className="mb-6 space-y-3">
			{/* Top row: search + dropdown filters */}
			<div className="flex flex-wrap items-center gap-2">
				<SearchInput
					placeholder="Search by role, company or location"
					value={values.query}
					onValueChange={onChange.setQuery}
					className="min-w-[14rem] flex-1"
					aria-label="Search jobs"
				/>

				<div className="hidden flex-wrap items-center gap-2 md:flex">
					{dropdowns}
					<div className="flex items-center gap-2 pl-1">{resetAndCount}</div>
				</div>

				{/* Mobile filter toggle */}
				<Button
					variant="outline"
					className={cn(
						"relative h-10 shrink-0 gap-1.5 rounded-lg border-border/60 bg-card px-3 shadow-sm md:hidden",
						showFilters && "border-primary/60 ring-2 ring-primary/20",
					)}
					onClick={() => setShowFilters(!showFilters)}
					aria-expanded={showFilters}
					aria-label="Toggle filters"
				>
					<ListFilter className="h-4 w-4" />
					<span className="text-sm font-medium">Filters</span>
					{chips.length > 0 ? (
						<Badge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary">
							{chips.length}
						</Badge>
					) : null}
				</Button>
			</div>

			{/* Filter controls */}
			<div
				className={cn(
					"space-y-3 rounded-xl border border-border/50 bg-card/60 p-3 shadow-sm backdrop-blur-sm md:p-4",
					showFilters ? "block" : "hidden md:block",
				)}
			>
				{/* Dropdown row (mobile only — desktop shows these next to search) */}
				<div className="flex flex-wrap items-center gap-2 md:hidden">
					{dropdowns}
					<div className="ml-auto flex items-center gap-3">{resetAndCount}</div>
				</div>

				{/* Numeric filters */}
				<div className="grid gap-3 border-t border-border/40 pt-3 md:grid-cols-[minmax(16rem,1fr)_auto_auto] md:gap-3 md:border-t-0 md:pt-0">
					{/* Package slider */}
					<div className={cn(groupBox, "border-border/40 bg-background/40")}>
						<div className="flex items-center justify-between gap-3">
							<span className={cn(groupLabel, "text-muted-foreground")}>
								<Building2 className="h-3.5 w-3.5 text-primary/70" />
								Minimum package
							</span>
							<span
								className={cn(
									"flex h-5 items-center rounded-md px-2 text-xs font-bold tabular-nums",
									values.minPackageLpa > 0
										? "bg-primary/10 text-primary"
										: "text-muted-foreground/70",
								)}
							>
								{values.minPackageLpa > 0
									? `₹${values.minPackageLpa}+ LPA`
									: "Any"}
							</span>
						</div>
						<div className={groupControls}>
							<Slider
								min={0}
								max={Math.max(facets.maxPackageLpa, 1)}
								step={1}
								value={minPackageValue}
								onValueChange={handleSliderChange}
								aria-label="Minimum package in LPA"
								className="[&>.relative>.absolute]:bg-primary"
							/>
						</div>
					</div>

					{/* CGPA range */}
					<div className={cn(groupBox, "border-border/40 bg-background/40")}>
						<span className={cn(groupLabel, "text-muted-foreground")}>
							<GraduationCap className="h-3.5 w-3.5 text-primary/70" />
							CGPA range
						</span>
						<div className={groupControls}>
							<div className="flex items-center rounded-lg border border-border/60 bg-background">
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
										setCgpa([minVal, Math.max(minVal, values.cgpaRange[1])]);
									}}
									aria-label="Minimum CGPA"
									className="h-8 w-14 border-0 bg-transparent px-2 text-center text-sm tabular-nums shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								/>
								<span className="text-xs text-muted-foreground/60">–</span>
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
										setCgpa([Math.min(values.cgpaRange[0], maxVal), maxVal]);
									}}
									aria-label="Maximum CGPA"
									className="h-8 w-14 border-0 bg-transparent px-2 text-center text-sm tabular-nums shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								/>
							</div>
							{/* Quick presets */}
							<div className="flex gap-1">
								{[
									{ label: "≤ 8", range: [0, 8] as [number, number] },
									{ label: "≤ 6", range: [0, 6] as [number, number] },
								].map(({ label, range }) => {
									const active =
										values.cgpaRange[0] === range[0] &&
										values.cgpaRange[1] === range[1];
									return (
										<button
											key={label}
											type="button"
											aria-pressed={active}
											onClick={() => setCgpa(active ? FULL_CGPA_RANGE : range)}
											className={cn(
												"h-8 rounded-md border px-2.5 text-xs font-medium transition-colors",
												active
													? "border-primary bg-primary/10 text-primary"
													: "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
											)}
										>
											{label}
										</button>
									);
								})}
							</div>
						</div>
					</div>

					{/* Open only */}
					<label
						className={cn(
							groupBox,
							"cursor-pointer select-none",
							values.openOnly
								? "border-primary/50 bg-primary/5"
								: "border-border/40 bg-background/40 hover:border-border",
						)}
					>
						<span
							className={cn(
								groupLabel,
								values.openOnly ? "text-primary" : "text-muted-foreground",
							)}
						>
							<CircleDot className="h-3.5 w-3.5 text-primary/70" />
							Availability
						</span>
						<span className={groupControls}>
							<Switch
								checked={values.openOnly}
								onCheckedChange={onChange.setOpenOnly}
								aria-label="Show only open postings"
							/>
							<span className="text-sm whitespace-nowrap text-muted-foreground">
								Open postings only
							</span>
						</span>
					</label>
				</div>
			</div>

			{/* Active filter chips */}
			<FilterChips chips={chips} onClearAll={onChange.clearFilters} />
		</div>
	);
}

export default JobFilters;
