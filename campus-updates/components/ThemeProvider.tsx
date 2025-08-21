"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useRef,
} from "react";

const themes = {
	cream: {
		"--bg-color": "#fdf6e3",
		"--primary-color": "#f5e9da",
		"--accent-color": "#A47551",
		"--text-color": "#3b2f1e",
		"--card-bg": "#f7f1e1",
		"--label-color": "#8b7355",
		"--border-color": "#e6d3b8",
		"--hover-color": "#f0e2d0",
		"--radius": "12px",
	},
	ocean: {
		"--bg-color": "#191c20",
		"--primary-color": "#232e39",
		"--accent-color": "#7ec3f0",
		"--text-color": "#ffffff",
		"--card-bg": "#1b232b",
		"--label-color": "#9CA3AF",
		"--border-color": "#374151",
		"--hover-color": "#2d3748",
		"--radius": "12px",
	},
};

const ThemeContext = createContext<{
	theme: string;
	setTheme: (theme: string) => void;
	radius: number;
	setRadius: (radius: number) => void;
}>({
	theme: "cream",
	setTheme: () => {},
	radius: 12,
	setRadius: () => {},
});

const SystemColorModeContext = createContext({
	systemColorMode: "light", // "dark" or "light"
});

export const useTheme = () => useContext(ThemeContext);
export const useSystemColorMode = () => useContext(SystemColorModeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	// System color mode detection
	const getSystemColorMode = () =>
		typeof window !== "undefined" &&
		window.matchMedia &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";

	const [systemColorMode, setSystemColorMode] = useState(getSystemColorMode());

	// Track if user has chosen a theme (not just default)
	const userHasChosenThemeRef = useRef(false);

	// --- Theme state ---
	const [theme, setThemeState] = useState(() => {
		if (typeof window === "undefined") return "cream";

		const saved = localStorage.getItem("theme");
		if (saved && themes[saved as keyof typeof themes]) {
			userHasChosenThemeRef.current = true;
			return saved;
		}
		// No saved theme: use system color mode
		return getSystemColorMode() === "dark" ? "ocean" : "cream";
	});

	const [radius, setRadius] = useState(() => {
		if (typeof window === "undefined") return 12;

		const saved = localStorage.getItem("radius");
		return saved ? Number(saved) : 12;
	});

	// Patch setTheme to mark user choice
	const setTheme = (val: string) => {
		userHasChosenThemeRef.current = true;
		setThemeState(val);
	};

	// Listen for system color mode changes
	useEffect(() => {
		if (typeof window === "undefined") return;

		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (e: MediaQueryListEvent) => {
			const newMode = e.matches ? "dark" : "light";
			setSystemColorMode(newMode);
			// Only auto-switch if user hasn't chosen a theme
			const saved = localStorage.getItem("theme");
			if (
				!userHasChosenThemeRef.current &&
				(!saved || saved === "ocean" || saved === "cream")
			) {
				setThemeState(newMode === "dark" ? "ocean" : "cream");
			}
		};

		if (mql.addEventListener) {
			mql.addEventListener("change", handleChange);
		} else {
			// Fallback for older browsers
			mql.addListener(handleChange);
		}

		return () => {
			if (mql.removeEventListener) {
				mql.removeEventListener("change", handleChange);
			} else {
				mql.removeListener(handleChange);
			}
		};
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const themeVars = {
			...themes[theme as keyof typeof themes],
			"--radius": radius + "px",
		};

		Object.entries(themeVars).forEach(([key, value]) => {
			document.documentElement.style.setProperty(key, value);
		});

		// Update CSS custom properties for shadcn/ui components
		const root = document.documentElement;
		if (theme === "ocean") {
			root.classList.add("dark");
			root.classList.remove("light");
		} else {
			root.classList.add("light");
			root.classList.remove("dark");
		}

		localStorage.setItem("theme", theme);
		localStorage.setItem("radius", radius.toString());
	}, [theme, radius]);

	return (
		<SystemColorModeContext.Provider value={{ systemColorMode }}>
			<ThemeContext.Provider
				value={{
					theme,
					setTheme,
					radius,
					setRadius,
				}}
			>
				{children}
			</ThemeContext.Provider>
		</SystemColorModeContext.Provider>
	);
};
