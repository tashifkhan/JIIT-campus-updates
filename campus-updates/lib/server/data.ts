import { ObjectId } from "mongodb";

import { getMongoClient } from "./mongodb";

export type Job = any;
export type Notice = any;
export type PlacementOffer = any;

// Active placement year (compact form). Used when no year is requested.
const DEFAULT_YEAR = process.env.DEFAULT_PLACEMENT_YEAR || "202526";
// Optional hard override for the database name (legacy / migration use).
const DB_NAME_OVERRIDE = process.env.MONGODB_DB;
// Shared cross-year data such as users and official placement snapshots.
const GLOBAL_DB_NAME = process.env.MONGODB_GLOBAL_DB || "PlacementGlobal";

/** Strip non-digit characters without regex (project convention: avoid regex). */
function digitsOnly(value: string): string {
	let out = "";
	for (const ch of value) {
		if (ch >= "0" && ch <= "9") out += ch;
	}
	return out;
}

/**
 * Resolve the MongoDB database name for a placement year.
 *
 * Mirrors the Python `database_name_for_year` helper: a compact `202526`
 * (also accepts `2025_26`, `2025-26`) maps to the database `2025-26`.
 * Falls back to MONGODB_DB override, then to the active year.
 */
export function dbNameForYear(year?: string | null): string {
	const digits = digitsOnly(year || "");
	if (digits.length === 6) {
		return `${digits.slice(0, 4)}-${digits.slice(4)}`;
	}
	if (DB_NAME_OVERRIDE) return DB_NAME_OVERRIDE;
	const d = DEFAULT_YEAR;
	return `${d.slice(0, 4)}-${d.slice(4)}`;
}

export async function getCollection(collectionName: string, year?: string | null) {
	const client = await getMongoClient();
	const db = client.db(dbNameForYear(year));
	return db.collection(collectionName);
}

export async function getGlobalCollection(collectionName: string) {
	const client = await getMongoClient();
	return client.db(GLOBAL_DB_NAME).collection(collectionName);
}

export async function getJobs(filter: any = {}, limit = 1000, year?: string | null) {
	const col = await getCollection("Jobs", year);
	const docs = await col
		.find(filter)
		.sort({ createdAt: -1 })
		.limit(limit)
		.toArray();
	return docs;
}

export async function getNotices(filter: any = {}, limit = 1000, year?: string | null) {
	const col = await getCollection("Notices", year);
	const docs = await col
		.find(filter)
		.sort({ createdAt: -1 })
		.limit(limit)
		.toArray();
	return docs;
}

export async function getPlacementOffers(
	filter: any = {},
	limit = 1000,
	year?: string | null,
) {
	const col = await getCollection("PlacementOffers", year);
	const docs = await col
		.find(filter)
		.sort({ createdAt: -1 })
		.limit(limit)
		.toArray();
	return docs;
}

export async function getOfficialPlacementData() {
	const snapshotCol = await getGlobalCollection("OfficialPlacementData");
	const snapshot = await snapshotCol.findOne(
		{},
		{ sort: { scrape_timestamp: -1 } },
	);

	const batchesCol = await getGlobalCollection("OfficialPlacementBatches");
	const batchDocs = await batchesCol
		.find({})
		.sort({ batch_name: -1 })
		.toArray();

	if (batchDocs.length > 0) {
		const batches = batchDocs.map(
			({
				_id: _batchId,
				source: _source,
				seed_version: _seedVersion,
				provenance: _provenance,
				updated_at: _updatedAt,
				scrape_timestamp: _batchScrapeTimestamp,
				...batch
			}) => batch,
		);
		return {
			scrape_timestamp: snapshot?.scrape_timestamp ?? null,
			main_heading: snapshot?.main_heading ?? null,
			intro_text: snapshot?.intro_text ?? null,
			recruiter_logos: snapshot?.recruiter_logos ?? [],
			batches,
		};
	}

	// Fallback for environments that have not been seeded/migrated yet.
	return snapshot;
}

/** Build a by-id query that supports both ObjectId and legacy string ids. */
export function idQuery(id: string): Record<string, any> {
	if (ObjectId.isValid(id)) {
		return { _id: new ObjectId(id) };
	}
	return { id };
}

export async function getNoticeById(id: string, year?: string | null) {
	const col = await getCollection("Notices", year);
	return col.findOne(idQuery(id));
}

export async function getPlacementOfferById(id: string, year?: string | null) {
	const col = await getCollection("PlacementOffers", year);
	return col.findOne(idQuery(id));
}

// --- Admin / Write Operations ---

type StudentRecord = Record<string, any>;

function studentIdentity(student: StudentRecord): string | null {
	const enrollment = student.enrollment_number || student.enrollment;
	if (enrollment) {
		return `enrollment:${String(enrollment).trim().toLowerCase()}`;
	}

	const name = String(student.name || "")
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
	return name ? `name:${name}` : null;
}

