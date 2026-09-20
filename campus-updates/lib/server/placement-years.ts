import "server-only";

export const DEFAULT_PLACEMENT_YEAR =
	process.env.DEFAULT_PLACEMENT_YEAR || "202526";

const SUPPORTED_PLACEMENT_YEARS = new Set([
	DEFAULT_PLACEMENT_YEAR,
	...(process.env.SUPPORTED_PLACEMENT_YEARS || "202526,202627")
		.split(",")
		.map((year) => year.trim())
		.filter(Boolean),
]);

export function resolvePlacementYear(value: string | null): string | null {
	const year = value || DEFAULT_PLACEMENT_YEAR;
	return SUPPORTED_PLACEMENT_YEARS.has(year) ? year : null;
}
