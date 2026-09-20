"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export type FilterChip = {
	key: string;
	label: string;
	onRemove: () => void;
};

type Props = {
	chips: FilterChip[];
	onClearAll?: () => void;
	className?: string;
};

/**
 * Row of removable chips describing the currently active filters. Renders
 * nothing when no chips are active, so callers can drop it in
 * unconditionally.
 */
export function FilterChips({ chips, onClearAll, className }: Props) {
	if (chips.length === 0) return null;

	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200",
				className,
			)}
		>
			<span className="mr-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
				Active
			</span>
			{chips.map((chip) => (
				<span
					key={chip.key}
					className="group inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-1 pl-2.5 pr-1 text-xs font-medium text-primary"
				>
					<span className="max-w-48 truncate">{chip.label}</span>
					<button
						type="button"
						aria-label={`Remove filter ${chip.label}`}
						onClick={chip.onRemove}
						className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
					>
						<X className="h-3 w-3" />
					</button>
				</span>
			))}
			{onClearAll ? (
				<button
					type="button"
					onClick={onClearAll}
					className="ml-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
				>
					Clear all
				</button>
			) : null}
		</div>
	);
}

export default FilterChips;
