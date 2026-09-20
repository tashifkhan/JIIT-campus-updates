import { type NextRequest, NextResponse } from "next/server";

import { getNoticeFeed } from "@/lib/server/notices";
import { resolvePlacementYear } from "@/lib/server/placement-years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function positiveInteger(value: string | null, fallback: number, maximum: number) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) return fallback;
	return Math.min(parsed, maximum);
}

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

		const result = await getNoticeFeed({
			year,
			query: searchParams.get("q") || "",
			categories: searchParams.getAll("category"),
			page: positiveInteger(searchParams.get("page"), 1, 10_000),
			pageSize: positiveInteger(searchParams.get("pageSize"), 20, 50),
			hideShortPlacements: ["1", "true"].includes(
				searchParams.get("hideShortPlacements") || "",
			),
		});

		return NextResponse.json(
			{ ok: true, ...result },
			{ headers: { "cache-control": "no-store" } },
		);
	} catch (error) {
		console.error("Failed to fetch notices", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to fetch notices" },
			{ status: 500, headers: { "cache-control": "no-store" } },
		);
	}
}
