import { type NextRequest, NextResponse } from "next/server";

import { getBranchStats } from "@/lib/server/stats";
import { resolvePlacementYear } from "@/lib/server/placement-years";

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
			{ ok: true, data: await getBranchStats(year, query) },
			{ headers: { "cache-control": "no-store" } },
		);
	} catch (error) {
		console.error("Failed to fetch branch statistics", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to fetch branch statistics" },
			{ status: 500, headers: { "cache-control": "no-store" } },
		);
	}
}
