"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type FilterOption<T extends string | number> = {
	value: T;
	label: string;
	/** Optional decorative element rendered before the label. */
	hint?: React.ReactNode;
};

type Props<T extends string | number> = {
	label: string;
	icon?: React.ReactNode;
	options: FilterOption<T>[];
	selected: T[];
	onChange: (next: T[]) => void;
	/** Show the search field inside the dropdown (default: true). */
	searchable?: boolean;
	searchPlaceholder?: string;
	/** Max height of the scrollable option list. */
	maxHeight?: number;
	/** Width class of the popover panel. */
	contentClassName?: string;
	align?: "start" | "center" | "end";
	disabled?: boolean;
};

/**
 * Multi-select filter dropdown with a built-in search box. Selections stay
 * open while picking, the trigger surfaces the active selection count, and
 * the panel offers select-all / clear quick actions.
 */
export function SearchableFilterDropdown<T extends string | number>({
	label,
	icon,
	options,
	selected,
	onChange,
	searchable = true,
	searchPlaceholder,
	maxHeight = 288,
	contentClassName,
	align = "start",
	disabled = false,
}: Props<T>) {
	const [open, setOpen] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const searchRef = React.useRef<HTMLInputElement>(null);

	const selectedSet = React.useMemo(() => new Set(selected), [selected]);

	const filtered = React.useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return options;
		return options.filter((option) =>
			option.label.toLowerCase().includes(term),
		);
	}, [options, search]);

	const allFilteredSelected =
		filtered.length > 0 &&
		filtered.every((option) => selectedSet.has(option.value));

	const toggle = (value: T) => {
		onChange(
			selectedSet.has(value)
				? selected.filter((item) => item !== value)
				: [...selected, value],
		);
	};

	const toggleAllFiltered = () => {
		if (allFilteredSelected) {
			const filteredValues = new Set(filtered.map((option) => option.value));
			onChange(selected.filter((item) => !filteredValues.has(item)));
			return;
		}
		const merged = new Set(selected);
		filtered.forEach((option) => merged.add(option.value));
		onChange(Array.from(merged));
	};

	const hasSelection = selected.length > 0;

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) {
					setSearch("");
					// Focus after the open animation frame so the input is mounted.
					requestAnimationFrame(() => searchRef.current?.focus());
				}
			}}
		>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						"h-10 gap-1.5 rounded-lg border-border/60 bg-card px-3 font-medium shadow-sm transition-all hover:border-primary/40 hover:bg-card",
						hasSelection &&
							"border-primary/50 bg-primary/5 text-primary hover:bg-primary/10",
						open && "border-primary/60 ring-2 ring-primary/20",
					)}
				>
					{icon}
					<span className="whitespace-nowrap">{label}</span>
					{hasSelection ? (
						<Badge
							variant="secondary"
							className="ml-0.5 h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary"
						>
							{selected.length}
						</Badge>
					) : null}
					<ChevronDown
						className={cn(
							"h-3.5 w-3.5 opacity-50 transition-transform duration-200",
							open && "rotate-180",
						)}
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align={align}
				collisionPadding={12}
				className={cn(
					"w-64 overflow-hidden rounded-xl border-border/60 p-0 shadow-lg",
					contentClassName,
				)}
			>
				{/* Panel header */}
				<div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
					<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						{label}
					</span>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={toggleAllFiltered}
							className="rounded px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
						>
							{allFilteredSelected ? "Unselect all" : "Select all"}
						</button>
						{hasSelection ? (
							<button
								type="button"
								onClick={() => onChange([])}
								className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								Clear
							</button>
						) : null}
					</div>
				</div>

				{/* Search */}
				{searchable ? (
					<div className="border-b border-border/50 p-2">
						<div className="relative">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
							<input
								ref={searchRef}
								type="text"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder={searchPlaceholder || `Search ${label.toLowerCase()}...`}
								className="h-8 w-full rounded-md border border-border/50 bg-background pl-8 pr-7 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
							/>
							{search ? (
								<button
									type="button"
									aria-label="Clear filter search"
									onClick={() => setSearch("")}
									className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
								>
									<X className="h-3 w-3" />
								</button>
							) : null}
						</div>
					</div>
				) : null}

				{/* Options */}
				<div
					className="custom-scrollbar overflow-y-auto p-1.5"
					style={{ maxHeight }}
				>
					{filtered.length === 0 ? (
						<div className="px-3 py-6 text-center text-sm text-muted-foreground">
							No matches for &ldquo;{search.trim()}&rdquo;
						</div>
					) : (
						filtered.map((option) => {
							const isSelected = selectedSet.has(option.value);
							return (
								<button
									key={String(option.value)}
									type="button"
									role="checkbox"
									aria-checked={isSelected}
									onClick={() => toggle(option.value)}
									className={cn(
										"flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
										isSelected
											? "bg-primary/10 text-foreground"
											: "text-foreground/90 hover:bg-muted",
									)}
								>
									<span
										className={cn(
											"flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
											isSelected
												? "border-primary bg-primary text-primary-foreground"
												: "border-muted-foreground/40 bg-background",
										)}
									>
										{isSelected ? (
											<Check className="h-3 w-3" strokeWidth={3} />
										) : null}
									</span>
									{option.hint}
									<span className="min-w-0 flex-1 truncate">{option.label}</span>
								</button>
							);
						})
					)}
				</div>

				{/* Footer */}
				{hasSelection ? (
					<div className="border-t border-border/50 px-3 py-2 text-xs text-muted-foreground">
						{selected.length} of {options.length} selected
					</div>
				) : null}
			</PopoverContent>
		</Popover>
	);
}

export default SearchableFilterDropdown;
