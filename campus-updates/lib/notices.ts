export type NoticeSource = "notice" | "placement-offer";

export type ShortlistedStudent = {
	name: string;
	enrollment_number: string;
	venue?: string;
};

export type MatchedJob = {
	id: string;
	company: string;
	job_profile: string;
	location?: string | null;
	package?: string | null;
	package_breakdown?: string | null;
};

export type EligibilityRequirement = {
	label: string;
	value: string;
};

export type Notice = {
	id: string;
	sourceId: string;
	source: NoticeSource;
	category: string;
	matched_job: MatchedJob | null;
	matched_job_id?: string | null;
	likely_on_campus?: boolean;
	on_campus_confidence?: number | null;
	formatted_message?: string | null;
	/** `formatted_message` minus the parts rendered as dedicated card sections. */
	body?: string | null;
	createdAt?: number;
	updatedAt?: number;
	content?: string;
	title?: string;
	author?: string;
	job_company?: string | null;
	job_role?: string | null;
	package?: string | null;
	package_breakdown?: string | null;
	location?: string | null;
	deadline?: string | null;
	eligibility_criteria?: string[] | null;
	eligibility_requirements?: EligibilityRequirement[] | null;
	hiring_flow?: string[] | null;
	shortlisted_students?: ShortlistedStudent[] | null;
	number_of_offers?: number | null;
	joiningDate?: string;
};

