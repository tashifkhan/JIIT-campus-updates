"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { usePlacementYear } from "@/components/PlacementYearProvider";

/**
 * Academic-year selector. The selected year drives the `?year=` query used
 * across data hooks. Lives in the sidebar footer (desktop) and the mobile
 * header, replacing the old settings dropdown.
 */
export default function YearSelector({
	compact = false,
}: {
	compact?: boolean;
}) {
	const { year, setYear, years } = usePlacementYear();
	const current = years.find((y) => y.value === year);
	const label = current?.label ?? year;

	if (compact) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-9 px-3 gap-1 rounded-full border border-sidebar-border/70 bg-sidebar-accent/40 hover:bg-sidebar-accent"
						aria-label="Select academic year"
					>
						<span className="text-xs font-semibold tabular-nums">{label}</span>
						<ChevronDown className="w-3.5 h-3.5 opacity-50" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuLabel>Academic Year</DropdownMenuLabel>
					<DropdownMenuRadioGroup value={year} onValueChange={setYear}>
						{years.map((y) => (
							<DropdownMenuRadioItem key={y.value} value={y.value}>
								{y.label}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="group w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-sidebar-accent"
					aria-label="Select academic year"
				>
					<span className="flex-1 min-w-0">
						<span className="block text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
							Academic Year
						</span>
						<span className="block text-sm font-semibold tabular-nums leading-tight text-sidebar-foreground">
							{label}
						</span>
					</span>
					<ChevronDown className="w-4 h-4 shrink-0 text-sidebar-foreground/40 transition-transform duration-150 group-data-[state=open]:rotate-180" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-[--radix-dropdown-menu-trigger-width] min-w-48"
			>
				<DropdownMenuLabel>Academic Year</DropdownMenuLabel>
				<DropdownMenuRadioGroup value={year} onValueChange={setYear}>
					{years.map((y) => (
						<DropdownMenuRadioItem key={y.value} value={y.value}>
							{y.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
