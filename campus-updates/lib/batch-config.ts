// Year-aware batch config: total students, branches, enrollment ranges.
// Source of truth is `@/app/stats/batch_config.json`, keyed by compact
// placement year ("202526", "202627").

import batchConfig from "@/app/stats/batch_config.json";

export type BatchYearConfig = {
	label: string;
	graduating_batch: string;
	student_counts: Record<string, Record<string, number>>;
	enrollment_ranges: Record<string, Record<string, { start: number; end: number }>>;
	excluded_branches: string[];
};

type BatchConfigFile = Record<string, BatchYearConfig | string>;

const DEFAULT_YEAR = "202526";
const DEFAULT_EXCLUDED = ["JUIT", "Other", "MTech"];

function normalizeYear(value?: string | null): string {
	const digits = String(value || "").replace(/\D/g, "");
	return digits.length === 6 ? digits : DEFAULT_YEAR;
}

function configForYear(year?: string | null): BatchYearConfig | null {
	const key = normalizeYear(year);
	const entry = (batchConfig as unknown as BatchConfigFile)[key];
	if (entry && typeof entry === "object") return entry as BatchYearConfig;
	// Also accept label form ("2025-26") by matching `label`.
	for (const [k, v] of Object.entries(batchConfig as unknown as BatchConfigFile)) {
		if (k.startsWith("_")) continue;
		if (v && typeof v === "object" && (v as BatchYearConfig).label === year) {
			return v as BatchYearConfig;
		}
	}
	return null;
}

export function getBatchConfig(year?: string | null): BatchYearConfig {
	const found = configForYear(year);
	if (found) return found;
	// Fallback to the default year config (batch_config.json is the only source).
	const fallback = configForYear(DEFAULT_YEAR);
	if (fallback) return fallback;
	throw new Error("Missing batch config for default year 202526");
}

export function getEnrollmentRangesForYear(
	year?: string | null,
): Record<string, Record<string, { start: number; end: number }>> {
	const cfg = configForYear(year) ?? configForYear(DEFAULT_YEAR);
	if (!cfg) throw new Error("Missing batch config for default year 202526");
	return cfg.enrollment_ranges;
}

export function getStudentCountsForYear(
	year?: string | null,
): Record<string, Record<string, number>> {
	const cfg = configForYear(year) ?? configForYear(DEFAULT_YEAR);
	if (!cfg) throw new Error("Missing batch config for default year 202526");
	return cfg.student_counts;
}

export function getExcludedBranchesForYear(year?: string | null): Set<string> {
	return new Set(
		configForYear(year)?.excluded_branches ?? DEFAULT_EXCLUDED,
	);
}

export function getBranchTotalsForYear(year?: string | null): Record<string, number> {
	const counts = getStudentCountsForYear(year);
	const excluded = getExcludedBranchesForYear(year);
	const totals: Record<string, number> = {};
	for (const [branch, sub] of Object.entries(counts)) {
		if (excluded.has(branch)) continue;
		if (sub && typeof sub === "object") {
			totals[branch] = Object.values(sub).reduce(
				(sum, c) => sum + Number(c || 0),
				0,
			);
		} else if (typeof sub === "number") {
			totals[branch] = sub as unknown as number;
		}
	}
	return totals;
}

// Back-compat alias (old name used across stats code).
export const getBranchTotals = getBranchTotalsForYear;

export function getTotalStudentsForYear(year?: string | null): number {
	// Derived from student_counts (single source): sum of per-branch totals.
	return Object.values(getBranchTotalsForYear(year)).reduce((a, b) => a + b, 0);
}

export function getBranchesForYear(year?: string | null): Record<string, Record<string, number>> {
	// Derived from student_counts (single source): { total, ...campus/sub counts }.
	const counts = getStudentCountsForYear(year);
	const out: Record<string, Record<string, number>> = {};
	for (const [branch, sub] of Object.entries(counts)) {
		if (sub && typeof sub === "object") {
			const total = Object.values(sub).reduce((a, b) => a + Number(b || 0), 0);
			out[branch] = { total, ...(sub as Record<string, number>) };
		}
	}
	return out;
}

export type BranchRange = { branch: string; start: number; end: number };

export function buildBranchRangesFromConfig(
	rangesJson: Record<string, Record<string, { start: number; end: number }>>,
): BranchRange[] {
	const ranges: BranchRange[] = [];
	if (!rangesJson || typeof rangesJson !== "object") return ranges;
	for (const [branch, data] of Object.entries(rangesJson)) {
		if (!data || typeof data !== "object") continue;
		for (const entry of Object.values(data)) {
			if (
				entry &&
				typeof entry.start === "number" &&
				typeof entry.end === "number"
			) {
				ranges.push({ branch, start: entry.start, end: entry.end });
			}
		}
	}
	return ranges.sort((a, b) => a.start - b.start);
}

export function getBranchRangesForYear(year?: string | null): BranchRange[] {
	return buildBranchRangesFromConfig(getEnrollmentRangesForYear(year));
}

export function getAvailableBatchYears(): Array<{
	value: string;
	label: string;
	graduating_batch: string;
	total_students: number;
}> {
	return Object.entries(batchConfig as unknown as BatchConfigFile)
		.filter(([k, v]) => !k.startsWith("_") && v && typeof v === "object")
		.map(([value, v]) => {
			const cfg = v as BatchYearConfig;
			return {
				value,
				label: cfg.label,
				graduating_batch: cfg.graduating_batch,
				total_students: getTotalStudentsForYear(value),
			};
		})
		.sort((a, b) => a.value.localeCompare(b.value));
}
