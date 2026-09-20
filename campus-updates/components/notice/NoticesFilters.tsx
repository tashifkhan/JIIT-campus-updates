"use client";

import { useMemo } from "react";
import { Tags } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FilterChips, type FilterChip } from "@/components/ui/filter-chips";
import { SearchInput } from "@/components/ui/search-input";
import { SearchableFilterDropdown } from "@/components/ui/searchable-filter-dropdown";

type Props = {
	query: string;
	onQueryChange: (query: string) => void;
	allCategories: string[];
	selectedCategories: string[];
	onCategoriesChange: (categories: string[]) => void;
	resultsCount: number;
};

function prettify(category: string): string {
	return category
		.split(" ")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

export default function NoticesFilters({
	query,
	onQueryChange,
	allCategories,
	selectedCategories,
	onCategoriesChange,
	resultsCount,
}: Props) {
	const chips = useMemo<FilterChip[]>(() => {
		const list: FilterChip[] = [];
		if (query.trim()) {
			list.push({
				key: "query",
				label: `“${query.trim()}”`,
				onRemove: () => onQueryChange(""),
			});
		}
		selectedCategories.forEach((cat) =>
			list.push({
				key: `cat-${cat}`,
				label: prettify(cat),
				onRemove: () =>
					onCategoriesChange(selectedCategories.filter((c) => c !== cat)),
			}),
		);
		return list;
	}, [query, selectedCategories, onQueryChange, onCategoriesChange]);

	const clearAll = () => {
		onQueryChange("");
		onCategoriesChange([]);
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<SearchInput
					placeholder="Search company, role or details"
					value={query}
					onValueChange={onQueryChange}
					className="w-full sm:w-auto sm:flex-1 sm:min-w-40"
					aria-label="Search notices"
				/>

				<SearchableFilterDropdown<string>
					label="Categories"
					icon={<Tags className="h-3.5 w-3.5 opacity-60" />}
					options={allCategories.map((cat) => ({
						value: cat,
						label: prettify(cat),
					}))}
					selected={selectedCategories}
					onChange={onCategoriesChange}
					searchPlaceholder="Search categories..."
					contentClassName="w-60 max-w-[calc(100vw-1.5rem)]"
				/>

				<Badge
					variant="secondary"
					className="ml-auto rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary hover:bg-primary/20"
				>
					{resultsCount} results
				</Badge>
			</div>

			<FilterChips chips={chips} onClearAll={clearAll} />
		</div>
	);
}
