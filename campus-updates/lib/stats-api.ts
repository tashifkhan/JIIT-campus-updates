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
		/** Offers from companies tagged likely on campus. */
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
