"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
	query: string;
	setQuery: React.Dispatch<React.SetStateAction<string>>;
	allCategories: string[];
	selectedCategories: string[];
	setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
	resultsCount: number;
};

export default function NoticesFilters({
	query,
	setQuery,
	allCategories,
	selectedCategories,
	setSelectedCategories,
	resultsCount,
}: Props) {
	return (
		<div>
			{/* Filters */}
			<div className="mb-4">
				<div className="flex flex-col md:flex-row gap-3 md:items-center">
					<div className="flex-1">
						<Input
							placeholder="Search company, role or details"
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
												checked
													? [...prev, cat]
													: prev.filter((c) => c !== cat),
											);
										}}
									>
										{cat
											.split(" ")
											.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
											.join(" ")}
									</DropdownMenuCheckboxItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>

						<Badge variant="secondary" className="self-center">
							{resultsCount} results
						</Badge>
					</div>
				</div>
			</div>
		</div>
	);
}
