import clientPromise from "./mongodb";

export type Job = any;
export type Notice = any;
export type PlacementOffer = any;

const DB_NAME = process.env.MONGODB_DB || "SupersetPlacement";

export async function getCollection(collectionName: string) {
	const client = await clientPromise;
	const db = client.db(DB_NAME);
	return db.collection(collectionName);
}

export async function getJobs(filter: any = {}, limit = 1000) {
	const col = await getCollection("Jobs");
	const docs = await col
		.find(filter)
		.sort({ createdAt: -1 })
		.limit(limit)
		.toArray();
	return docs;
}

export async function getNotices(filter: any = {}, limit = 1000) {
	const col = await getCollection("Notices");
	const docs = await col
		.find(filter)
		.sort({ createdAt: -1 })
		.limit(limit)
		.toArray();
	return docs;
}

export async function getPlacementOffers(filter: any = {}, limit = 1000) {
	const col = await getCollection("PlacementOffers");
	const docs = await col
		.find(filter)
		.sort({ createdAt: -1 })
		.limit(limit)
		.toArray();
	return docs;
}

import { ObjectId } from "mongodb";

export async function getOfficialPlacementData() {
	const col = await getCollection("OfficialPlacementData");
	const doc = await col.findOne({}, { sort: { scrape_timestamp: -1 } });
	return doc;
}

// --- Admin / Write Operations ---

export async function createNotice(notice: Notice) {
	const col = await getCollection("Notices");
	// Ensure createdAt is set if not present
	if (!notice.createdAt) {
		notice.createdAt = Date.now();
	}
	const result = await col.insertOne(notice);
	return result;
}

export async function updateNotice(id: string, update: Partial<Notice>) {
	const col = await getCollection("Notices");
	// Remove _id from update if present to avoid immutable field error
	const { _id, ...cleanUpdate } = update;

	// Try to create an ObjectId, otherwise use the string id directly (some legacy ids might be strings)
	let query: any = {};
	if (ObjectId.isValid(id)) {
		query = { _id: new ObjectId(id) };
	} else {
		query = { id: id };
	}

	const result = await col.updateOne(query, { $set: cleanUpdate });
	return result;
}

export async function createPlacementOffer(offer: PlacementOffer) {
	const col = await getCollection("PlacementOffers");
	if (!offer.createdAt) {
		offer.createdAt = Date.now();
	}
	const result = await col.insertOne(offer);
	return result;
}

export async function updatePlacementOffer(
	id: string,
	update: Partial<PlacementOffer>,
) {
	const col = await getCollection("PlacementOffers");
	const { _id, ...cleanUpdate } = update;

	let query: any = {};
	if (ObjectId.isValid(id)) {
		query = { _id: new ObjectId(id) };
	} else {
		query = { id: id };
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

	const result = await col.insertOne(policy);
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
