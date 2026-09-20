import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { GATE_COOKIE, GATE_MAX_AGE, gateSecret } from "@/lib/server/gate";
import { createSessionToken } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
	const secret = gateSecret();
	if (!secret) {
		console.error("GATE_SECRET (or ADMIN_PASS fallback) is not set.");
		return NextResponse.json(
			{ ok: false, error: "Server configuration error" },
			{ status: 500 },
		);
	}

	const token = await createSessionToken("gate", secret, GATE_MAX_AGE);
	const cookieStore = await cookies();
	cookieStore.set(GATE_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: GATE_MAX_AGE,
	});

	return NextResponse.json({ ok: true });
}
