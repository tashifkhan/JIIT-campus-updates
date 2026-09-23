import "server-only";

import {
	getBranchRangesForYear,
	getBranchTotalsForYear,
	getExcludedBranchesForYear,
	getTotalStudentsForYear,
	type BranchRange,
} from "@/lib/batch-config";
import {
	BranchStatsData,
	CampusCompany,
	CampusRouteSummary,
	CampusStatsData,
	CompanyStatsData,
	PackageDistributionPoint,
	StatsPackageSummary,
	StatsSummary,
	StatsTimelinePoint,
} from "@/lib/stats-api";
import {
	CampusRoute,
	Placement,
	Role,
	Student,
	StudentWithPlacement,
	getCampusRoute,
	getStudentOfferDate,
	getStudentPackage,
} from "@/lib/stats";
import { getCollection } from "@/lib/server/data";

const PACKAGE_RANGES = [
	{ label: "0-3", min: 0, max: 3 },
	{ label: "3-4", min: 3, max: 4 },
	{ label: "4-5", min: 4, max: 5 },
	{ label: "5-6", min: 5, max: 6 },
	{ label: "6-7", min: 6, max: 7 },
	{ label: "7-8", min: 7, max: 8 },
	{ label: "8-9", min: 8, max: 9 },
	{ label: "9-10", min: 9, max: 10 },
	{ label: "10-12", min: 10, max: 12 },
	{ label: "12-15", min: 12, max: 15 },
	{ label: "15-18", min: 15, max: 18 },
	{ label: "18-20", min: 18, max: 20 },
	{ label: "20-25", min: 20, max: 25 },
	{ label: "25-30", min: 25, max: 30 },
	{ label: "30-35", min: 30, max: 35 },
	{ label: "35-40", min: 35, max: 40 },
	{ label: "40-50", min: 40, max: 50 },
	{ label: "50+", min: 50, max: Number.POSITIVE_INFINITY },
] as const;

const PLACEMENT_PROJECTION = {
	_id: 1,
	company: 1,
	roles: 1,
	job_location: 1,
	joining_date: 1,
	students_selected: 1,
	createdAt: 1,
	created_at: 1,
	time_sent: 1,
	saved_at: 1,
	likely_on_campus: 1,
	on_campus_confidence: 1,
	email_subject: 1,
	matched_job_id: 1,
	related_job_id: 1,
	on_campus_reason: 1,
	on_campus_ppo: 1,
} as const;

type MutableBranchStats = {
	count: number;
	enrollments: Set<string>;
	studentPackages: Map<string, number>;
};

function numericValue(value: unknown): number | null {
	if (value == null || value === "") return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function dateValue(value: unknown): string | number | undefined {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "string" || typeof value === "number") return value;
	return undefined;
}

function normalizeRole(value: unknown): Role {
	const role = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
	return {
		role: String(role.role || ""),
		package: numericValue(role.package),
		package_details: role.package_details == null ? null : String(role.package_details),
	};
}

function normalizeStudent(value: unknown): Student {
	const student = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
	const packageValue = numericValue(student.package);
	return {
		name: String(student.name || ""),
		enrollment_number: String(student.enrollment_number || student.enrollment || ""),
		enrollment: student.enrollment == null ? undefined : String(student.enrollment),
		role: String(student.role || ""),
		package: packageValue,
		offer_received_at: dateValue(student.offer_received_at) as string | undefined,
		offerReceivedAt: numericValue(student.offerReceivedAt),
	};
}

function normalizePlacement(value: Record<string, unknown>): Placement {
	const students = Array.isArray(value.students_selected)
		? value.students_selected.map(normalizeStudent)
		: [];
	return {
		_id: value._id == null ? undefined : String(value._id),
		company: String(value.company || ""),
		roles: Array.isArray(value.roles) ? value.roles.map(normalizeRole) : [],
		job_location: Array.isArray(value.job_location)
			? value.job_location.map(String)
			: null,
		joining_date: value.joining_date == null ? null : String(value.joining_date),
		students_selected: students,
		number_of_offers: students.length,
		createdAt: dateValue(value.createdAt),
		created_at: dateValue(value.created_at) as string | undefined,
		time_sent: dateValue(value.time_sent) as string | undefined,
		saved_at: dateValue(value.saved_at) as string | undefined,
		likely_on_campus: value.likely_on_campus === true,
		on_campus_confidence: confidenceValue(value.on_campus_confidence),
		campus_tagged: value.on_campus_confidence != null,
		on_campus_reason:
			typeof value.on_campus_reason === "string" ? value.on_campus_reason : null,
		on_campus_ppo: value.on_campus_ppo === true,
		email_subject: value.email_subject == null ? null : String(value.email_subject),
		matched_job_id:
			value.matched_job_id == null && value.related_job_id == null
				? null
				: String(value.matched_job_id ?? value.related_job_id),
	};
}

