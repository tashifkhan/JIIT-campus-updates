import { NextResponse } from "next/server";
import { getJobs } from "@/lib/server/data";

// Ensure this route runs on the server at request time
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getJobs();
    return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
