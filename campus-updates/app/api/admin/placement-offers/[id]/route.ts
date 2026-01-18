
import { NextResponse } from "next/server";
import { updatePlacementOffer } from "@/lib/server/data";
import { isAuthenticated, unauthorizedResponse } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
   if (!(await isAuthenticated())) {
      return unauthorizedResponse();
  }
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing ID" }, { status: 400 });
    }

    const body = await req.json();
    if (!body) {
      return NextResponse.json({ ok: false, error: "Missing body" }, { status: 400 });
    }

    const result = await updatePlacementOffer(id, body);

    if (result.matchedCount === 0) {
      return NextResponse.json({ ok: false, error: "Placement Offer not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    console.error("Error updating placement offer:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
