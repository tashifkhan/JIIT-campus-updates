"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Search, Bell, User, Settings, Bookmark } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type Item = {
	id: number;
	href?: string;
	icon: React.ReactNode;
	label: string;
	onClick?: () => void;
};

const FloatingNav = ({ items }: { items?: Item[] }) => {
	const [active, setActive] = useState(0);
	const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
	const containerRef = useRef<HTMLDivElement>(null);
	const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		if (!items) return;
		const idx = items.findIndex((i) => i.href && pathname === i.href);
		if (idx >= 0) setActive(idx);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname, items]);

	useEffect(() => {
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
	}, [active]);

	const handleClick = (index: number, item: Item) => {
		setActive(index);
		if (item.onClick) {
			item.onClick();
			return;
		}
		if (item.href) {
			router.push(item.href);
		}
	};

	const menu = items || [];

	return (
		<div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-2">
			<div
				ref={containerRef}
				className="relative flex items-center justify-between rounded-full px-1 py-2 border shadow-xl"
				style={{
					backgroundColor: "var(--card-bg)",
					borderColor: "var(--border-color)",
				}}
			>
				{menu.map((item, index) => (
					<button
						key={item.id}
						ref={(el) => (btnRefs.current[index] = el)}
						onClick={() => handleClick(index, item)}
						className="relative flex flex-col items-center justify-center flex-1 px-2 py-2 text-sm font-medium"
						style={{
							color:
								pathname === item.href
									? "var(--accent-color)"
									: "var(--label-color)",
						}}
					>
						<div className="z-10">{item.icon}</div>
						{/* Show labels (uses theme text color) */}
						<span
							className="text-xs mt-1 block truncate"
							style={{ color: "var(--text-color)" }}
						>
							{item.label}
						</span>
					</button>
				))}

				<motion.div
					animate={indicatorStyle}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
					className="absolute top-1 bottom-1 rounded-full"
					style={{ backgroundColor: "var(--accent-color)", opacity: 0.12 }}
				/>
			</div>
		</div>
	);
};

export default FloatingNav;
