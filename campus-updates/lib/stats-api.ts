import type { CampusRoute } from "@/lib/stats";

export type StatsPackageSummary = {
	avg: number;
	median: number;
	highest: number;
};

export type StatsSummary = {
	placement: {
		placed: number;
		total: number;
		pct: number;
		overallPct: number;
	};
	packages: StatsPackageSummary & {
		overallAvg: number;
		overallMedian: number;
		overallHighest: number;
	};
	companies: {
		filtered: number;
		total: number;
	};
	offers: {
		filteredUniqueStudents: number;
		totalUniqueStudents: number;
		filteredTotalOffers: number;
		totalOffers: number;
	};
	campus: {
		/** Offers from companies tagged likely on campus, PPOs excluded. */
		likelyOffers: number;
		totalOffers: number;
		pct: number;
		likelyCompanies: number;
		totalCompanies: number;
	};
};

export type BranchStats = {
	count: number;
	uniqueCount: number;
	avgPackage: number;
	highest: number;
	median: number;
	total: number;
	pct: number | null;
};

export type PackageDistributionPoint = {
	range: string;
	Overall: number;
	[key: string]: string | number;
};

export type BranchStatsData = {
	branches: Record<string, BranchStats>;
	distribution: {
		availableBranches: string[];
		points: PackageDistributionPoint[];
		overall: { offers: number; avgPackage: number };
		branches: Record<
			string,
			{ offers: number; packageCount: number; avgPackage: number }
		>;
	};
};

export type CompanyStats = {
	company: string;
	studentsCount: number;
	avgPackage: number;
	fallbackPackage: number;
	/** Confidence (0..1) when the company's offers are tagged likely on campus. */
	onCampusConfidence: number | null;
	campusRoute: CampusRoute;
};

export type CompanyStatsData = {
	companies: CompanyStats[];
	total: number;
};

export type StatsTimelinePoint = {
	date: string;
	timestamp: number;
	uniqueStudents: number;
	totalOffers: number;
	avgPackage: number;
	medianPackage: number;
};

export type StatsApiResponse<T> = {
	ok: true;
	data: T;
};

export type CampusRouteSummary = {
	offers: number;
	students: number;
	companies: number;
	/** Per offer. */
	avgPackage: number;
	medianPackage: number;
	highestPackage: number;
	/** Per student, highest package among this route's offers. */
	studentAvgPackage: number;
	studentMedianPackage: number;
};

export type CampusCompany = {
	company: string;
	route: CampusRoute;
	students: number;
	avgPackage: number;
	confidence: number | null;
	/** False when the judge never ran because no drive candidate was found. */
	tagged: boolean;
	/** The judge's stated reason, once the backfill has stored one. */
	reason: string | null;
	/** A SuperSet job exists for this company in the year's Jobs collection. */
	jobPosted: boolean;
	jobCategory: string | null;
	/** Package on the matched job, LPA. */
	jobPackage: number | null;
	/** Set when the tag and the job cross-check disagree. */
	review: "drive-exists" | "no-drive" | null;
};

export type CampusStatsData = {
	batchTotal: number;
	placedStudents: number;
	routes: Record<CampusRoute, CampusRouteSummary>;
	students: {
		/** At least one on-campus offer. */
		anyOn: number;
		/** Route of each student's highest-package offer. */
		bestOn: number;
		bestPpo: number;
		bestOff: number;
		/** Offers from more than one route. */
		mixed: number;
		/** More than one offer in total. */
		multiOffer: number;
	};
	confidence: { bucket: string; offers: number; companies: number }[];
	branches: {
		branch: string;
		total: number;
		placed: number;
		on: number;
		ppo: number;
		off: number;
		onPct: number;
		onAvgPackage: number;
		otherAvgPackage: number;
	}[];
	months: { month: string; timestamp: number; on: number; ppo: number; off: number }[];
	bands: { range: string; on: number; ppo: number; off: number }[];
	companies: CampusCompany[];
	jobs: {
		/** Jobs posted this year. */
		total: number;
		companies: number;
		/** Job companies with at least one recorded offer. */
		companiesWithOffers: number;
		/** Offer documents that link to a posted job. */
		offersLinked: number;
		offerDocs: number;
		byCategory: { category: string; companies: number; withOffers: number }[];
	};
};
