import "server-only";

import enrollmentRanges from "@/app/stats/enrollmemt_range.json";
import studentCounts from "@/app/stats/student_count.json";
import {
	BranchStatsData,
	CompanyStatsData,
	PackageDistributionPoint,
	StatsPackageSummary,
	StatsSummary,
	StatsTimelinePoint,
} from "@/lib/stats-api";
import {
	Placement,
	Role,
	Student,
	StudentWithPlacement,
	getStudentOfferDate,
	getStudentPackage,
} from "@/lib/stats";
import { getCollection } from "@/lib/server/data";

const EXCLUDED_BRANCHES = new Set(["JUIT", "Other", "MTech"]);
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
} as const;

type BranchRange = { branch: string; start: number; end: number };
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
	};
}

function buildBranchRanges(): BranchRange[] {
	const ranges: BranchRange[] = [];
	for (const [branch, values] of Object.entries(enrollmentRanges)) {
		for (const range of Object.values(values)) {
			if (range && typeof range.start === "number" && typeof range.end === "number") {
				ranges.push({ branch, start: range.start, end: range.end });
			}
		}
	}
	return ranges.sort((left, right) => left.start - right.start);
}

const BRANCH_RANGES = buildBranchRanges();

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

export function getStatsBranch(enrollment: string): string {
	if (!enrollment) return "Other";
	const digits = digitsOnly(enrollment);
	if (containsLetter(enrollment) || digits.length === 9) return "JUIT";
	if (digits.startsWith("24")) return "MTech";
	if (!digits) return "Other";
	const number = Number(digits);
	if (!Number.isFinite(number)) return "Other";
	for (const range of BRANCH_RANGES) {
		if (number >= range.start && number < range.end) return range.branch;
	}
	return "Other";
}

function getBranchTotals(): Record<string, number> {
	const totals: Record<string, number> = {};
	for (const [branch, counts] of Object.entries(studentCounts)) {
		if (EXCLUDED_BRANCHES.has(branch)) continue;
		totals[branch] = Object.values(counts).reduce(
			(sum, count) => sum + Number(count || 0),
			0,
		);
	}
	return totals;
}

const BRANCH_TOTALS = getBranchTotals();

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

function includedStudents(students: StudentWithPlacement[]): StudentWithPlacement[] {
	return students.filter(
		(student) => !EXCLUDED_BRANCHES.has(getStatsBranch(student.enrollment_number)),
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
	const included = includedStudents(allStudents);
	const filtered = included.filter((student) => matchesSearch(student, query));
	const overallPackages = packageSummary(included);
	const filteredPackages = packageSummary(filtered);
	const countedBranches = new Set(Object.keys(BRANCH_TOTALS));
	const totalStudents = Object.values(BRANCH_TOTALS).reduce(
		(sum, count) => sum + count,
		0,
	);
	const placedInCountedBranches = (students: StudentWithPlacement[]) =>
		new Set(
			students
				.filter((student) => countedBranches.has(getStatsBranch(student.enrollment_number)))
				.map((student) => student.enrollment_number)
				.filter(Boolean),
		).size;
	const overallPlaced = placedInCountedBranches(included);
	const filteredPlaced = placedInCountedBranches(filtered);

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
	};
}

export async function getBranchStats(year: string, query: string): Promise<BranchStatsData> {
	const placements = await loadPlacements(year);
	const students = includedStudents(flattenStudents(placements)).filter((student) =>
		matchesSearch(student, query),
	);
	const mutable: Record<string, MutableBranchStats> = {};
	const offerPackages: Record<string, number[]> = {};

	for (const student of students) {
		const branch = getStatsBranch(student.enrollment_number);
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
			const total = BRANCH_TOTALS[branch] || 0;
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
		? includedStudents(allStudents).filter((student) => matchesSearch(student, query))
		: allStudents;
	const companies = new Map<
		string,
		{ studentsCount: number; packages: number[]; fallbackPackage: number }
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
	const placements = query
		? allPlacements.filter((placement) =>
				includedStudents(flattenStudents([placement])).some((student) =>
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
				!EXCLUDED_BRANCHES.has(getStatsBranch(event.student.enrollment_number)),
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
