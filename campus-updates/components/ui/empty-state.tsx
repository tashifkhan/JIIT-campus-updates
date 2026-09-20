"use client";

import * as React from "react";
import { SearchX, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
	icon?: LucideIcon;
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	className?: string;
};

export function EmptyState({
	icon: Icon = SearchX,
	title,
	description,
	actionLabel,
	onAction,
	className,
}: Props) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-12 text-center text-card-foreground shadow-sm animate-in fade-in-0 zoom-in-95 duration-300",
				className,
			)}
		>
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary shadow-xs">
				<Icon className="h-8 w-8" />
			</div>
			<div className="space-y-1.5">
				<h3 className="text-lg font-semibold tracking-tight text-foreground">
					{title}
				</h3>
				{description ? (
					<p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			{actionLabel && onAction ? (
				<Button
					size="sm"
					onClick={onAction}
					className="mt-1 rounded-lg border border-border shadow-xs transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
				>
					{actionLabel}
				</Button>
			) : null}
		</div>
	);
}

export default EmptyState;
