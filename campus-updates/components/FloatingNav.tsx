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
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs sm:max-w-sm">
      <div
        className="relative flex items-center justify-between gap-1 rounded-full px-2 py-2 shadow-2xl border backdrop-blur-xl bg-card/80"
        style={{
          borderColor: "var(--border-color)",
        }}
      >
        {/* Active Indicator Glow */}
        <motion.div
          layoutId="active-indicator"
          className="absolute w-12 h-12 rounded-full blur-xl -z-10"
          style={{ 
            backgroundColor: "var(--accent-color)",
            opacity: 0.4 
          }}
          animate={{
            left: `calc(${active * (100 / Math.max(1, menu.length))}% + ${
              100 / Math.max(1, menu.length) / 2
            }%)`,
            translateX: "-50%",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />

        {menu.map((item, index) => {
          const isActive = index === active;
          return (
            <motion.div
              key={item.id}
              className="relative flex flex-col items-center justify-center flex-1"
            >
              <motion.button
                onClick={() => handleClick(index, item)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: isActive ? 1.2 : 1 }}
                className="flex items-center justify-center w-12 h-12 rounded-full relative z-10 transition-colors"
                style={{
                  color: isActive ? "var(--accent-color)" : "var(--label-color)",
                }}
              >
                {item.icon}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};export default FloatingNav;