function timestampToMilliseconds(value: unknown): number | null {
	if (value == null || value === "") return null;

	if (value instanceof Date) {
		const timestamp = value.getTime();
		return Number.isNaN(timestamp) ? null : timestamp;
	}

	if (typeof value === "number") {
		return Number.isFinite(value)
			? value < 10_000_000_000
				? value * 1000
				: value
			: null;
	}

	const rawValue = String(value).trim();
	if (!rawValue) return null;
	const numericValue = Number(rawValue);
	if (
		Number.isFinite(numericValue) &&
		rawValue.split("").every((char) => char >= "0" && char <= "9")
	) {
		return rawValue.length > 10 ? numericValue : numericValue * 1000;
	}

	const timestamp = new Date(rawValue).getTime();
	return Number.isNaN(timestamp) ? null : timestamp;
}

function placementTimestamp(offer: PlacementOffer, fallback: number): number {
	return (
		timestampToMilliseconds(offer.created_at) ??
		timestampToMilliseconds(offer.time_sent) ??
		timestampToMilliseconds(offer.saved_at) ??
		timestampToMilliseconds(offer.createdAt) ??
		fallback
	);
}

function stampStudentOfferDate(
	student: StudentRecord,
	fallbackTimestamp: number,
): StudentRecord {
	const timestamp =
		timestampToMilliseconds(student.offer_received_at) ??
		timestampToMilliseconds(student.offerReceivedAt) ??
		fallbackTimestamp;

	return {
		...student,
		offer_received_at: new Date(timestamp),
		offerReceivedAt: timestamp,
	};
}

export async function createNotice(notice: Notice, year?: string | null) {
	const col = await getCollection("Notices", year);
	// Ensure createdAt is set if not present
	if (!notice.createdAt) {
		notice.createdAt = Date.now();
	}
	const result = await col.insertOne(notice);
	return result;
}

export async function updateNotice(
	id: string,
	update: Partial<Notice>,
	year?: string | null,
) {
	const col = await getCollection("Notices", year);
	// Remove _id from update if present to avoid immutable field error
	const { _id, ...cleanUpdate } = update;

	const result = await col.updateOne(idQuery(id), { $set: cleanUpdate });
	return result;
}

export async function createPlacementOffer(offer: PlacementOffer, year?: string | null) {
	const col = await getCollection("PlacementOffers", year);
	const now = Date.now();
	if (!offer.createdAt) {
		offer.createdAt = now;
	}
	if (Array.isArray(offer.students_selected)) {
		const offerTimestamp = placementTimestamp(offer, now);
		offer.students_selected = offer.students_selected.map((student: StudentRecord) =>
			stampStudentOfferDate(student, offerTimestamp),
		);
		offer.number_of_offers = offer.students_selected.length;
	}
	const result = await col.insertOne(offer);
	return result;
}

export async function updatePlacementOffer(
	id: string,
	update: Partial<PlacementOffer>,
	year?: string | null,
) {
	const col = await getCollection("PlacementOffers", year);
	const { _id, ...cleanUpdate } = update;

	const query = idQuery(id);

	if (Array.isArray(cleanUpdate.students_selected)) {
		const now = Date.now();
		const existingOffer = await col.findOne(query);
		const existingTimestamp = placementTimestamp(existingOffer || {}, now);
		const existingStudents = existingOffer && Array.isArray(existingOffer.students_selected)
			? existingOffer.students_selected
			: [];
		const existingByIdentity = new Map<string, StudentRecord>();

		for (const student of existingStudents) {
			const identity = studentIdentity(student);
			if (identity) {
				existingByIdentity.set(
					identity,
					stampStudentOfferDate(student, existingTimestamp),
				);
			}
		}

		cleanUpdate.students_selected = cleanUpdate.students_selected.map(
			(student: StudentRecord) => {
				const identity = studentIdentity(student);
				const existingStudent = identity
					? existingByIdentity.get(identity)
					: undefined;

				if (!existingStudent) return stampStudentOfferDate(student, now);

				return {
					...student,
					offer_received_at: existingStudent.offer_received_at,
					offerReceivedAt: existingStudent.offerReceivedAt,
				};
			},
		);
		cleanUpdate.number_of_offers = cleanUpdate.students_selected.length;
	}

	const result = await col.updateOne(query, { $set: cleanUpdate });
	return result;
}

// --- Policy Operations ---

import { Policy } from "@/lib/policy";

export async function getPolicy(slug: string) {
	const col = await getCollection("Policies");
	const doc = await col.findOne({ slug });
	return doc as unknown as Policy | null;
}

export async function getPolicies() {
	const col = await getCollection("Policies");
	// Return only necessary fields for the list/picker
	const docs = await col
		.find({}, { projection: { content: 0, toc: 0 } })
		.sort({ createdAt: -1 })
		.toArray();
	return docs as unknown as Partial<Policy>[];
}

export async function createPolicy(policy: Policy) {
	const col = await getCollection("Policies");
	// ensure timestamps
	if (!policy.createdAt) policy.createdAt = new Date().toISOString();
	if (!policy.updatedAt) policy.updatedAt = new Date().toISOString();

	const result = await col.insertOne(policy as any);
	return result;
}

export async function updatePolicy(slug: string, update: Partial<Policy>) {
	const col = await getCollection("Policies");
	const { ...cleanUpdate } = update;
	// auto-update updatedTimestamp? or let caller handle it.
	// Caller usually handles it in this codebase based on other functions.

	const result = await col.updateOne({ slug }, { $set: cleanUpdate });
	return result;
}
