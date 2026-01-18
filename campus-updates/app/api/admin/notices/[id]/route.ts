
import { NextResponse } from "next/server";
import { updateNotice } from "@/lib/server/data";
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

    const result = await updateNotice(id, body);
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ ok: false, error: "Notice not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    console.error("Error updating notice:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
