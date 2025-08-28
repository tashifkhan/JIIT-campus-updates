"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { BriefcaseIcon, HomeIcon, TrendingUpIcon, Wrench } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type NavItem = {
	name: string;
	href?: string;
	icon?: any;
	onClick?: () => void;
};

const FloatingNav = ({
	items: propItems,
	onToolsClick,
}: {
	items?: NavItem[];
	onToolsClick?: () => void;
}) => {
	const pathname = usePathname();
	const router = useRouter();
	const [active, setActive] = useState(0);
	const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
	const containerRef = useRef<HTMLDivElement>(null);
	const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

	const defaultItems: NavItem[] = [
		{ name: "Updates", href: "/", icon: HomeIcon },
		{ name: "Jobs", href: "/jobs", icon: BriefcaseIcon },
		{ name: "Stats", href: "/stats", icon: TrendingUpIcon },
		{ name: "Tools", icon: Wrench, onClick: onToolsClick },
	];
	const items = propItems && propItems.length ? propItems : defaultItems;

	// Sync active with pathname on mount / pathname change
	useEffect(() => {
		const idxFromPath = items.findIndex((it) =>
			it.href ? pathname === it.href || pathname?.startsWith(it.href) : false
		);
		if (idxFromPath >= 0 && idxFromPath !== active) setActive(idxFromPath);
	}, [pathname, items, active]);

	// Update indicator position when active changes or resize.
	// useLayoutEffect measures before paint so the indicator starts at the
	// correct position (avoids animating from 0 on mount). Motion's
	// initial={false} is used on the indicator to prevent initial animation.
	useLayoutEffect(() => {
		const updateIndicator = () => {
			const btn = btnRefs.current[active];
			const container = containerRef.current;
			if (!btn || !container) return;
			const btnRect = btn.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			setIndicatorStyle({
				width: btnRect.width,
				left: btnRect.left - containerRect.left,
			});
		};
		updateIndicator();
		window.addEventListener("resize", updateIndicator);
		return () => window.removeEventListener("resize", updateIndicator);
	}, [active, items]);

	const handleClick = (index: number, item: NavItem) => {
		setActive(index);
		if (item.onClick) {
			item.onClick();
			return;
		}
		if (item.href) {
			router.push(item.href);
		}
	};

	return (
		<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-2">
			<div
				ref={containerRef}
				className="relative flex items-center justify-between shadow-xl rounded-full px-1 py-2 border"
				style={{
					backgroundColor: "var(--card-bg)",
					borderColor: "var(--border-color)",
				}}
			>
				{items.map((item, index) => {
					const Icon = item.icon as any;
					const isActive = index === active;
					return (
						<motion.button
							key={item.name}
							ref={(el) => (btnRefs.current[index] = el)}
							onClick={() => handleClick(index, item)}
							className="relative flex flex-col items-center justify-center flex-1 px-2 py-2 text-sm font-medium overflow-visible"
							style={{
								color: isActive ? "var(--accent-color)" : "var(--label-color)",
							}}
							aria-label={item.name}
							title={item.name}
							initial={false}
							animate={{ zIndex: isActive ? 30 : 10 }}
							transition={{ type: "spring", stiffness: 400, damping: 30 }}
						>
							{/* lifted circular bubble behind active icon */}
							{isActive && (
								<motion.span
									className="absolute -top-3 w-10 h-10 rounded-full bg-[var(--card-bg)] shadow z-10"
									initial={{ scale: 0.9, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ type: "spring", stiffness: 500, damping: 40 }}
								/>
							)}
							{/* icon - moves up when active */}
							<motion.div
								className="z-20"
								initial={false}
								animate={{ y: isActive ? -8 : 0, scale: isActive ? 1.05 : 1 }}
								transition={{ type: "spring", stiffness: 400, damping: 30 }}
							>
								{Icon ? <Icon className="w-5 h-5 mb-1" /> : null}
							</motion.div>
							{/* label - fades in for active item on larger screens */}
							<motion.span
								className="text-xs mt-1 hidden sm:block z-20"
								initial={false}
								animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 4 }}
								transition={{ duration: 0.18 }}
							>
								{item.name}
							</motion.span>
						</motion.button>
					);
				})}
				<motion.div
					initial={false}
					animate={indicatorStyle}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
					className="absolute top-1 bottom-1 rounded-full"
					style={{
						backgroundColor: "var(--accent-color)",
						opacity: 0.12,
					}}
				/>
			</div>
		</div>
	);
};

export default FloatingNav;
