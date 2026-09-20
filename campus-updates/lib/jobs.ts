export type EligibilityMark = {
	level: string;
	criteria: number;
};

export type JobDocument = {
	id: string;
	job_profile: string;
	company: string;
	placement_category_code: number;
	placement_category: string;
	createdAt: number;
	deadline: number | null;
	eligibility_marks: EligibilityMark[];
	eligibility_courses: string[];
	allowed_genders: string[];
	job_description: string;
	location: string;
	package: number;
	package_info: string;
	annum_months?: string;
	required_skills: string[];
	hiring_flow: string[];
	placement_type: string | null;
	documents: Array<{
		name: string;
		identifier: string;
		url: string | null;
	}>;
};

export type JobSummary = Pick<
	JobDocument,
	| "id"
	| "job_profile"
	| "company"
	| "placement_category_code"
	| "placement_category"
	| "createdAt"
	| "deadline"
	| "eligibility_marks"
	| "eligibility_courses"
	| "location"
	| "package"
	| "annum_months"
>;

export type JobFacets = {
	categories: Array<{ code: number; label: string }>;
	locations: string[];
	genders: string[];
	courses: string[];
	maxPackageLpa: number;
	maxCgpa: number;
};

export type JobFeedResponse = {
	ok: true;
	data: JobSummary[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
	facets: JobFacets;
};

export const JOB_CATEGORY_LABELS: Record<number, string> = {
	1: "High",
	2: "Middle",
	3: "> 4.6L",
	4: "Internship",
};

type RawJobDocument = Record<string, any>;

function stringValue(value: unknown): string {
	return value == null ? "" : String(value).trim();
}

function numberValue(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function timestampValue(value: unknown): number | null {
	if (value == null || value === "") return null;
	if (value instanceof Date) {
		const timestamp = value.getTime();
		return Number.isNaN(timestamp) ? null : timestamp;
	}
	if (typeof value === "number") {
		if (!Number.isFinite(value)) return null;
		return value < 10_000_000_000 ? value * 1000 : value;
	}

	const text = String(value).trim();
	if (!text) return null;
	const numeric = Number(text);
	const onlyDigits = text.split("").every((char) => char >= "0" && char <= "9");
	if (onlyDigits && Number.isFinite(numeric)) {
		return text.length > 10 ? numeric : numeric * 1000;
	}
	const timestamp = new Date(text).getTime();
	return Number.isNaN(timestamp) ? null : timestamp;
}

function stringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.map(stringValue).filter(Boolean);
}

export function normalizeJobDocument(document: RawJobDocument): JobDocument {
	const categoryCode = numberValue(document.placement_category_code);
	const marks = Array.isArray(document.eligibility_marks)
		? document.eligibility_marks
				.map((mark) => ({
					level: stringValue(mark?.level),
					criteria: numberValue(mark?.criteria, Number.NaN),
				}))
				.filter((mark) => mark.level && Number.isFinite(mark.criteria))
		: [];
	const documents = Array.isArray(document.documents)
		? document.documents
				.map((item) => ({
					name: stringValue(item?.name) || "Document",
					identifier: stringValue(item?.identifier),
					url: stringValue(item?.url) || null,
				}))
				.filter((item) => item.identifier || item.url)
		: [];

	return {
		id: stringValue(document.id),
		job_profile: stringValue(document.job_profile),
		company: stringValue(document.company),
		placement_category_code: categoryCode,
		placement_category:
			stringValue(document.placement_category) ||
			JOB_CATEGORY_LABELS[categoryCode] ||
			"Other",
		createdAt:
			timestampValue(document.createdAt) ??
			timestampValue(document.saved_at) ??
			0,
		deadline: timestampValue(document.deadline),
		eligibility_marks: marks,
		eligibility_courses: stringArray(document.eligibility_courses),
		allowed_genders: stringArray(document.allowed_genders),
		job_description: stringValue(document.job_description),
		location: stringValue(document.location),
		package: numberValue(document.package),
		package_info: stringValue(document.package_info),
		annum_months: stringValue(document.annum_months) || undefined,
		required_skills: stringArray(document.required_skills),
		hiring_flow: stringArray(document.hiring_flow),
		placement_type: stringValue(document.placement_type) || null,
		documents,
	};
}

export function toJobSummary(job: JobDocument): JobSummary {
	return {
		id: job.id,
		job_profile: job.job_profile,
		company: job.company,
		placement_category_code: job.placement_category_code,
		placement_category: job.placement_category,
		createdAt: job.createdAt,
		deadline: job.deadline,
		eligibility_marks: job.eligibility_marks,
		eligibility_courses: job.eligibility_courses,
		location: job.location,
		package: job.package,
		annum_months: job.annum_months,
	};
}
