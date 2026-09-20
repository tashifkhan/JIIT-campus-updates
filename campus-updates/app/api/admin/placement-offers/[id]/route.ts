
import { NextResponse } from "next/server";
import { getPlacementOfferById, updatePlacementOffer } from "@/lib/server/data";
import { isAuthenticated, unauthorizedResponse } from "@/lib/server/auth";
import { resolvePlacementYear } from "@/lib/server/placement-years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	if (!(await isAuthenticated())) {
		return unauthorizedResponse();
	}
	try {
		const { id } = await params;
		if (!id) {
			return NextResponse.json({ ok: false, error: "Missing ID" }, { status: 400 });
		}

		const year = resolvePlacementYear(new URL(req.url).searchParams.get("year"));
		if (!year) {
			return NextResponse.json(
				{ ok: false, error: "Unsupported placement year" },
				{ status: 400 },
			);
		}

		const offer = await getPlacementOfferById(id, year);
		if (!offer) {
			return NextResponse.json({ ok: false, error: "Placement Offer not found" }, { status: 404 });
		}

		return NextResponse.json(
			{ ok: true, data: offer },
			{ headers: { "cache-control": "no-store" } },
		);
	} catch (err) {
		console.error("Error fetching placement offer:", err);
		return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
	}
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	if (!(await isAuthenticated())) {
		return unauthorizedResponse();
	}
	try {
		const { id } = await params;
		if (!id) {
			return NextResponse.json({ ok: false, error: "Missing ID" }, { status: 400 });
		}

		const year = resolvePlacementYear(new URL(req.url).searchParams.get("year"));
		if (!year) {
			return NextResponse.json(
				{ ok: false, error: "Unsupported placement year" },
				{ status: 400 },
			);
		}

		const body = await req.json();
		if (!body) {
			return NextResponse.json({ ok: false, error: "Missing body" }, { status: 400 });
		}

		const result = await updatePlacementOffer(id, body, year);

		if (result.matchedCount === 0) {
			return NextResponse.json({ ok: false, error: "Placement Offer not found" }, { status: 404 });
		}

		return NextResponse.json({ ok: true, data: result });
	} catch (err) {
		console.error("Error updating placement offer:", err);
		return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
	}
}