function confidenceValue(value: unknown): number | null {
	const number = numericValue(value);
	return number == null ? null : Math.min(1, Math.max(0, number));
}

// Per-year branch ranges, cached by placement year. The batch config holds
// enrollment ranges per year (202526 -> 221xxxx, 202627 -> 231xxxx, ...).
const branchRangesCache = new Map<string, BranchRange[]>();

function branchRangesForYear(year?: string | null): BranchRange[] {
	const key = String(year || "202526");
	let cached = branchRangesCache.get(key);
	if (!cached) {
		cached = getBranchRangesForYear(key);
		branchRangesCache.set(key, cached);
	}
	return cached;
}

function digitsOnly(value: string): string {
	let digits = "";
	for (const character of value) {
		if (character >= "0" && character <= "9") digits += character;
	}
	return digits;
}

function containsLetter(value: string): boolean {
	for (const character of value.toLowerCase()) {
		if (character >= "a" && character <= "z") return true;
	}
	return false;
}

export function getStatsBranch(enrollment: string, year?: string | null): string {
	if (!enrollment) return "Other";
	const digits = digitsOnly(enrollment);
	if (containsLetter(enrollment) || digits.length === 9) return "JUIT";
	if (digits.startsWith("24")) return "MTech";
	if (!digits) return "Other";
	const number = Number(digits);
	if (!Number.isFinite(number)) return "Other";
	for (const range of branchRangesForYear(year)) {
		if (number >= range.start && number < range.end) return range.branch;
	}
	return "Other";
}

async function loadPlacements(year: string): Promise<Placement[]> {
	const collection = await getCollection("PlacementOffers", year);
	const documents = await collection
		.find({}, { projection: PLACEMENT_PROJECTION })
		.sort({ createdAt: -1 })
		.limit(1000)
		.toArray();
	return documents.map((document) => normalizePlacement(document));
}

function flattenStudents(placements: Placement[]): StudentWithPlacement[] {
	return placements.flatMap((placement) =>
		placement.students_selected.map((student) => ({
			...student,
			company: placement.company,
			roles: placement.roles,
			joining_date: placement.joining_date || undefined,
			job_location: placement.job_location,
			placement,
		})),
	);
}

function includedStudents(
	students: StudentWithPlacement[],
	year?: string | null,
): StudentWithPlacement[] {
	const excluded = getExcludedBranchesForYear(year);
	return students.filter(
		(student) => !excluded.has(getStatsBranch(student.enrollment_number, year)),
	);
}

function matchesSearch(student: StudentWithPlacement, query: string): boolean {
	if (!query) return true;
	return [student.name, student.enrollment_number, student.role, student.company].some(
		(value) => String(value || "").toLowerCase().includes(query),
	);
}

function average(values: number[]): number {
	return values.length
		? values.reduce((sum, value) => sum + value, 0) / values.length
		: 0;
}

function median(values: number[]): number {
	if (!values.length) return 0;
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2
		? sorted[middle]
		: (sorted[middle - 1] + sorted[middle]) / 2;
}

function packageSummary(students: StudentWithPlacement[]): StatsPackageSummary {
	const maximumByStudent = new Map<string, number>();
	for (const student of students) {
		if (!student.enrollment_number) continue;
		const packageValue = getStudentPackage(student, student.placement);
		if (packageValue == null || packageValue <= 0) continue;
		const current = maximumByStudent.get(student.enrollment_number) || 0;
		if (packageValue > current) maximumByStudent.set(student.enrollment_number, packageValue);
	}
	const packages = Array.from(maximumByStudent.values());
	return {
		avg: average(packages),
		median: median(packages),
		highest: packages.length ? Math.max(...packages) : 0,
	};
}

function uniqueStudentCount(students: StudentWithPlacement[]): number {
	return new Set(
		students.map((student) => student.enrollment_number).filter(Boolean),
	).size;
}

