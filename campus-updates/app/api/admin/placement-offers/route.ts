
import { NextResponse } from "next/server";
import { createPlacementOffer, getPlacementOffers } from "@/lib/server/data";
import { isAuthenticated, unauthorizedResponse } from "@/lib/server/auth";
import { resolvePlacementYear } from "@/lib/server/placement-years";
import { sanitizePlacementOffer } from "@/lib/server/sanitize-offer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAuthenticated())) {
    return unauthorizedResponse();
  }

  const year = resolvePlacementYear(new URL(req.url).searchParams.get("year"));
  if (!year) {
    return NextResponse.json(
      { ok: false, error: "Unsupported placement year" },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const data = await getPlacementOffers({}, 1000, year);
    const sanitizedData = data.map(sanitizePlacementOffer);

    return NextResponse.json(
      { ok: true, data: sanitizedData },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err: any) {
    console.error("Error fetching placement offers:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return unauthorizedResponse();
  }

  const year = resolvePlacementYear(new URL(req.url).searchParams.get("year"));
  if (!year) {
    return NextResponse.json(
      { ok: false, error: "Unsupported placement year" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ ok: false, error: "Missing body" }, { status: 400 });
    }

    if (!body.company) {
      return NextResponse.json({ ok: false, error: "Placement Offer must have a company name" }, { status: 400 });
    }

    const result = await createPlacementOffer(body, year);
    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    console.error("Error creating placement offer:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
