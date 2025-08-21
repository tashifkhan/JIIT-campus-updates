"use client";

import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon } from "lucide-react";

export default function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		setTheme(theme === "cream" ? "ocean" : "cream");
	};

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={toggleTheme}
			className="w-9 h-9 p-0"
			aria-label="Toggle theme"
		>
			{theme === "cream" ? (
				<MoonIcon className="w-4 h-4" />
			) : (
				<SunIcon className="w-4 h-4" />
			)}
		</Button>
	);
}
