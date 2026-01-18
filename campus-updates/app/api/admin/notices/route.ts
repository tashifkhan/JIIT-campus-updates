
import { NextResponse } from "next/server";
import { createNotice, getNotices } from "@/lib/server/data";
import { isAuthenticated, unauthorizedResponse } from "@/lib/server/auth";
import { normalizeCategory } from "@/lib/notices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Extract time_sent from formatted message or content using regex patterns.
 * Looks for patterns like:
 * - "Sent: 2025-08-21T16:51:00+05:30" (ISO format)
 * - "*On * July 17, 2025 at 12:01 PM IST" (human-readable format)
 */
const extractTimeSent = (text: string): string | undefined => {
  if (!text) return undefined;
  
  // Pattern 1: ISO format "Sent: 2025-08-21T16:51:00+05:30" or similar with emoji
  const isoMatch = text.match(/(?:📅|⏰|Start:|Sent:|On:)\s*([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}:?[0-9]{2})?)/i);
  
  if (isoMatch && isoMatch[1]) {
    return isoMatch[1].trim();
  }
  
  // Pattern 2: Human-readable format "*On:* July 17, 2025 at 12:01 PM IST"
  // The colon can be inside or outside the asterisks: *On:* or *On*: or On:
  // Regex handles: *On:* Month Day, Year at HH:MM AM/PM IST
  const humanMatch = text.match(/\*?On:?\*?\s*:?\s*([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*(?:IST)?/i);
  
  if (humanMatch) {
    const [, monthStr, day, year, hourStr, minute, ampm] = humanMatch;
    
    const months: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    
    const monthIndex = months[monthStr.toLowerCase()];
    if (monthIndex === undefined) return undefined;
    
    let hour = parseInt(hourStr, 10);
    const minuteNum = parseInt(minute, 10);
    
    // Convert 12-hour to 24-hour format
    if (ampm.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    // Create Date object and return ISO string
    const date = new Date(
      parseInt(year, 10),
      monthIndex,
      parseInt(day, 10),
      hour,
      minuteNum,
      0
    );
    
    return date.toISOString();
  }
  
  return undefined;
};

/**
 * Normalize and process a notice document for API response.
 */
const processNotice = (notice: any) => {
  const processed: any = { ...notice };

  // Normalization: Map 'type' to 'category' if 'category' is missing
  if (processed.type && !processed.category) {
    processed.category = processed.type;
  }

  // Normalize category names using shared helper
  if (processed.category) {
    let cat = processed.category.toLowerCase().trim();
    if (cat === "job_posting" || cat === "jobposting") {
      cat = "job posting";
    }
    processed.category = normalizeCategory(cat);
  }

  // Always try to extract time from formatted_message or content
  const extractedTime = extractTimeSent(processed.formatted_message) || extractTimeSent(processed.content);
  
  // Use extracted time, or fall back to existing time_sent
  const timeSent = extractedTime || processed.time_sent;

  if (timeSent) {
    // Set both saved_at and time_sent to the extracted/existing time
    processed.saved_at = timeSent;
    processed.time_sent = timeSent;
  }

  return processed;
};

export async function GET() {
  if (!(await isAuthenticated())) {
    return unauthorizedResponse();
  }
  
  try {
    const data = await getNotices();

    const normalizedData = data
      .map(processNotice)
      .filter((n: any) => {
        const cat = (n.category || "").toLowerCase().trim();
        return cat !== "placement_update" && cat !== "placement_updates";
      });

    return NextResponse.json(
      { ok: true, data: normalizedData },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err: any) {
    console.error("Error fetching notices:", err);
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

    // Basic validation: Title or Content is usually good to have
    if (!body.title && !body.content && !body.formatted_message) {
      return NextResponse.json({ ok: false, error: "Notice must have at least title, content or formatted_message" }, { status: 400 });
    }

    const result = await createNotice(body);
    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    console.error("Error creating notice:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
