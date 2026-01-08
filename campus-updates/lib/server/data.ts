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

export async function getOfficialPlacementData() {
  const col = await getCollection("OfficialPlacementData");
  const doc = await col.findOne({}, { sort: { scrape_timestamp: -1 } });
  return doc;
}
