"use client";

import {
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
	useState,
	type ReactNode,
} from "react";

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
	typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type PlacementYear = { value: string; label: string };

// Supported academic years. `value` is the compact form passed to the API as
// ?year=; the reader API maps it to the per-year MongoDB database.
export const PLACEMENT_YEARS: PlacementYear[] = [
	{ value: "202526", label: "2025-26" },
	{ value: "202627", label: "2026-27" },
];

const DEFAULT_YEAR = "202526";
const STORAGE_KEY = "placement_year";

type PlacementYearContextValue = {
	year: string;
	setYear: (year: string) => void;
	years: PlacementYear[];
};

const PlacementYearContext = createContext<PlacementYearContextValue | null>(
	null,
);

function readStoredYear(): string | null {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved && PLACEMENT_YEARS.some((y) => y.value === saved)
			? saved
			: null;
	} catch {
		return null;
	}
}

export function PlacementYearProvider({ children }: { children: ReactNode }) {
	// Start from the default so server and first client render match, then adopt
	// the stored year in a layout effect — before paint and before data hooks
	// fire, so a reload doesn't flash the default year's data.
	const [year, setYearState] = useState<string>(DEFAULT_YEAR);

	useIsomorphicLayoutEffect(() => {
		const saved = readStoredYear();
		if (saved && saved !== year) setYearState(saved);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Keep other tabs of the app in sync when the year changes.
	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key !== STORAGE_KEY) return;
			const saved = readStoredYear();
			if (saved) setYearState(saved);
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	const setYear = (next: string) => {
		setYearState(next);
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {}
	};

	return (
		<PlacementYearContext.Provider
			value={{ year, setYear, years: PLACEMENT_YEARS }}
		>
			{children}
		</PlacementYearContext.Provider>
	);
}

export function usePlacementYear(): PlacementYearContextValue {
	const ctx = useContext(PlacementYearContext);
	if (!ctx) {
		// Graceful fallback when used outside the provider.
		return { year: DEFAULT_YEAR, setYear: () => {}, years: PLACEMENT_YEARS };
	}
	return ctx;
}
