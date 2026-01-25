"use client";

import React, { useState, useEffect, useRef } from "react";
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
	const [hovered, setHovered] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);

	// Calculate width based on label length (min 44px for icon, plus label)
	const expandedWidth = Math.max(44 + item.label.length * 9 + 24, 100);

	// Show text on hover or active state
	const isExpanded = hovered || active;

	const Wrapper = item.href ? Link : "button";
	const wrapperProps = item.href
		? { href: item.href }
		: { type: "button" as const, onClick: item.onClick };

	return (
		// @ts-ignore - Link and button props intersection
		<Wrapper
			{...wrapperProps}
			aria-label={item.label}
			className={cn(
				"flex items-center rounded-xl border transition-all focus:outline-none relative overflow-visible duration-300 px-3 justify-center",
				active
					? "border-border bg-primary text-primary-foreground font-semibold shadow-sm"
					: "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border",
			)}
			style={{
				minWidth: 44,
				minHeight: 44,
				width: undefined, // let Tailwind handle width
				transition: "background 0.2s, border 0.2s, color 0.2s",
				paddingTop: 8,
				paddingBottom: 8,
			}}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			onClick={() => {
				if (!item.href && item.onClick) item.onClick();
			}}
		>
			<span className="flex items-center justify-center w-5 h-5 pointer-events-none">
				{item.icon}
			</span>
			<span
				className={cn(
					"text-sm transition-all duration-300 whitespace-nowrap pointer-events-none ml-2",
					isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0",
				)}
				style={{
					transition:
						"opacity 0.3s, width 0.35s cubic-bezier(0.4,0,0.2,1), margin 0.3s",
					width: isExpanded ? expandedWidth - 44 - 24 : 0,
				}}
			>
				{item.label}
			</span>
		</Wrapper>
	);
};

export const MenuBar = ({ items, className }: MenuBarProps) => {
	const pathname = usePathname();

	return (
		<nav
			className={cn(
				"fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card p-2 rounded-2xl border border-border w-fit transition-all duration-300 shadow-xl backdrop-blur-sm bg-card/80",
				className,
			)}
		>
			{items.map((item, index) => {
				const isActive = item.href ? pathname === item.href : false;
				return (
					<React.Fragment key={item.label}>
						<IconButton item={item} active={isActive} />
						{index < items.length - 1 && (
							<div className="w-px h-6 bg-border mx-1" />
						)}
					</React.Fragment>
				);
			})}
		</nav>
	);
};
