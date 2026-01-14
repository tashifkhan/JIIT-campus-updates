import { NextResponse } from "next/server";
import { getJobs } from "@/lib/server/data";

// Ensure this route runs on the server at request time
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Job ID is required" },
        { status: 400, headers: { "cache-control": "no-store" } }
      );
    }

    // Find job by id field (not MongoDB _id)
    const jobs = await getJobs({ id }, 1);
    
    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Job not found" },
        { status: 404, headers: { "cache-control": "no-store" } }
      );
    }

    return NextResponse.json(
      { ok: true, data: jobs[0] },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
