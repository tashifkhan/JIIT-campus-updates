
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifySessionToken } from "./session";

export const ADMIN_TOKEN_COOKIE = "admin_token";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 1 week

/**
 * Secret used to sign admin session tokens. ADMIN_SESSION_SECRET is preferred;
 * ADMIN_PASS is an acceptable fallback since it is already a server-only secret.
 */
export function adminSessionSecret(): string {
	return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASS || "";
}

export async function isAuthenticated() {
	const cookieStore = await cookies();
	const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;
	return verifySessionToken(token, "admin", adminSessionSecret());
}

export function unauthorizedResponse() {
	return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
