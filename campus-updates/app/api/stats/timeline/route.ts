import { type NextRequest, NextResponse } from "next/server";

import { resolvePlacementYear } from "@/lib/server/placement-years";
import { getTimelineStats } from "@/lib/server/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const year = resolvePlacementYear(searchParams.get("year"));
		if (!year) {
			return NextResponse.json(
				{ ok: false, error: "Unsupported placement year" },
				{ status: 400, headers: { "cache-control": "no-store" } },
			);
		}
		const query = (searchParams.get("q") || "").trim().toLowerCase();
		const timeFrame = searchParams.get("timeFrame") === "day" ? "day" : "month";
		const cumulative = !["0", "false"].includes(searchParams.get("cumulative") || "");
		return NextResponse.json(
			{ ok: true, data: await getTimelineStats(year, query, timeFrame, cumulative) },
			{ headers: { "cache-control": "no-store" } },
		);
	} catch (error) {
		console.error("Failed to fetch placement timeline", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to fetch placement timeline" },
			{ status: 500, headers: { "cache-control": "no-store" } },
		);
	}
}
