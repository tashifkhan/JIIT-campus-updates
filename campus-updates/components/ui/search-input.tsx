"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SearchInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	value: string;
	onValueChange: (value: string) => void;
	/** Hide the trailing clear button even when a value is present. */
	hideClear?: boolean;
}

/**
 * Consistent search field used across the app: leading search icon, a clear
 * (X) affordance once text is entered, and matching focus/hover styling.
 */
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
	({ className, value, onValueChange, hideClear, ...props }, ref) => {
		return (
			<div className={cn("group/search relative", className)}>
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/search:text-primary" />
				<input
					ref={ref}
					type="text"
					value={value}
					onChange={(event) => onValueChange(event.target.value)}
					className={cn(
						"flex h-10 w-full rounded-lg border border-border/60 bg-card pl-9 pr-9 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground/70 hover:border-border focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
					)}
					{...props}
				/>
				{!hideClear && value ? (
					<button
						type="button"
						aria-label="Clear search"
						onClick={() => onValueChange("")}
						className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				) : null}
			</div>
		);
	},
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
