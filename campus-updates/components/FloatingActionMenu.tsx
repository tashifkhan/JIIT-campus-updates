"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FloatingActionMenuProps = {
	options: {
		label: string;
		onClick: () => void;
		Icon?: React.ReactNode;
	}[];
	isOpen: boolean;
	onClose: () => void;
	className?: string;
};

const FloatingActionMenu = ({
	options,
	isOpen,
	onClose,
	className,
}: FloatingActionMenuProps) => {
	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop to close on click outside */}
					<div className="fixed inset-0 z-40" onClick={onClose} />

					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
						animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
						exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
						transition={{
							duration: 0.4,
							type: "spring",
							stiffness: 300,
							damping: 25,
						}}
						className={cn(
							"fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 items-center min-w-[200px]",
							className
						)}
					>
						{options.map((option, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 10 }}
								transition={{
									duration: 0.2,
									delay: index * 0.05,
								}}
								className="w-full"
							>
								<Button
									onClick={() => {
										option.onClick();
										onClose();
									}}
									className="w-full flex items-center justify-start gap-3 px-4 py-6 shadow-lg border rounded-2xl backdrop-blur-xl transition-transform active:scale-95 bg-card text-foreground border-border"
								>
									{option.Icon}
									<span className="text-sm font-medium">{option.label}</span>
								</Button>
							</motion.div>
						))}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};

export default FloatingActionMenu;
