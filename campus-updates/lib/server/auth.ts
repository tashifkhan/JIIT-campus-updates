import { cookies } from "next/headers";

import { NextResponse } from "next/server";

export async function isAuthenticated() {
	const cookieStore = await cookies();
	const token = cookieStore.get("admin_token");
	return token?.value === "authenticated";
}

export function unauthorizedResponse() {
	return NextResponse.json(
		{ ok: false, error: "Unauthorized" },
		{ status: 401 },
	);
}