export async function getStatsSummary(year: string, query: string): Promise<StatsSummary> {
	const placements = await loadPlacements(year);
	const allStudents = flattenStudents(placements);
	const included = includedStudents(allStudents, year);
	const filtered = included.filter((student) => matchesSearch(student, query));
	const overallPackages = packageSummary(included);
	const filteredPackages = packageSummary(filtered);
	const branchTotals = getBranchTotalsForYear(year);
	const countedBranches = new Set(Object.keys(branchTotals));
	const totalStudents = getTotalStudentsForYear(year);
	const placedInCountedBranches = (students: StudentWithPlacement[]) =>
		new Set(
			students
				.filter((student) => countedBranches.has(getStatsBranch(student.enrollment_number, year)))
				.map((student) => student.enrollment_number)
				.filter(Boolean),
		).size;
	const overallPlaced = placedInCountedBranches(included);
	const filteredPlaced = placedInCountedBranches(filtered);
	const onCampus = filtered.filter((student) => getCampusRoute(student.placement) === "on");
	const filteredCompanies = new Set(filtered.map((student) => student.company));

	return {
		placement: {
			placed: filteredPlaced,
			total: totalStudents,
			pct: totalStudents ? (filteredPlaced / totalStudents) * 100 : 0,
			overallPct: totalStudents ? (overallPlaced / totalStudents) * 100 : 0,
		},
		packages: {
			...filteredPackages,
			overallAvg: overallPackages.avg,
			overallMedian: overallPackages.median,
			overallHighest: overallPackages.highest,
		},
		companies: {
			filtered: new Set(filtered.map((student) => student.company)).size,
			total: new Set(allStudents.map((student) => student.company)).size,
		},
		offers: {
			filteredUniqueStudents: uniqueStudentCount(filtered),
			totalUniqueStudents: uniqueStudentCount(included),
			filteredTotalOffers: filtered.length,
			totalOffers: included.length,
		},
		campus: {
			likelyOffers: onCampus.length,
			totalOffers: filtered.length,
			pct: filtered.length ? (onCampus.length / filtered.length) * 100 : 0,
			likelyCompanies: new Set(onCampus.map((student) => student.company)).size,
			totalCompanies: filteredCompanies.size,
		},
	};
}

export async function getBranchStats(year: string, query: string): Promise<BranchStatsData> {
	const placements = await loadPlacements(year);
	const branchTotals = getBranchTotalsForYear(year);
	const students = includedStudents(flattenStudents(placements), year).filter((student) =>
		matchesSearch(student, query),
	);
	const mutable: Record<string, MutableBranchStats> = {};
	const offerPackages: Record<string, number[]> = {};

	for (const student of students) {
		const branch = getStatsBranch(student.enrollment_number, year);
		mutable[branch] ||= {
			count: 0,
			enrollments: new Set(),
			studentPackages: new Map(),
		};
		offerPackages[branch] ||= [];
		mutable[branch].count += 1;
		if (student.enrollment_number) mutable[branch].enrollments.add(student.enrollment_number);
		const packageValue = getStudentPackage(student, student.placement);
		if (packageValue == null || packageValue <= 0) continue;
		offerPackages[branch].push(packageValue);
		if (!student.enrollment_number) continue;
		const current = mutable[branch].studentPackages.get(student.enrollment_number) || 0;
		if (packageValue > current) {
			mutable[branch].studentPackages.set(student.enrollment_number, packageValue);
		}
	}

	const branches = Object.fromEntries(
		Object.entries(mutable).map(([branch, stats]) => {
			const packages = Array.from(stats.studentPackages.values());
			const total = branchTotals[branch] || 0;
			const uniqueCount = stats.enrollments.size;
			return [
				branch,
				{
					count: stats.count,
					uniqueCount,
					avgPackage: average(packages),
					highest: packages.length ? Math.max(...packages) : 0,
					median: median(packages),
					total,
					pct: total ? (uniqueCount / total) * 100 : null,
				},
			];
		}),
	);
	const availableBranches = Object.keys(branches).sort();
	const points = PACKAGE_RANGES.map((range) => {
		const point: PackageDistributionPoint = {
			range: range.label,
			Overall: 0,
		};
		for (const branch of availableBranches) point[branch] = 0;
		return point;
	});
	const allOfferPackages: number[] = [];

	for (const [branch, packages] of Object.entries(offerPackages)) {
		for (const packageValue of packages) {
			allOfferPackages.push(packageValue);
			const index = PACKAGE_RANGES.findIndex(
				(range) => packageValue >= range.min && packageValue < range.max,
			);
			if (index >= 0) {
				points[index].Overall = Number(points[index].Overall) + 1;
				points[index][branch] = Number(points[index][branch]) + 1;
			}
		}
	}

	return {
		branches,
		distribution: {
			availableBranches,
			points,
			overall: { offers: students.length, avgPackage: average(allOfferPackages) },
			branches: Object.fromEntries(
				availableBranches.map((branch) => [
					branch,
					{
						offers: mutable[branch].count,
						packageCount: (offerPackages[branch] || []).length,
						avgPackage: average(offerPackages[branch] || []),
					},
				]),
			),
		},
	};
}

