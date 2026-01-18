import { NextResponse } from "next/server";
import { getNotices } from "@/lib/server/data";

// Ensure this route runs on the server at request time
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const extractTimeSent = (text: string): string | undefined => {
  if (!text) return undefined;
  
  // Pattern 1: ISO format "Sent: 2025-08-21T16:51:00+05:30" or similar with emoji
  const isoMatch = text.match(/(?:📅|⏰|Start:|Sent:|On:)\s*([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}:?[0-9]{2})?)/i);
  
  if (isoMatch && isoMatch[1]) {
    return isoMatch[1].trim();
  }
  
  // Pattern 2: Human-readable format "*On:* July 17, 2025 at 12:01 PM IST"
  // The colon can be inside or outside the asterisks: *On:* or *On*: or On:
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

export async function GET() {
  try {
    const data = await getNotices();
    const normalizedData = data.map((notice: any) => {
      // Create a shallow copy to modify
      const processed: any = { ...notice };
      // Normalization: Map 'type' to 'category' if 'category' is missing
      if (processed.type && !processed.category) {
        processed.category = processed.type;
      }
      // Normalize category names (e.g. "job_posting" -> "job posting")
      if (processed.category) {
        let cat = processed.category.toLowerCase().trim();
        if (cat === "job_posting" || cat === "jobposting") {
          cat = "job posting";
        }
        processed.category = cat;
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
      // ELSE: processed.saved_at remains as the existing "other" value (e.g. DB saved_at)
      
      return processed;
    }).filter((n: any) => {
      const cat = (n.category || "").toLowerCase().trim();
      return cat !== "placement_update" && cat !== "placement_updates";
    });
    return NextResponse.json({ ok: true, data: normalizedData }, { headers: { "cache-control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
