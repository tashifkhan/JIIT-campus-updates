import { type NextRequest, NextResponse } from "next/server";

import { getJobFeed } from "@/lib/server/jobs";
import { resolvePlacementYear } from "@/lib/server/placement-years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function positiveInteger(value: string | null, fallback: number, maximum: number) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) return fallback;
	return Math.min(parsed, maximum);
}

function boundedNumber(
	value: string | null,
	fallback: number,
	minimum: number,
	maximum: number,
) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(Math.max(parsed, minimum), maximum);
}

function stringValues(searchParams: URLSearchParams, key: string): string[] {
	return searchParams.getAll(key).map((value) => value.trim()).filter(Boolean);
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

		const cgpaMin = boundedNumber(searchParams.get("cgpaMin"), 0, 0, 10);
		const cgpaMax = boundedNumber(searchParams.get("cgpaMax"), 10, 0, 10);
		const result = await getJobFeed({
			year,
			query: (searchParams.get("q") || "").trim().toLowerCase(),
			categories: searchParams
				.getAll("category")
				.map(Number)
				.filter((value) => Number.isInteger(value)),
			locations: stringValues(searchParams, "location"),
			genders: stringValues(searchParams, "gender"),
			courses: stringValues(searchParams, "course"),
			minPackageLpa: boundedNumber(
				searchParams.get("minPackageLpa"),
				0,
				0,
				1_000,
			),
			cgpaMin: Math.min(cgpaMin, cgpaMax),
			cgpaMax: Math.max(cgpaMin, cgpaMax),
			openOnly: ["1", "true"].includes(searchParams.get("openOnly") || ""),
			page: positiveInteger(searchParams.get("page"), 1, 10_000),
			pageSize: positiveInteger(searchParams.get("pageSize"), 24, 60),
		});

		return NextResponse.json(
			{ ok: true, ...result },
			{ headers: { "cache-control": "no-store" } },
		);
	} catch (error) {
		console.error("Failed to fetch jobs", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to fetch jobs" },
			{ status: 500, headers: { "cache-control": "no-store" } },
		);
	}
}
