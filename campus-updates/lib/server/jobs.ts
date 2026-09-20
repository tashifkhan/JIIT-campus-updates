import "server-only";

import {
	JOB_CATEGORY_LABELS,
	JobDocument,
	normalizeJobDocument,
	toJobSummary,
} from "@/lib/jobs";
import { getCollection } from "@/lib/server/data";
import { sanitizeRichText } from "@/lib/server/sanitize";

export type JobFeedOptions = {
	year: string;
	query: string;
	categories: number[];
	locations: string[];
	genders: string[];
	courses: string[];
	minPackageLpa: number;
	cgpaMin: number;
	cgpaMax: number;
	openOnly: boolean;
	page: number;
	pageSize: number;
};

const SUMMARY_PROJECTION = {
	_id: 0,
	id: 1,
	job_profile: 1,
	company: 1,
	placement_category_code: 1,
	placement_category: 1,
	createdAt: 1,
	saved_at: 1,
	deadline: 1,
	eligibility_marks: 1,
	eligibility_courses: 1,
	allowed_genders: 1,
	location: 1,
	package: 1,
	annum_months: 1,
} as const;

const DETAIL_PROJECTION = {
	...SUMMARY_PROJECTION,
	job_description: 1,
	package_info: 1,
	required_skills: 1,
	hiring_flow: 1,
	placement_type: 1,
	documents: 1,
} as const;

function uniqueSorted(values: string[]): string[] {
	return Array.from(new Set(values.filter(Boolean))).sort();
}

function deduplicateJobs(jobs: JobDocument[]): JobDocument[] {
	const sorted = [...jobs].sort((left, right) => right.createdAt - left.createdAt);
	const byId = new Map<string, JobDocument>();
	for (const job of sorted) {
		if (job.id && !byId.has(job.id)) byId.set(job.id, job);
	}
	return Array.from(byId.values());
}

function matchesFilters(job: JobDocument, options: JobFeedOptions, now: number) {
	if (options.openOnly && (job.deadline == null || job.deadline < now)) return false;
	if (
		options.categories.length &&
		!options.categories.includes(job.placement_category_code)
	) {
		return false;
	}
	if (options.locations.length && !options.locations.includes(job.location)) {
		return false;
	}
	if (
		options.genders.length &&
		!options.genders.every((gender) => job.allowed_genders.includes(gender))
	) {
		return false;
	}
	if (
		options.courses.length &&
		!options.courses.some((course) => job.eligibility_courses.includes(course))
	) {
		return false;
	}
	if (job.package / 100_000 < options.minPackageLpa) return false;

	if (options.cgpaMin > 0 || options.cgpaMax < 10) {
		const ugMarks = job.eligibility_marks.filter(
			(mark) => mark.level.toLowerCase() === "ug",
		);
		if (ugMarks.length) {
			const requirement = Math.min(...ugMarks.map((mark) => mark.criteria));
			if (requirement < options.cgpaMin || requirement > options.cgpaMax) {
				return false;
			}
		}
	}

	if (options.query) {
		const searchable = `${job.job_profile} ${job.company} ${job.location}`.toLowerCase();
		if (!searchable.includes(options.query)) return false;
	}
	return true;
}

export async function getJobFeed(options: JobFeedOptions) {
	const collection = await getCollection("Jobs", options.year);
	// Bound the scan: filtering happens in memory after normalization, so cap
	// the number of documents read per request to limit memory/CPU abuse.
	const documents = await collection
		.find({}, { projection: SUMMARY_PROJECTION })
		.sort({ createdAt: -1 })
		.limit(5000)
		.toArray();
	const jobs = deduplicateJobs(documents.map(normalizeJobDocument));
	const categoryCodes = Array.from(
		new Set(jobs.map((job) => job.placement_category_code)),
	).sort((left, right) => left - right);
	const cgpaValues = jobs.flatMap((job) =>
		job.eligibility_marks
			.filter((mark) => mark.level.toLowerCase() === "ug")
			.map((mark) => mark.criteria),
	);
	const facets = {
		categories: categoryCodes.map((code) => ({
			code,
			label: JOB_CATEGORY_LABELS[code] || String(code),
		})),
		locations: uniqueSorted(jobs.map((job) => job.location)),
		genders: uniqueSorted(jobs.flatMap((job) => job.allowed_genders)),
		courses: uniqueSorted(jobs.flatMap((job) => job.eligibility_courses)),
		maxPackageLpa:
			Math.ceil(jobs.reduce((max, job) => Math.max(max, job.package), 0) / 100_000) ||
			0,
		maxCgpa: Math.ceil(Math.max(...cgpaValues, 0) * 10) / 10 || 10,
	};
	const now = Date.now();
	const filtered = jobs.filter((job) => matchesFilters(job, options, now));
	const total = filtered.length;
	const totalPages = Math.ceil(total / options.pageSize);
	const page = totalPages > 0 ? Math.min(options.page, totalPages) : 1;
	const start = (page - 1) * options.pageSize;

	return {
		data: filtered.slice(start, start + options.pageSize).map(toJobSummary),
		pagination: {
			page,
			pageSize: options.pageSize,
			total,
			totalPages,
		},
		facets,
	};
}

export async function getJobById(id: string, year: string) {
	const collection = await getCollection("Jobs", year);
	const document = await collection.findOne(
		{ id },
		{ projection: DETAIL_PROJECTION, sort: { createdAt: -1 } },
	);
	if (!document) return null;
	const job = normalizeJobDocument(document);
	// Scraped email HTML is attacker-controlled: sanitize before it reaches
	// dangerouslySetInnerHTML on the job detail page.
	return {
		...job,
		job_description: sanitizeRichText(job.job_description),
		package_info: sanitizeRichText(job.package_info),
	};
}
