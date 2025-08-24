"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
	query: string;
	setQuery: React.Dispatch<React.SetStateAction<string>>;
	allCategories: string[];
	selectedCategories: string[];
	setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
	onlyShortlisted: boolean;
	setOnlyShortlisted: React.Dispatch<React.SetStateAction<boolean>>;
	itemsPerPage: number;
	setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
	resultsCount: number;
};

export default function NoticesFilters({
	query,
	setQuery,
	allCategories,
	selectedCategories,
	setSelectedCategories,
	onlyShortlisted,
	setOnlyShortlisted,
	itemsPerPage,
	setItemsPerPage,
	resultsCount,
}: Props) {
	return (
		<div>
			{/* Filters */}
			<div className="mb-4">
				<div className="flex flex-col md:flex-row gap-3 md:items-center">
					<div className="flex-1">
						<Input
							placeholder="Search updates or company/role"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>
					<div className="flex gap-2 flex-wrap">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="whitespace-nowrap">
									Categories
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56 max-h-72 overflow-auto">
								<DropdownMenuLabel>Select categories</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{allCategories.map((cat) => (
									<DropdownMenuCheckboxItem
										key={cat}
										checked={selectedCategories.includes(cat)}
										onCheckedChange={(checked) => {
											setSelectedCategories((prev) =>
												checked ? [...prev, cat] : prev.filter((c) => c !== cat)
											);
										}}
									>
										{cat.charAt(0).toUpperCase() + cat.slice(1)}
									</DropdownMenuCheckboxItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="whitespace-nowrap">
									{itemsPerPage} per page
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-40">
								<DropdownMenuLabel>Items per page</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuRadioGroup
									value={itemsPerPage.toString()}
									onValueChange={(value) => setItemsPerPage(Number(value))}
								>
									{[20, 50, 75, 100].map((val) => (
										<DropdownMenuRadioItem key={val} value={val.toString()}>
											{val}
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
						<div className="flex items-center gap-2">
							<Checkbox
								id="onlyShortlisted"
								checked={onlyShortlisted}
								onCheckedChange={(v) => setOnlyShortlisted(!!v)}
							/>
							<label
								htmlFor="onlyShortlisted"
								className="text-sm cursor-pointer"
							>
								Shortlisted students
							</label>
						</div>
						<Badge variant="secondary" className="self-center">
							{resultsCount} results
						</Badge>
					</div>
				</div>
			</div>
		</div>
	);
}
