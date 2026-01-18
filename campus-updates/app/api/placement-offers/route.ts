import { NextResponse } from "next/server";
import { getPlacementOffers } from "@/lib/server/data";

// Ensure this route runs on the server at request time
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getPlacementOffers();

    // Sanitize data to remove sensitive fields
    const sanitizedData = data.map((offer: any) => {
      // Create a shallow copy and delete sensitive top-level fields
      const { email_sender, email_subject, additional_info, ...rest } = offer;
      
      if (rest.time_sent) {
        rest.saved_at = rest.time_sent;
      }
      
      // Sanitize students_selected if it exists
      if (rest.students_selected && Array.isArray(rest.students_selected)) {
        rest.students_selected = rest.students_selected.map((student: any) => {
          const { email, ...studentRest } = student;
          return studentRest;
        });
      }
      return rest;
    });

    return NextResponse.json({ ok: true, data: sanitizedData }, { headers: { "cache-control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
