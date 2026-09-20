import { NextResponse } from "next/server";

import { getJobById } from "@/lib/server/jobs";
import { resolvePlacementYear } from "@/lib/server/placement-years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		if (!id) {
			return NextResponse.json(
				{ ok: false, error: "Job ID is required" },
				{ status: 400, headers: { "cache-control": "no-store" } },
			);
		}

		const year = resolvePlacementYear(new URL(request.url).searchParams.get("year"));
		if (!year) {
			return NextResponse.json(
				{ ok: false, error: "Unsupported placement year" },
				{ status: 400, headers: { "cache-control": "no-store" } },
			);
		}

		const job = await getJobById(id, year);
		if (!job) {
			return NextResponse.json(
				{ ok: false, error: "Job not found" },
				{ status: 404, headers: { "cache-control": "no-store" } },
			);
		}

		return NextResponse.json(
			{ ok: true, data: job },
			{ headers: { "cache-control": "no-store" } },
		);
	} catch (error) {
		console.error("Failed to fetch job", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to fetch job" },
			{ status: 500, headers: { "cache-control": "no-store" } },
		);
	}
}
