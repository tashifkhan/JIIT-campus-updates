import { NextResponse } from "next/server";
import { getPolicies } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const policies = await getPolicies();
		return NextResponse.json({ ok: true, policies });
	} catch (error) {
		console.error("Error fetching policies:", error);
		return NextResponse.json(
			{ ok: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