export async function getCompanyStats(year: string, query: string): Promise<CompanyStatsData> {
	const placements = await loadPlacements(year);
	const allStudents = flattenStudents(placements);
	const students = query
		? includedStudents(allStudents, year).filter((student) => matchesSearch(student, query))
		: allStudents;
	const companies = new Map<
		string,
		{
			studentsCount: number;
			packages: number[];
			fallbackPackage: number;
			onCampusConfidence: number | null;
			campusRoute: CampusRoute;
		}
	>();

	for (const student of students) {
		if (!companies.has(student.company)) {
			const rolePackages = student.placement.roles
				.map((role) => role.package)
				.filter(
					(packageValue): packageValue is number =>
						packageValue != null && packageValue > 0,
				);
			companies.set(student.company, {
				studentsCount: 0,
				packages: [],
				fallbackPackage: rolePackages.length ? Math.max(...rolePackages) : 0,
				onCampusConfidence: student.placement.likely_on_campus
					? student.placement.on_campus_confidence ?? null
					: null,
				campusRoute: getCampusRoute(student.placement),
			});
		}
		const company = companies.get(student.company)!;
		company.studentsCount += 1;
		const packageValue = getStudentPackage(student, student.placement);
		if (packageValue != null && packageValue > 0) company.packages.push(packageValue);
	}

	const data = Array.from(companies, ([company, stats]) => ({
		company,
		studentsCount: stats.studentsCount,
		avgPackage: average(stats.packages),
		fallbackPackage: stats.fallbackPackage,
		onCampusConfidence: stats.onCampusConfidence,
		campusRoute: stats.campusRoute,
	})).sort((left, right) => left.company.localeCompare(right.company));
	return { companies: data, total: data.length };
}

function objectIdDate(placement: Placement): Date | null {
	if (!placement._id || placement._id.length < 8) return null;
	const timestamp = Number.parseInt(placement._id.slice(0, 8), 16) * 1000;
	const date = new Date(timestamp);
	return Number.isNaN(date.getTime()) ? null : date;
}

