
import { NextResponse } from "next/server";
import { createPlacementOffer, getPlacementOffers } from "@/lib/server/data";
import { isAuthenticated, unauthorizedResponse } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthenticated())) {
    return unauthorizedResponse();
  }
  
  try {
    const data = await getPlacementOffers();

    // Sanitize data to remove sensitive fields and process for display
    const sanitizedData = data.map((offer: any) => {
      const { email_sender, email_subject, additional_info, ...rest } = offer;
      
      // Use time_sent as saved_at if available
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

    return NextResponse.json(
      { ok: true, data: sanitizedData },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err: any) {
    console.error("Error fetching placement offers:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return unauthorizedResponse();
  }
  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ ok: false, error: "Missing body" }, { status: 400 });
    }

    if (!body.company) {
      return NextResponse.json({ ok: false, error: "Placement Offer must have a company name" }, { status: 400 });
    }

    const result = await createPlacementOffer(body);
    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    console.error("Error creating placement offer:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
