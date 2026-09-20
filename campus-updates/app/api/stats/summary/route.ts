import { type NextRequest, NextResponse } from "next/server";

import { resolvePlacementYear } from "@/lib/server/placement-years";
import { getStatsSummary } from "@/lib/server/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const year = resolvePlacementYear(request.nextUrl.searchParams.get("year"));
		if (!year) {
			return NextResponse.json(
				{ ok: false, error: "Unsupported placement year" },
				{ status: 400, headers: { "cache-control": "no-store" } },
			);
		}
		const query = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
		return NextResponse.json(
			{ ok: true, data: await getStatsSummary(year, query) },
			{ headers: { "cache-control": "no-store" } },
		);
	} catch (error) {
		console.error("Failed to fetch placement summary", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to fetch placement summary" },
			{ status: 500, headers: { "cache-control": "no-store" } },
		);
	}
}
