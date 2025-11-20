"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Filter } from "lucide-react";
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

interface BranchPickerProps {
	availableBranches: string[];
	selectedBranches: Set<string>;
	onChange: (branches: Set<string>) => void;
}

export function BranchPicker({
	availableBranches,
	selectedBranches,
	onChange,
}: BranchPickerProps) {
	const toggleBranch = (branch: string) => {
		const next = new Set(selectedBranches);
		if (next.has(branch)) {
			next.delete(branch);
		} else {
			next.add(branch);
		}
		onChange(next);
	};

	const toggleAll = () => {
		if (selectedBranches.size === availableBranches.length) {
			onChange(new Set());
		} else {
			onChange(new Set(availableBranches));
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-8 border-dashed"
					title="Filter branches"
				>
					<Filter className="mr-2 h-4 w-4" />
					Branches
					{selectedBranches.size > 0 && (
						<>
							<DropdownMenuSeparator className="mx-2 h-4" />
							<Badge
								variant="secondary"
								className="rounded-sm px-1 font-normal lg:hidden"
							>
								{selectedBranches.size}
							</Badge>
							<div className="hidden space-x-1 lg:flex">
								{selectedBranches.size > 2 ? (
									<Badge
										variant="secondary"
										className="rounded-sm px-1 font-normal"
									>
										{selectedBranches.size} selected
									</Badge>
								) : (
									availableBranches
										.filter((option) => selectedBranches.has(option))
										.map((option) => (
											<Badge
												variant="secondary"
												key={option}
												className="rounded-sm px-1 font-normal"
											>
												{option}
											</Badge>
										))
								)}
							</div>
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[200px]">
				<DropdownMenuLabel>Select Branches</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuCheckboxItem
					checked={selectedBranches.size === availableBranches.length}
					onCheckedChange={toggleAll}
					className="font-semibold"
				>
					{selectedBranches.size === availableBranches.length
						? "Clear All"
						: "Select All"}
				</DropdownMenuCheckboxItem>
				<DropdownMenuSeparator />
				{availableBranches.map((branch) => (
					<DropdownMenuCheckboxItem
						key={branch}
						checked={selectedBranches.has(branch)}
						onCheckedChange={() => toggleBranch(branch)}
					>
						{branch}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
