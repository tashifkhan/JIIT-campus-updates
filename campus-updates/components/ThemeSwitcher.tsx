"use client";

import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon } from "lucide-react";

export default function ThemeSwitcher({
	compact = false,
}: {
	compact?: boolean;
}) {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		setTheme(theme === "cream" ? "ocean" : "cream");
	};

	const isLight = theme === "cream";
	const label = isLight ? "Light theme" : "Dark theme";

	if (compact) {
		return (
			<Button
				variant="ghost"
				size="sm"
				onClick={toggleTheme}
				className="w-9 h-9 p-0"
				aria-label={`Toggle theme, currently ${label}`}
			>
				{isLight ? (
					<MoonIcon className="w-4 h-4" />
				) : (
					<SunIcon className="w-4 h-4" />
				)}
			</Button>
		);
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={toggleTheme}
			className="w-full justify-center px-3 py-2 gap-3"
			aria-label={`Toggle theme, currently ${label}`}
		>
			{isLight ? (
				<SunIcon className="w-5 h-5" />
			) : (
				<MoonIcon className="w-5 h-5" />
			)}
			<span className="text-sm font-medium">{label}</span>
		</Button>
	);
}
