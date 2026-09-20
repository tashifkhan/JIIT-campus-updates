import { MongoClient } from "mongodb";

declare global {
	// Allow global type augmentation for MongoDB client caching
	var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Lazily create the client on first use. Throwing at module scope would make
 * `next build` fail during page-data collection (route modules are imported
 * at build time, where no secrets are present).
 */
export function getMongoClient(): Promise<MongoClient> {
	if (!global._mongoClientPromise) {
		const uri = process.env.MONGODB_URI;
		if (!uri) {
			throw new Error(
				"Missing MONGODB_URI environment variable. Set MONGODB_URI to your MongoDB connection string.",
			);
		}
		// Cache across module reloads in development.
		global._mongoClientPromise = new MongoClient(uri).connect();
	}
	return global._mongoClientPromise;
}
