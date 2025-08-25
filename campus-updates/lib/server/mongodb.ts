import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable. Set MONGODB_URI to your MongoDB connection string.");
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Use a global variable so the client is cached across module reloads in development
const clientPromise: Promise<MongoClient> = global._mongoClientPromise || (global._mongoClientPromise = new MongoClient(uri).connect());

export default clientPromise;
