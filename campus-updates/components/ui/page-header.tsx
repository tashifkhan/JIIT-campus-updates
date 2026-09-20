import * as React from "react";

import { cn } from "@/lib/utils";

type Props = {
	title: string;
	description?: string;
	/** Right-aligned slot for badges, actions, etc. */
	children?: React.ReactNode;
	className?: string;
};

export function PageHeader({ title, description, children, className }: Props) {
	return (
		<div
			className={cn(
				"mb-6 flex flex-wrap items-end justify-between gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-300",
				className,
			)}
		>
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
					{title}
				</h1>
				{description ? (
					<p className="text-sm text-muted-foreground">{description}</p>
				) : null}
			</div>
			{children}
		</div>
	);
}

export default PageHeader;