export async function getTimelineStats(
	year: string,
	query: string,
	timeFrame: "month" | "day",
	cumulative: boolean,
): Promise<StatsTimelinePoint[]> {
	const allPlacements = await loadPlacements(year);
	const excluded = getExcludedBranchesForYear(year);
	const placements = query
		? allPlacements.filter((placement) =>
				includedStudents(flattenStudents([placement]), year).some((student) =>
					matchesSearch(student, query),
				),
			)
		: allPlacements;
	const events = placements
		.flatMap((placement) =>
			placement.students_selected.map((student) => ({
				placement,
				student,
				date: getStudentOfferDate(student, placement) || objectIdDate(placement),
			})),
		)
		.filter(
			(event): event is typeof event & { date: Date } =>
				event.date !== null &&
				!excluded.has(getStatsBranch(event.student.enrollment_number, year)),
		)
		.sort((left, right) => left.date.getTime() - right.date.getTime());
	const groups = new Map<
		string,
		{
			date: string;
			timestamp: number;
			enrollments: Set<string>;
			offers: number;
			packages: Map<string, number>;
		}
	>();

	for (const event of events) {
		const key =
			timeFrame === "month"
				? event.date.toLocaleString("default", { month: "short", year: "numeric" })
				: event.date.toISOString().split("T")[0];
		if (!groups.has(key)) {
			groups.set(key, {
				date: key,
				timestamp: event.date.getTime(),
				enrollments: new Set(),
				offers: 0,
				packages: new Map(),
			});
		}
		const group = groups.get(key)!;
		group.offers += 1;
		if (!event.student.enrollment_number) continue;
		group.enrollments.add(event.student.enrollment_number);
		const packageValue = getStudentPackage(event.student, event.placement);
		if (packageValue == null || packageValue <= 0) continue;
		const current = group.packages.get(event.student.enrollment_number) || 0;
		if (packageValue > current) group.packages.set(event.student.enrollment_number, packageValue);
	}

	const sortedGroups = Array.from(groups.values()).sort(
		(left, right) => left.timestamp - right.timestamp,
	);
	const runningEnrollments = new Set<string>();
	const runningPackages = new Map<string, number>();
	let runningOffers = 0;

	return sortedGroups.map((group) => {
		if (cumulative) {
			group.enrollments.forEach((enrollment) => runningEnrollments.add(enrollment));
			runningOffers += group.offers;
			group.packages.forEach((packageValue, enrollment) => {
				const current = runningPackages.get(enrollment) || 0;
				if (packageValue > current) runningPackages.set(enrollment, packageValue);
			});
		}
		const packages = Array.from(
			(cumulative ? runningPackages : group.packages).values(),
		);
		return {
			date: group.date,
			timestamp: group.timestamp,
			uniqueStudents: cumulative ? runningEnrollments.size : group.enrollments.size,
			totalOffers: cumulative ? runningOffers : group.offers,
			avgPackage: Number(average(packages).toFixed(2)),
			medianPackage: Number(median(packages).toFixed(2)),
		};
	});
}

const CAMPUS_ROUTES: CampusRoute[] = ["on", "ppo", "off"];

const CAMPUS_BANDS = [
	{ label: "< 4.6", min: 0, max: 4.6 },
	{ label: "4.6-6", min: 4.6, max: 6 },
	{ label: "6-10", min: 6, max: 10 },
	{ label: "10-15", min: 10, max: 15 },
	{ label: "15-25", min: 15, max: 25 },
	{ label: "25+", min: 25, max: Number.POSITIVE_INFINITY },
] as const;

const CONFIDENCE_BUCKETS = [
	{ label: "90%+", min: 0.9 },
	{ label: "80-90%", min: 0.8 },
	{ label: "70-80%", min: 0.7 },
	{ label: "Below 70%", min: 0 },
] as const;

// Suffixes that differ between the mail and the SuperSet listing of one company.
const COMPANY_SUFFIXES = new Set([
	"inc", "incorporated", "ltd", "limited", "llc", "llp", "plc", "pvt", "private",
	"corp", "corporation", "co", "company", "technologies", "technology",
	"solutions", "services", "systems", "software", "india", "global", "group",
	"holdings", "labs", "the",
]);

function tokenize(name: string): string[] {
	return name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9&]+/g, " ")
		.split(" ")
		.filter((token) => token && !COMPANY_SUFFIXES.has(token));
}

/**
 * Candidate names for one company string. "JTG (Josh Technology Group)" yields
 * both the outer name and the bracketed one, since either side can be the brand.
 */
function companyTokens(name: string): string[][] {
	const names = [name.replace(/\(.*?\)/g, " ")];
	for (const match of Array.from(name.matchAll(/\(([^)]+)\)/g))) {
		names.push(match[1].replace(/^(formerly|previously)\s+/i, ""));
	}
	return names.map(tokenize).filter((tokens) => tokens.length);
}

/** Same company when one name's tokens all appear in the other's. */
function sameCompany(left: string[][], right: string[][]): boolean {
	return left.some((a) =>
		right.some((b) => {
			const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
			const pool = new Set(longer);
			return shorter.every((token) => pool.has(token));
		}),
	);
}

type JobSummary = {
	id: string;
	tokens: string[][];
	category: string | null;
	lpa: number | null;
};

async function loadJobSummaries(year: string): Promise<JobSummary[]> {
	const collection = await getCollection("Jobs", year);
	const documents = await collection
		.find(
			{},
			{ projection: { id: 1, company: 1, package: 1, annum_months: 1, placement_category: 1 } },
		)
		.toArray();
	return documents.map((document) => {
		const amount = numericValue(document.package);
		const monthly = String(document.annum_months || "").toLowerCase().startsWith("month");
		return {
			id: String(document.id ?? document._id),
			tokens: companyTokens(String(document.company || "")),
			category: document.placement_category ? String(document.placement_category) : null,
			lpa: amount && amount > 0 ? (monthly ? (amount * 12) / 1e5 : amount / 1e5) : null,
		};
	});
}

