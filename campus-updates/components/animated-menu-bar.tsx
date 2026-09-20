"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MenuItem {
	id?: string | number;
	label: string;
	icon: React.ReactNode;
	href?: string;
	onClick?: () => void;
}

interface MenuBarProps {
	items: MenuItem[];
	className?: string;
}

interface IconButtonProps {
	item: MenuItem;
	active: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({ item, active }) => {
	const Wrapper = item.href ? Link : "button";
	const wrapperProps = item.href
		? { href: item.href }
		: { type: "button" as const, onClick: item.onClick };

	return (
		// @ts-ignore - Link and button props intersection
		<Wrapper
			{...wrapperProps}
			aria-label={item.label}
			aria-current={active ? "page" : undefined}
			className={cn(
				"group flex h-11 items-center justify-center rounded-full",
				"transition-[background-color,color,padding] duration-300 ease-out",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
				"active:scale-95 motion-safe:transition-transform",
				active
					? "bg-primary text-primary-foreground font-semibold px-4 shadow-sm"
					: "text-muted-foreground px-3.5 hover:bg-accent hover:text-accent-foreground",
			)}
		>
			<span className="flex h-5 w-5 shrink-0 items-center justify-center pointer-events-none">
				{item.icon}
			</span>
			{/* grid trick: animates label width from 0 without measuring */}
			<span
				className={cn(
					"grid pointer-events-none transition-[grid-template-columns] duration-300 ease-out",
					active ? "grid-cols-[1fr]" : "grid-cols-[0fr]",
				)}
			>
				<span className="overflow-hidden">
					<span
						className={cn(
							"block whitespace-nowrap pl-2 text-sm transition-opacity duration-200",
							active ? "opacity-100" : "opacity-0",
						)}
					>
						{item.label}
					</span>
				</span>
			</span>
		</Wrapper>
	);
};

export const MenuBar = ({ items, className }: MenuBarProps) => {
	const pathname = usePathname();

	return (
		<nav
			className={cn(
				"fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none",
				className,
			)}
			style={{
				paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
			}}
		>
			<div className="pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-1 overflow-x-auto rounded-full border border-border bg-card/85 p-1.5 shadow-xl backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{items.map((item) => {
					const isActive = item.href
						? pathname === item.href ||
							(item.href !== "/" && pathname.startsWith(`${item.href}/`))
						: false;
					return (
						<IconButton key={item.label} item={item} active={isActive} />
					);
				})}
			</div>
		</nav>
	);
};
