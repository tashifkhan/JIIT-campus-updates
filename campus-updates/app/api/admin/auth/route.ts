
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";

import {
	ADMIN_TOKEN_COOKIE,
	ADMIN_SESSION_MAX_AGE,
	adminSessionSecret,
} from "@/lib/server/auth";
import { createSessionToken } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Best-effort brute-force protection -------------------------------------
// In-memory, per-instance limiter. On serverless platforms each instance has
// its own map, so this is a speed bump, not a guarantee. For strict limiting
// use a shared store (e.g. Upstash Ratelimit).
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 10;

type AttemptRecord = { count: number; resetAt: number };
const attempts = new Map<string, AttemptRecord>();

function clientIp(req: Request): string {
	const forwarded = req.headers.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();
	return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
	const record = attempts.get(ip);
	if (!record) return false;
	if (Date.now() > record.resetAt) {
		attempts.delete(ip);
		return false;
	}
	return record.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string): void {
	const now = Date.now();
	const record = attempts.get(ip);
	if (!record || now > record.resetAt) {
		attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
		return;
	}
	record.count += 1;
}

function clearAttempts(ip: string): void {
	attempts.delete(ip);
}

/** Constant-time password comparison that never leaks length via early exit. */
function passwordMatches(candidate: unknown, expected: string): boolean {
	if (typeof candidate !== "string" || candidate.length === 0) return false;
	const candidateBuffer = Buffer.from(candidate);
	const expectedBuffer = Buffer.from(expected);
	if (candidateBuffer.length !== expectedBuffer.length) {
		// Compare against itself to keep timing roughly constant.
		timingSafeEqual(candidateBuffer, candidateBuffer);
		return false;
	}
	return timingSafeEqual(candidateBuffer, expectedBuffer);
}

export async function POST(req: Request) {
	try {
		const ip = clientIp(req);
		if (isRateLimited(ip)) {
			return NextResponse.json(
				{ ok: false, error: "Too many attempts. Try again later." },
				{ status: 429 },
			);
		}

		const body = await req.json().catch(() => null);
		const password = body?.password;

		const adminPass = process.env.ADMIN_PASS;
		const sessionSecret = adminSessionSecret();

		if (!adminPass || !sessionSecret) {
			console.error("ADMIN_PASS is not set in environment variables.");
			return NextResponse.json(
				{ ok: false, error: "Server configuration error" },
				{ status: 500 },
			);
		}

		if (!passwordMatches(password, adminPass)) {
			recordFailure(ip);
			return NextResponse.json(
				{ ok: false, error: "Invalid password" },
				{ status: 401 },
			);
		}

		clearAttempts(ip);
		const token = await createSessionToken(
			"admin",
			sessionSecret,
			ADMIN_SESSION_MAX_AGE,
		);

		const cookieStore = await cookies();
		cookieStore.set(ADMIN_TOKEN_COOKIE, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			path: "/",
			maxAge: ADMIN_SESSION_MAX_AGE,
		});

		return NextResponse.json({ ok: true });
	} catch (err) {
		console.error("Admin auth error:", err);
		return NextResponse.json(
			{ ok: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE() {
	const cookieStore = await cookies();
	cookieStore.set(ADMIN_TOKEN_COOKIE, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/",
		maxAge: 0,
	});
	return NextResponse.json({ ok: true });
}