function routeSummary(students: StudentWithPlacement[]): CampusRouteSummary {
	const packages = students
		.map((student) => getStudentPackage(student, student.placement))
		.filter((value): value is number => value != null && value > 0);
	const perStudent = packageSummary(students);
	return {
		offers: students.length,
		students: uniqueStudentCount(students),
		companies: new Set(students.map((student) => student.company)).size,
		avgPackage: average(packages),
		medianPackage: median(packages),
		highestPackage: packages.length ? Math.max(...packages) : 0,
		studentAvgPackage: perStudent.avg,
		studentMedianPackage: perStudent.median,
	};
}

function monthKey(date: Date): string {
	return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export async function getCampusStats(year: string, query: string): Promise<CampusStatsData> {
	const [placements, jobs] = await Promise.all([loadPlacements(year), loadJobSummaries(year)]);
	const students = includedStudents(flattenStudents(placements), year).filter((student) =>
		matchesSearch(student, query),
	);
	const byRoute = Object.fromEntries(
		CAMPUS_ROUTES.map((route) => [
			route,
			students.filter((student) => getCampusRoute(student.placement) === route),
		]),
	) as Record<CampusRoute, StudentWithPlacement[]>;

	// Per student: every route they got an offer from, and the route of their best offer.
	const perStudent = new Map<string, { routes: Set<CampusRoute>; best: number; bestRoute: CampusRoute; offers: number; branch: string }>();
	for (const student of students) {
		if (!student.enrollment_number) continue;
		const route = getCampusRoute(student.placement);
		const packageValue = getStudentPackage(student, student.placement) ?? 0;
		const entry = perStudent.get(student.enrollment_number) ?? {
			routes: new Set<CampusRoute>(),
			best: -1,
			bestRoute: route,
			offers: 0,
			branch: getStatsBranch(student.enrollment_number, year),
		};
		entry.routes.add(route);
		entry.offers += 1;
		if (packageValue > entry.best) {
			entry.best = packageValue;
			entry.bestRoute = route;
		}
		perStudent.set(student.enrollment_number, entry);
	}
	const studentEntries = Array.from(perStudent.values());
	const countBest = (route: CampusRoute) =>
		studentEntries.filter((entry) => entry.bestRoute === route).length;

	const branchTotals = getBranchTotalsForYear(year);
	const branches = Object.entries(branchTotals).map(([branch, total]) => {
		const entries = studentEntries.filter((entry) => entry.branch === branch);
		const onPackages = byRoute.on
			.filter((student) => getStatsBranch(student.enrollment_number, year) === branch)
			.map((student) => getStudentPackage(student, student.placement) ?? 0)
			.filter((value) => value > 0);
		const otherPackages = [...byRoute.ppo, ...byRoute.off]
			.filter((student) => getStatsBranch(student.enrollment_number, year) === branch)
			.map((student) => getStudentPackage(student, student.placement) ?? 0)
			.filter((value) => value > 0);
		const on = entries.filter((entry) => entry.routes.has("on")).length;
		return {
			branch,
			total,
			placed: entries.length,
			on,
			ppo: entries.filter((entry) => !entry.routes.has("on") && entry.routes.has("ppo")).length,
			off: entries.filter((entry) => entry.routes.size === 1 && entry.routes.has("off")).length,
			onPct: total ? (on / total) * 100 : 0,
			onAvgPackage: average(onPackages),
			otherAvgPackage: average(otherPackages),
		};
	});

	const months = new Map<string, { month: string; timestamp: number; on: number; ppo: number; off: number }>();
	for (const student of students) {
		const date = getStudentOfferDate(student, student.placement) || objectIdDate(student.placement);
		if (!date) continue;
		const key = monthKey(date);
		const bucket = months.get(key) ?? {
			month: key,
			timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
			on: 0,
			ppo: 0,
			off: 0,
		};
		bucket[getCampusRoute(student.placement)] += 1;
		months.set(key, bucket);
	}

	const bands = CAMPUS_BANDS.map((band) => {
		const point = { range: band.label, on: 0, ppo: 0, off: 0 };
		for (const route of CAMPUS_ROUTES) {
			point[route] = byRoute[route].filter((student) => {
				const value = getStudentPackage(student, student.placement);
				return value != null && value > 0 && value >= band.min && value < band.max;
			}).length;
		}
		return point;
	});

	// One row per company document, cross-checked against the year's posted jobs.
	const placementsInScope = new Map<string, { placement: Placement; students: StudentWithPlacement[] }>();
	for (const student of students) {
		const entry = placementsInScope.get(student.company) ?? {
			placement: student.placement,
			students: [],
		};
		entry.students.push(student);
		placementsInScope.set(student.company, entry);
	}
	const companies: CampusCompany[] = Array.from(placementsInScope.values()).map(
		({ placement, students: companyStudents }) => {
			const tokens = companyTokens(placement.company);
			const job = jobs.find((candidate) => sameCompany(tokens, candidate.tokens));
			const route = getCampusRoute(placement);
			const jobPosted = Boolean(placement.matched_job_id || job);
			const packages = companyStudents
				.map((student) => getStudentPackage(student, student.placement) ?? 0)
				.filter((value) => value > 0);
			return {
				company: placement.company,
				route,
				students: companyStudents.length,
				avgPackage: average(packages),
				confidence: placement.on_campus_confidence ?? null,
				tagged: placement.campus_tagged === true,
				reason: placement.on_campus_reason ?? null,
				jobPosted,
				jobCategory: job?.category ?? null,
				jobPackage: job?.lpa ?? null,
				review:
					route === "off" && jobPosted
						? "drive-exists"
						: route === "on" && !jobPosted
							? "no-drive"
							: null,
			};
		},
	);
	companies.sort((left, right) => right.students - left.students);

	const confidence = CONFIDENCE_BUCKETS.map((bucket, index) => {
		const ceiling = index === 0 ? Number.POSITIVE_INFINITY : CONFIDENCE_BUCKETS[index - 1].min;
		const inBucket = companies.filter(
			(company) =>
				company.route === "on" &&
				company.confidence != null &&
				company.confidence >= bucket.min &&
				company.confidence < ceiling,
		);
		return {
			bucket: bucket.label,
			offers: inBucket.reduce((sum, company) => sum + company.students, 0),
			companies: inBucket.length,
		};
	});

	const offerTokens = placements.map((placement) => companyTokens(placement.company));
	const jobCompanies = new Map<string, JobSummary>();
	for (const job of jobs) jobCompanies.set(job.tokens.map((tokens) => tokens.join(" ")).join("|"), job);
	const jobCompanyList = Array.from(jobCompanies.values());
	const hasOffer = (job: JobSummary) => offerTokens.some((tokens) => sameCompany(tokens, job.tokens));
	const categories = new Map<string, { companies: number; withOffers: number }>();
	for (const job of jobCompanyList) {
		const key = job.category || "Uncategorised";
		const entry = categories.get(key) ?? { companies: 0, withOffers: 0 };
		entry.companies += 1;
		if (hasOffer(job)) entry.withOffers += 1;
		categories.set(key, entry);
	}

	return {
		batchTotal: getTotalStudentsForYear(year),
		placedStudents: perStudent.size,
		routes: {
			on: routeSummary(byRoute.on),
			ppo: routeSummary(byRoute.ppo),
			off: routeSummary(byRoute.off),
		},
		students: {
			anyOn: studentEntries.filter((entry) => entry.routes.has("on")).length,
			bestOn: countBest("on"),
			bestPpo: countBest("ppo"),
			bestOff: countBest("off"),
			mixed: studentEntries.filter((entry) => entry.routes.size > 1).length,
			multiOffer: studentEntries.filter((entry) => entry.offers > 1).length,
		},
		confidence,
		branches,
		months: Array.from(months.values()).sort((left, right) => left.timestamp - right.timestamp),
		bands,
		companies,
		jobs: {
			total: jobs.length,
			companies: jobCompanyList.length,
			companiesWithOffers: jobCompanyList.filter(hasOffer).length,
			offersLinked: placements.filter(
				(placement) =>
					placement.matched_job_id ||
					jobs.some((job) => sameCompany(companyTokens(placement.company), job.tokens)),
			).length,
			offerDocs: placements.length,
			byCategory: Array.from(categories, ([category, value]) => ({ category, ...value })).sort(
				(left, right) => right.companies - left.companies,
			),
		},
	};
}
