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
  const docs = await col.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs;
}

export async function getNotices(filter: any = {}, limit = 1000) {
  const col = await getCollection("Notices");
  const docs = await col.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs;
}

export async function getPlacementOffers(filter: any = {}, limit = 1000) {
  const col = await getCollection("PlacementOffers");
  const docs = await col.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
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

export async function updatePlacementOffer(id: string, update: Partial<PlacementOffer>) {
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