export type NoticeFeedResponse = {
	ok: true;
	data: Notice[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
	facets: {
		categories: string[];
	};
};

type Document = Record<string, any>;

function stringValue(value: unknown): string | null {
	if (value == null) return null;
	const text = String(value).trim();
	return text || null;
}

function documentId(value: unknown): string {
	return value == null ? "" : String(value);
}

function confidenceValue(value: unknown): number | null {
	if (value == null || value === "") return null;
	const confidence = Number(value);
	if (!Number.isFinite(confidence)) return null;
	return Math.min(1, Math.max(0, confidence));
}

function stringArray(value: unknown): string[] | null {
	if (!Array.isArray(value)) return null;
	const values = value.map(stringValue).filter((item): item is string => Boolean(item));
	return values.length ? values : null;
}

export function timestampValue(value: unknown): number | null {
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

export function normalizeCategory(value: string): string {
	let category = String(value || "").toLowerCase().trim().split("_").join(" ");
	if (category.startsWith("[") && category.endsWith("]")) {
		category = category.slice(1, -1).trim();
	}
	if (category === "shortlist" || category === "shortlisting") {
		return "shortlisting";
	}
	return category;
}

function normalizeStudents(value: unknown): ShortlistedStudent[] | null {
	if (!Array.isArray(value)) return null;
	const students = value
		.map((student) => ({
			name: stringValue(student?.name) || "",
			enrollment_number:
				stringValue(student?.enrollment_number ?? student?.enroll) || "",
			venue: stringValue(student?.venue) || undefined,
		}))
		.filter((student) => student.name || student.enrollment_number);
	return students.length ? students : null;
}

function cleanPackage(value: unknown): string | null {
	const text = stringValue(value);
	return text?.endsWith("(") ? text.slice(0, -1).trim() : text;
}

function cleanPackageBreakdown(value: unknown): string | null {
	const text = stringValue(value);
	return text?.endsWith(")") ? text.slice(0, -1).trim() : text;
}

/**
 * Scraped notices never carry structured `eligibility_criteria` / `hiring_flow`
 * / `deadline` fields — the bot only writes the rendered `formatted_message`
 * markdown. Everything below recovers that structure so the card can render
 * real sections instead of dumping the raw Superset `content` HTML.
 */
type ParsedMessage = {
	body: string | null;
	company: string | null;
	role: string | null;
	location: string | null;
	packageText: string | null;
	deadline: string | null;
	eligibility: string[];
	requirements: EligibilityRequirement[];
	hiringFlow: string[];
};

const EMPTY_PARSED: ParsedMessage = {
	body: null,
	company: null,
	role: null,
	location: null,
	packageText: null,
	deadline: null,
	eligibility: [],
	requirements: [],
	hiringFlow: [],
};

/** Strip surrounding `**` emphasis and trailing colons from a markdown label. */
function plainText(value: string): string {
	let text = value.trim();
	while (text.startsWith("*")) text = text.slice(1);
	while (text.endsWith("*")) text = text.slice(0, -1);
	return text.trim();
}

/** Split `**Label:** value` into its two halves; null when not that shape. */
function labelledValue(line: string): { label: string; value: string } | null {
	const separator = line.indexOf(":**");
	if (separator === -1 || !line.trimStart().startsWith("**")) return null;
	return {
		label: plainText(line.slice(0, separator)),
		value: line.slice(separator + 3).trim(),
	};
}

/** `CLASS_X Marks` -> `Xth`, `GRADUATION` -> `Graduation`. */
function requirementLabel(label: string): string {
	let text = label.split("_").join(" ").trim();
	const lower = text.toLowerCase();
	if (lower.endsWith(" marks")) text = text.slice(0, -" marks".length).trim();
	const upper = text.toUpperCase();
	if (upper === "CLASS X" || upper === "CLASS 10") return "Xth";
	if (upper === "CLASS XII" || upper === "CLASS 12") return "XIIth";
	return text
		.split(" ")
		.filter(Boolean)
		.map((word) =>
			word.length <= 3 && word === word.toUpperCase()
				? word
				: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
		)
		.join(" ");
}

function isDropped(line: string): boolean {
	const text = line.trim();
	if (!text) return false;
	if (text.startsWith("🔗")) return true;
	const lower = text.toLowerCase();
	return lower.startsWith("*posted by*") || lower.startsWith("*on:*");
}

/** Header lines already surfaced by the detail grid, so drop them from the body. */
const HEADER_LABELS = new Set([
	"company",
	"role",
	"location",
	"ctc",
	"package",
	"package breakdown",
]);

export function parseFormattedMessage(message: string | null): ParsedMessage {
	if (!message) return EMPTY_PARSED;

	const parsed: ParsedMessage = {
		...EMPTY_PARSED,
		eligibility: [],
		requirements: [],
		hiringFlow: [],
	};
	const bodyLines: string[] = [];
	const lines = message.split("\n");
	// "eligibility" and "hiring" sections run until the next blank line.
	let section: "none" | "eligibility" | "hiring" = "none";
	let coursesOpen = false;
	let seenTitle = false;

	for (const rawLine of lines) {
		const line = rawLine.trimEnd();
		const trimmed = line.trim();

		if (!trimmed) {
			section = "none";
			coursesOpen = false;
			bodyLines.push("");
			continue;
		}

		const heading = plainText(trimmed).toLowerCase();
		if (heading === "eligibility criteria:" || heading === "eligibility:") {
			section = "eligibility";
			coursesOpen = false;
			continue;
		}
		if (heading === "hiring flow:" || heading === "hiring process:") {
			section = "hiring";
			continue;
		}

		if (section === "eligibility") {
			if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
				const item = trimmed.slice(2).trim();
				const labelled = labelledValue(item);
				if (labelled) {
					if (labelled.label.toLowerCase().startsWith("course")) {
						coursesOpen = true;
						if (labelled.value) parsed.eligibility.push(labelled.value);
					} else {
						coursesOpen = false;
						parsed.requirements.push({
							label: requirementLabel(labelled.label),
							value: labelled.value,
						});
					}
				} else {
					coursesOpen = false;
					const text = plainText(item);
					if (text) parsed.eligibility.push(text);
				}
			} else if (coursesOpen) {
				const text = plainText(trimmed);
				if (text) parsed.eligibility.push(text);
			}
			continue;
		}

		if (section === "hiring") {
			let text = trimmed;
			const dot = text.indexOf(". ");
			if (dot > 0 && text.slice(0, dot).split("").every((c) => c >= "0" && c <= "9")) {
				text = text.slice(dot + 2);
			} else if (text.startsWith("- ") || text.startsWith("* ")) {
				text = text.slice(2);
			}
			text = plainText(text);
			if (text) parsed.hiringFlow.push(text);
			continue;
		}

		if (isDropped(trimmed)) continue;

		// `⚠️ **Deadline:** ...` — the emoji prefix has to come off first.
		const deadlineMarker = trimmed.indexOf("**Deadline:**");
		if (deadlineMarker !== -1) {
			parsed.deadline = trimmed.slice(deadlineMarker + "**Deadline:**".length).trim();
			continue;
		}

		const labelled = labelledValue(trimmed);
		if (labelled && HEADER_LABELS.has(labelled.label.toLowerCase())) {
			const value = labelled.value;
			const label = labelled.label.toLowerCase();
			if (label === "company") parsed.company = value || null;
			else if (label === "role") parsed.role = value || null;
			else if (label === "location") parsed.location = value || null;
			else if (label === "ctc" || label === "package") parsed.packageText = value || null;
			continue;
		}

		// Leading bold-only lines are the title and the `**📢 Job Posting**`
		// badge; both are already rendered as the heading and category chip.
		if (
			!seenTitle &&
			trimmed.startsWith("**") &&
			trimmed.endsWith("**") &&
			bodyLines.every((entry) => !entry.trim())
		) {
			continue;
		}
		seenTitle = true;

		bodyLines.push(line);
	}

	const body = bodyLines.join("\n").trim();
	parsed.body = body || null;
	// Superset repeats the same course row per intake, so collapse duplicates.
	parsed.eligibility = Array.from(new Set(parsed.eligibility));
	parsed.hiringFlow = Array.from(new Set(parsed.hiringFlow));
	return parsed;
}

export function normalizeNoticeDocument(document: Document): Notice {
	const sourceId = documentId(document._id ?? document.id);
	const category = normalizeCategory(document.category ?? document.type ?? "update");
	const matchedJobId = documentId(
		document.matched_job_id ?? document.matched_job?.id,
	);
	const matchedJob = matchedJobId
		? {
				id: matchedJobId,
				company:
					stringValue(document.job_company ?? document.matched_job?.company) || "",
				job_profile:
					stringValue(document.job_role ?? document.matched_job?.job_profile) || "",
				location: stringValue(document.matched_job?.location ?? document.location),
				package: cleanPackage(document.matched_job?.package ?? document.package),
				package_breakdown: cleanPackageBreakdown(
					document.matched_job?.package_breakdown ?? document.package_breakdown,
				),
			}
		: null;
	// Source timestamps must win over persistence metadata. `saved_at` is when
	// the scraper inserted the document and may be hours or days after posting.
	const createdAt =
		timestampValue(document.time_sent) ??
		timestampValue(document.createdAt) ??
		timestampValue(document.created_at) ??
		timestampValue(document.saved_at) ??
		undefined;
	const shortlistedStudents = normalizeStudents(document.shortlisted_students);
	const parsed = parseFormattedMessage(stringValue(document.formatted_message));
	const eligibility = stringArray(document.eligibility_criteria) ?? (
		parsed.eligibility.length ? parsed.eligibility : null
	);
	const hiringFlow =
		stringArray(document.hiring_flow) ??
		(parsed.hiringFlow.length ? parsed.hiringFlow : null);

	return {
		id: documentId(document.id) || sourceId,
		sourceId,
		source: "notice",
		category,
		matched_job: matchedJob,
		matched_job_id: matchedJobId || null,
		likely_on_campus: document.likely_on_campus === true,
		on_campus_confidence: confidenceValue(document.on_campus_confidence),
		formatted_message: stringValue(document.formatted_message),
		body: parsed.body,
		createdAt,
		updatedAt:
			timestampValue(document.updatedAt ?? document.updated_at) ?? undefined,
		content: stringValue(document.content) || undefined,
		title: stringValue(document.title) || undefined,
		author: stringValue(document.author)?.split("<")[0].trim() || undefined,
		job_company: stringValue(document.job_company) ?? parsed.company,
		job_role: stringValue(document.job_role) ?? parsed.role,
		package: cleanPackage(document.package) ?? cleanPackage(parsed.packageText),
		package_breakdown: cleanPackageBreakdown(document.package_breakdown),
		location: stringValue(document.location) ?? parsed.location,
		deadline: formatDeadline(document.deadline) ?? parsed.deadline,
		eligibility_criteria: eligibility,
		eligibility_requirements: parsed.requirements.length ? parsed.requirements : null,
		hiring_flow: hiringFlow?.filter((step) => {
			const normalized = step.toLowerCase();
			return !normalized.includes("detailed jd") && !step.startsWith("🔗");
		}),
		shortlisted_students: shortlistedStudents,
		number_of_offers: null,
	};
}

function joiningDate(value: unknown): string | undefined {
	const timestamp = timestampValue(value);
	if (timestamp == null) return undefined;
	return new Date(timestamp).toLocaleDateString("en-IN", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

const IST_OFFSET_MINUTES = 5 * 60 + 30;

function offsetToMinutes(offset: string): number {
	if (offset === "Z") return 0;
	const digits = offset.slice(1).replace(":", "");
	const minutes = Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4));
	return offset.startsWith("-") ? -minutes : minutes;
}

function formatDeadline(value: unknown): string | null {
	const text = stringValue(value);
	if (!text) return null;

	const match =
		/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.exec(
			text,
		);
	if (!match) return text;

	const [, year, month, day, hours, minutes, offset] = match;
	const sourceOffset = offset ? offsetToMinutes(offset) : IST_OFFSET_MINUTES;
	const istDate = new Date(
		Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes)) -
			sourceOffset * 60_000 +
			IST_OFFSET_MINUTES * 60_000,
	);

	const dateText = istDate.toLocaleDateString("en-IN", {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
	if (istDate.getUTCHours() === 0 && istDate.getUTCMinutes() === 0) return dateText;

	const hour = istDate.getUTCHours();
	const minute = String(istDate.getUTCMinutes()).padStart(2, "0");
	return `${dateText}, ${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"} IST`;
}

export function normalizePlacementOfferDocument(document: Document): Notice {
	const sourceId = documentId(document._id ?? document.id);
	const matchedJobId = documentId(
		document.matched_job_id ?? document.related_job_id ?? document.matched_job?.id,
	);
	const matchedJob = matchedJobId
		? {
				id: matchedJobId,
				company:
					stringValue(document.matched_job?.company ?? document.company) || "",
				job_profile: stringValue(document.matched_job?.job_profile) || "",
				location: stringValue(
					document.matched_job?.location ?? document.job_location?.[0],
				),
				package: cleanPackage(document.matched_job?.package),
				package_breakdown: cleanPackageBreakdown(
					document.matched_job?.package_breakdown,
				),
			}
		: null;
	const roles = Array.isArray(document.roles) ? document.roles : [];
	const primaryRole = roles.find((role) => stringValue(role?.role));
	const role = stringValue(primaryRole?.role) || "Offer";
	const packages = roles
		.map((item) => (typeof item?.package === "number" ? item.package : null))
		.filter((item): item is number => item != null);
	const firstStudentPackage = document.students_selected?.[0]?.package;
	const bestPackage = packages.length
		? Math.max(...packages)
		: typeof firstStudentPackage === "number"
			? firstStudentPackage
			: null;
	const packageText = bestPackage == null ? null : `${bestPackage} LPA`;
	const locations = stringArray(document.job_location);
	const messageParts = [
		"**Placement Offer**",
		document.company ? `**Company:** ${document.company}` : null,
		role ? `**Role:** ${role}` : null,
		packageText ? `**CTC:** ${packageText}` : null,
		locations?.length ? `**Location:** ${locations.join(", ")}` : null,
	].filter((part): part is string => Boolean(part));
	const students = normalizeStudents(document.students_selected);
	const createdAt =
		timestampValue(document.time_sent) ??
		timestampValue(document.createdAt) ??
		timestampValue(document.created_at) ??
		timestampValue(document.saved_at) ??
		timestampValue(document.updated_at) ??
		undefined;

	return {
		id: sourceId,
		sourceId,
		source: "placement-offer",
		category: "placement offer",
		matched_job: matchedJob,
		matched_job_id: matchedJobId || null,
		formatted_message: messageParts.join("\n\n"),
		body: null,
		createdAt,
		updatedAt: createdAt,
		job_company: stringValue(document.company),
		job_role: role,
		package: packageText,
		package_breakdown:
			roles
				.map((item) => {
					const details = stringValue(item?.package_details);
					return details ? `- ${stringValue(item?.role) || "Role"}: ${details}` : null;
				})
				.filter(Boolean)
				.join("\n") || null,
		location: locations?.join(", ") || null,
		deadline: null,
		eligibility_criteria: null,
		hiring_flow: null,
		shortlisted_students: students,
		number_of_offers:
			typeof document.number_of_offers === "number"
				? document.number_of_offers
				: students?.length ?? 0,
		joiningDate: joiningDate(document.joining_date),
	};
}

export function isPlacementBotPost(notice: Partial<Notice>): boolean {
	const author = String(notice.author || "").toLowerCase();
	if (author.includes("bot")) return true;

	const text = `${notice.formatted_message || ""}\n${notice.title || ""}\n${
		notice.content || ""
	}`
		.toLowerCase()
		.trim();
	if (!text || text.length >= 300) return false;

	return (
		text.includes("student have been placed at") ||
		text.includes("students have been placed at") ||
		text.includes("student has been placed at") ||
		text.includes("students has been placed at") ||
		text.includes("congratulations to all selected") ||
		text.includes("positions:") ||
		(text.includes("sde intern:") && text.includes(" offer"))
	);
}

export function formatDateTime(timestamp: number): string {
	const date = new Date(timestamp);
	const dateText = date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
	const timeText = date.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
	return `${dateText} at ${timeText}`;
}
