"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	Building,
	ChevronDown,
	Filter,
	GraduationCap,
	IndianRupee,
	MapPin,
	Search,
	X,
} from "lucide-react";
import React from "react";

export type FiltersState = {
	searchQuery: string;
	selectedCompanies: string[];
	selectedRoles: string[];
	selectedLocations: string[];
	packageRange: [number, number];
};

type Props = {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	hasActiveFilters: boolean;
	totals: {
		students: number;
		totalStudents: number;
		companies: number;
		totalCompanies: number;
	};
	options: { companies: string[]; roles: string[]; locations: string[] };
	state: FiltersState;
	setState: (next: Partial<FiltersState>) => void;
	clearFilters: () => void;
};

export default function FiltersSheet({
	open,
	onOpenChange,
	hasActiveFilters,
	totals,
	options,
	state,
	setState,
	clearFilters,
}: Props) {
	const {
		searchQuery,
		selectedCompanies,
		selectedRoles,
		selectedLocations,
		packageRange,
	} = state;

	return (
		<div className="fixed bottom-24 md:bottom-6 right-6 z-50">
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetTrigger asChild>
					<Button className="rounded-2xl w-14 h-14 shadow-lg relative bg-primary text-primary-foreground hover:bg-primary/90">
						<Filter className="w-6 h-6" />
						{hasActiveFilters && (
							<Badge className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
						{/* Search */}
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
								onChange={(e) => setState({ searchQuery: e.target.value })}
								className="h-11"
							/>
							{searchQuery && (
								<p className="text-xs text-muted-foreground">
									Searching across names, enrollment numbers, companies, and
									roles
								</p>
							)}
						</div>

						{/* Companies */}
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
									{options.companies.map((company) => (
										<DropdownMenuCheckboxItem
											key={company}
											checked={selectedCompanies.includes(company)}
											onCheckedChange={(checked) =>
												setState({
													selectedCompanies: checked
														? [...selectedCompanies, company]
														: selectedCompanies.filter((c) => c !== company),
												})
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
										<Badge key={company} variant="outline" className="text-xs">
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

						{/* Roles */}
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
									{options.roles.map((role) => (
										<DropdownMenuCheckboxItem
											key={role}
											checked={selectedRoles.includes(role)}
											onCheckedChange={(checked) =>
												setState({
													selectedRoles: checked
														? [...selectedRoles, role]
														: selectedRoles.filter((r) => r !== role),
												})
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

						{/* Locations */}
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
									{options.locations.map((location) => (
										<DropdownMenuCheckboxItem
											key={location}
											checked={selectedLocations.includes(location)}
											onCheckedChange={(checked) =>
												setState({
													selectedLocations: checked
														? [...selectedLocations, location]
														: selectedLocations.filter((l) => l !== location),
												})
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
										<Badge key={location} variant="outline" className="text-xs">
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

						{/* Package Range */}
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
											setState({ packageRange: value as [number, number] })
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

						{/* Actions */}
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
									onClick={() => onOpenChange(false)}
									className="flex-1 h-11"
								>
									Apply Filters
								</Button>
							</div>

							{/* Summary */}
							<div className="bg-muted/30 rounded-lg p-4 space-y-2">
								<h4 className="text-sm font-semibold text-foreground">
									Filter Results
								</h4>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-muted-foreground">Students</p>
										<p className="font-semibold">
											{totals.students} of {totals.totalStudents}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Companies</p>
										<p className="font-semibold">
											{totals.companies} of {totals.totalCompanies}
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
												(packageRange[0] !== 0 || packageRange[1] !== 100) &&
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
	);
}
