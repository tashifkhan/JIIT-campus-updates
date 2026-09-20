/**
 * Shared constants for the public access gate. Imported by the /api/gate
 * route (Node.js) and middleware (Edge), so keep it free of Node-only APIs
 * and do NOT mark it "server-only".
 */

export const GATE_COOKIE = "site_access";
export const GATE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** The maintenance gate is opt-in so a missing secret cannot lock the site. */
export function isGateEnabled(): boolean {
	return process.env.SITE_GATE_ENABLED === "true";
}

/**
 * Secret used to sign the public access-gate cookie. This protects the "site
 * unavailable" wall from being bypassed by simply hitting the API routes.
 * Note: this is a soft gate (any visitor can unlock via the UI); it exists to
 * stop anonymous scraping of the raw APIs, not as real access control.
 */
export function gateSecret(): string {
	return process.env.GATE_SECRET || process.env.ADMIN_PASS || "";
}
