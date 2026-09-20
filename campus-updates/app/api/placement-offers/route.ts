import { NextResponse } from "next/server";
import { getPlacementOffers } from "@/lib/server/data";
import { resolvePlacementYear } from "@/lib/server/placement-years";
import { sanitizePlacementOffer } from "@/lib/server/sanitize-offer";

// Ensure this route runs on the server at request time
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const year = resolvePlacementYear(new URL(request.url).searchParams.get("year"));
  if (!year) {
    return NextResponse.json(
      { ok: false, error: "Unsupported placement year" },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const data = await getPlacementOffers({}, 1000, year);
    const sanitizedData = data.map(sanitizePlacementOffer);

    return NextResponse.json({ ok: true, data: sanitizedData }, { headers: { "cache-control": "no-store" } });
  } catch (err: any) {
    console.error("Error fetching placement offers:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
