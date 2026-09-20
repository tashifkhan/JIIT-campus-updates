import { NextResponse } from "next/server";
import { getOfficialPlacementData } from "@/lib/server/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getOfficialPlacementData();
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "No placement data found" },
        { status: 404, headers: { "cache-control": "no-store" } },
      );
    }

    // Return only the fields the UI consumes instead of the raw Mongo document
    // (which leaks _id and any future scraper internals).
    const { batches, intro_text, main_heading, recruiter_logos, scrape_timestamp } = data;
    return NextResponse.json(
      {
        ok: true,
        data: { batches, intro_text, main_heading, recruiter_logos, scrape_timestamp },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err: any) {
    console.error("Error fetching official placement data:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
