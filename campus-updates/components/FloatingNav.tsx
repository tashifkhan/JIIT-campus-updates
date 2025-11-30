"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

type Item = {
	id: number;
	href?: string;
	icon: React.ReactNode;
	label: string;
	onClick?: () => void;
};

const FloatingNav = ({ items }: { items?: Item[] }) => {
	const menu = items || [];
	const [active, setActive] = useState(0);
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		if (!menu || menu.length === 0) return;
		const idx = menu.findIndex((i) => i.href && pathname === i.href);
		if (idx >= 0) setActive(idx);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname, items]);

	const handleClick = (index: number, item: Item) => {
		setActive(index);
		if (item.onClick) return item.onClick();
		if (item.href) router.push(item.href);
	};

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className="relative flex items-center justify-center gap-6 rounded-full px-6 py-3 shadow-[0_0_20px_rgba(0,0,0,0.1)] border backdrop-blur-xl overflow-hidden bg-card/80"
        style={{
          borderColor: "var(--border-color)",
        }}
      >
        {/* Active Indicator Glow */}
        <motion.div
          layoutId="active-indicator"
          className="absolute w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl -z-10"
          style={{ opacity: 0.5 }}
          animate={{
            left: `calc(${active * (100 / Math.max(1, menu.length))}% + ${
              100 / Math.max(1, menu.length) / 2
            }%)`,
            translateX: "-50%",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />

        {menu.map((item, index) => {
          const isActive = index === active;
          return (
            <motion.div
              key={item.id}
              className="relative flex flex-col items-center group"
            >
              <motion.button
                onClick={() => handleClick(index, item)}
                whileHover={{ scale: 1.2 }}
                animate={{ scale: isActive ? 1.4 : 1 }}
                className="flex items-center justify-center w-14 h-14 relative z-10 transition-colors"
                style={{
                  color: isActive ? "var(--accent-color)" : "var(--label-color)",
                }}
              >
                {item.icon}
              </motion.button>

              <span
                className="absolute bottom-full mb-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border shadow-sm backdrop-blur-md"
                style={{
                  backgroundColor: "var(--card-bg)",
                  color: "var(--text-color)",
                  borderColor: "var(--border-color)",
                }}
              >
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};export default FloatingNav;
