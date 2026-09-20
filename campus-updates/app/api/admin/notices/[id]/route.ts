
import { NextResponse } from "next/server";
import { getNoticeById, updateNotice } from "@/lib/server/data";
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

		const notice = await getNoticeById(id, year);
		if (!notice) {
			return NextResponse.json({ ok: false, error: "Notice not found" }, { status: 404 });
		}

		return NextResponse.json(
			{ ok: true, data: notice },
			{ headers: { "cache-control": "no-store" } },
		);
	} catch (err) {
		console.error("Error fetching notice:", err);
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

		const result = await updateNotice(id, body, year);

		if (result.matchedCount === 0) {
			return NextResponse.json({ ok: false, error: "Notice not found" }, { status: 404 });
		}

		return NextResponse.json({ ok: true, data: result });
	} catch (err) {
		console.error("Error updating notice:", err);
		return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
	}
}
