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
				className="w-9 h-9 p-0 hover:bg-transparent rounded-full"
				aria-label={`Toggle theme, currently ${label}`}
			>
				{isLight ? (
					<img
						src="/icons/night-mode.png"
						alt="Dark mode"
						className="w-5 h-5 object-contain dark:invert"
					/>
				) : (
					<img
						src="/icons/light-mode.png"
						alt="Light mode"
						className="w-5 h-5 object-contain dark:invert"
					/>
				)}
			</Button>
		);
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={toggleTheme}
			className="w-full justify-center px-3 py-2 gap-3 hover:bg-accent/50"
			aria-label={`Toggle theme, currently ${label}`}
		>
			{isLight ? (
				<img
					src="/icons/night-mode.png"
					alt="Dark mode"
					className="w-5 h-5 object-contain dark:invert"
				/>
			) : (
				<img
					src="/icons/light-mode.png"
					alt="Light mode"
					className="w-5 h-5 object-contain dark:invert"
				/>
			)}
			<span className="text-sm font-medium">{label}</span>
		</Button>
	);
}
