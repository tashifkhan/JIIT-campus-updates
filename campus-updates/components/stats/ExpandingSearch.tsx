"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
};

export default function ExpandingSearch({
	value,
	onChange,
	placeholder = "Search...",
}: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Focus input when opened
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	// Close when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				if (!value) {
					setIsOpen(false);
				}
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [value]);

	const handleToggle = () => {
		if (isOpen && !value) {
			setIsOpen(false);
		} else {
			setIsOpen(true);
		}
	};

	const handleClear = () => {
		onChange("");
		inputRef.current?.focus();
	};

	return (
		<div className="fixed bottom-24 md:bottom-6 right-6 z-50">
			<div
				ref={containerRef}
				className={cn(
					"flex items-center bg-background shadow-lg transition-all duration-300 ease-in-out overflow-hidden border border-border",
					isOpen
						? "w-[300px] rounded-2xl pl-4 pr-1 h-14"
						: "w-14 h-14 rounded-2xl justify-center cursor-pointer bg-primary hover:bg-primary/90 border-transparent",
				)}
				onClick={!isOpen ? handleToggle : undefined}
			>
				{isOpen ? (
					<>
						<Search className="w-5 h-5 text-muted-foreground flex-shrink-0 mr-2" />
						<Input
							ref={inputRef}
							value={value}
							onChange={(e) => onChange(e.target.value)}
							placeholder={placeholder}
							className="border-0 focus-visible:ring-0 px-0 h-full bg-transparent shadow-none"
						/>
						<Button
							variant="ghost"
							size="icon"
							className="flex-shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground rounded-full ml-1"
							onClick={(e) => {
								e.stopPropagation();
								if (value) {
									handleClear();
								} else {
									setIsOpen(false);
								}
							}}
						>
							<X className="w-4 h-4" />
						</Button>
					</>
				) : (
					<Search className="w-6 h-6 text-primary-foreground" />
				)}
			</div>
		</div>
	);
}
