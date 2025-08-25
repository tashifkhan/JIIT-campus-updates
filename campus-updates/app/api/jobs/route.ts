import { NextResponse } from "next/server";
import { getJobs } from "@/lib/server/data";

export async function GET() {
  try {
    const data = await getJobs();
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
