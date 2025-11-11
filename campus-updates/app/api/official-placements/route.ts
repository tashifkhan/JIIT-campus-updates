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
        { status: 404 }
      );
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to fetch official placement data",
      },
      { status: 500 }
    );
  }
}
