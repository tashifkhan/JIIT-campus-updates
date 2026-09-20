import "server-only";

import {
	Notice,
	normalizeCategory,
	normalizeNoticeDocument,
	normalizePlacementOfferDocument,
	isPlacementBotPost,
} from "@/lib/notices";
import { getCollection } from "@/lib/server/data";
import { sanitizeRichText } from "@/lib/server/sanitize";

type NoticeFeedOptions = {
	year: string;
	query: string;
	categories: string[];
	page: number;
	pageSize: number;
	hideShortPlacements: boolean;
};

const NOTICE_PROJECTION = {
	_id: 1,
	id: 1,
	type: 1,
	category: 1,
	title: 1,
	content: 1,
	formatted_message: 1,
	author: 1,
	createdAt: 1,
	created_at: 1,
	updatedAt: 1,
	updated_at: 1,
	saved_at: 1,
	time_sent: 1,
	matched_job: 1,
	matched_job_id: 1,
	likely_on_campus: 1,
	on_campus_confidence: 1,
	job_company: 1,
	job_role: 1,
	package: 1,
	package_breakdown: 1,
	location: 1,
	deadline: 1,
	eligibility_criteria: 1,
	hiring_flow: 1,
	shortlisted_students: 1,
} as const;

const OFFER_PROJECTION = {
	_id: 1,
	id: 1,
	company: 1,
	roles: 1,
	job_location: 1,
	joining_date: 1,
	students_selected: 1,
	number_of_offers: 1,
	matched_job: 1,
	matched_job_id: 1,
	related_job_id: 1,
	createdAt: 1,
	created_at: 1,
	updated_at: 1,
	saved_at: 1,
	time_sent: 1,
} as const;

function isDetailedPlacementOffer(notice: Notice): boolean {
	const message = String(notice.formatted_message || "").toLowerCase();
	return (
		notice.category === "placement offer" &&
		(message.includes("company:") ||
			message.includes("role:") ||
			message.includes("ctc:") ||
			message.includes("joining date:"))
	);
}

function isShortPlacementAnnouncement(notice: Notice): boolean {
	const message = String(notice.formatted_message || "").toLowerCase();
	return (
		message.length < 400 &&
		(message.includes("student have been placed at") ||
			message.includes("student has been placed at") ||
			message.includes("students have been placed at") ||
			message.includes("students has been placed at"))
	);
}

function isVisible(notice: Notice, hideShortPlacements: boolean): boolean {
	if (notice.category === "placement update" || notice.category === "placement updates") {
		return false;
	}
	if (isPlacementBotPost(notice)) return false;
	if (!hideShortPlacements) return true;

	const zeroOffer =
		notice.category === "placement offer" &&
		(notice.number_of_offers === 0 ||
			(notice.shortlisted_students?.length ?? 0) === 0);
	if (zeroOffer) return false;

	return !isShortPlacementAnnouncement(notice) || isDetailedPlacementOffer(notice);
}

function matchesSearch(notice: Notice, query: string): boolean {
	if (!query) return true;
	const values = [
		notice.title,
		notice.content,
		notice.formatted_message,
		notice.job_company,
		notice.job_role,
		notice.location,
		notice.matched_job?.company,
		notice.matched_job?.job_profile,
	];
	return values.some((value) => String(value || "").toLowerCase().includes(query));
}

export async function getNoticeFeed(options: NoticeFeedOptions) {
	const [noticesCollection, offersCollection] = await Promise.all([
		getCollection("Notices", options.year),
		getCollection("PlacementOffers", options.year),
	]);
	const [noticeDocuments, offerDocuments] = await Promise.all([
		// Bound the scans: filtering happens in memory, so cap documents read
		// per request to limit memory/CPU abuse.
		noticesCollection
			.find({}, { projection: NOTICE_PROJECTION })
			.sort({ createdAt: -1 })
			.limit(5000)
			.toArray(),
		offersCollection
			.find({}, { projection: OFFER_PROJECTION })
			.sort({ createdAt: -1 })
			.limit(5000)
			.toArray(),
	]);

	const visibleItems = [
		...noticeDocuments.map((document) => {
			const notice = normalizeNoticeDocument(document);
			return {
				...notice,
				content: notice.content
					? sanitizeRichText(notice.content)
					: undefined,
			};
		}),
		...offerDocuments.map(normalizePlacementOfferDocument),
	].filter((notice) => isVisible(notice, options.hideShortPlacements));
	const categories = Array.from(
		new Set(visibleItems.map((notice) => notice.category).filter(Boolean)),
	).sort();
	const selectedCategories = new Set(
		options.categories.map(normalizeCategory).filter(Boolean),
	);
	const query = options.query.trim().toLowerCase();
	const filteredItems = visibleItems
		.filter(
			(notice) =>
				(selectedCategories.size === 0 || selectedCategories.has(notice.category)) &&
				matchesSearch(notice, query),
		)
		.sort((left, right) => {
			const dateDifference = (right.createdAt || 0) - (left.createdAt || 0);
			return dateDifference || right.sourceId.localeCompare(left.sourceId);
		});

	const total = filteredItems.length;
	const totalPages = Math.ceil(total / options.pageSize);
	const page = totalPages > 0 ? Math.min(options.page, totalPages) : 1;
	const start = (page - 1) * options.pageSize;

	return {
		data: filteredItems.slice(start, start + options.pageSize),
		pagination: {
			page,
			pageSize: options.pageSize,
			total,
			totalPages,
		},
		facets: { categories },
	};
}
