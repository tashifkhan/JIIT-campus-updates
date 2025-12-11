// Shared notice types and parsing/formatting helpers
export type Notice = {
  id: string;
  category: string;
  matched_job: { id: string; company: string; job_profile: string } | null;
  extracted?: any;
  formatted_message: string;
  createdAt?: number;
  content?: string;
  author?: string;
  shortlisted_students?: Array<{ name: string; enrollment_number: string }>;
};

export const normalizeCategory = (cat: string): string => {
  const c = (cat || "").toLowerCase().trim();
  if (/^\[?shortlist(ing)?\]?$/.test(c)) return "shortlisting";
  return c;
};

export const parseFormattedMessage = (message: string, category: string) => {
  let processedMessage = (message || "").replace(/\r/g, "");

  processedMessage = processedMessage
    .split("\n")
    .filter((ln) => {
      const t = ln.replace(/\*+/g, "").trim();
      if (/^(?:[\s\*🔔📢⚠️🎉📰]*\bAnnouncement\b[\s\*🔔📢⚠️🎉📰]*)$/i.test(t))
        return false;
      return true;
    })
    .join("\n");

  if (category.toLowerCase().includes("shortlisting")) {
    processedMessage = processedMessage
      .replace(/Congratulations to the following students:\s*/gi, "")
      .replace(/^[A-Za-z\s]+\s*\(\d+\)\s*$/gm, "")
      .replace(/^[A-Z][A-Za-z\s]*\s*\(\d{6,}\)\s*$/gm, "")
      .replace(/^\(\d{6,}\)\s*$/gm, "");
  }

  const rawLines = processedMessage.split("\n");
  const lines = rawLines.map((line) => line.trim());
  let title = "";
  let body = "";
  let eligibility = "";
  let hiringProcess = "";
  let deadline = "";
  let location = "";
  let ctc = "";
  let company = "";
  let role = "";

  const firstNonEmptyIdx = lines.findIndex((l) => l.length > 0);
  if (firstNonEmptyIdx >= 0) {
    title = lines[firstNonEmptyIdx]
      .replace(/^\*\*|\*\*$/g, "")
      .replace(/^#+\s*/, "")
      .replace(/📢|🎉|⚠️|💼|🔔/g, "")
      .replace(/Job Posting|Shortlisting Update|Update|Announcement/gi, "")
      .trim();
  }

  let inEligibility = false;
  let inHiring = false;
  const bodyLines: string[] = [];
  const eligibilityLines: string[] = [];
  const hiringLines: string[] = [];

  for (let i = Math.max(0, firstNonEmptyIdx + 1); i < lines.length; i++) {
    const rawLine = rawLines[i] || "";
    const line = lines[i];
    const cleanLine = line.replace(/^\*\*|\*\*$/g, "").replace(/^#+\s*/, "");

    if (line.match(/\*\*Company:\*\*\s*(.+)/i)) {
      company = line.match(/\*\*Company:\*\*\s*(.+)/i)?.[1] || "";
      continue;
    }
    if (line.match(/\*\*Role:\*\*\s*(.+)/i)) {
      role = line.match(/\*\*Role:\*\*\s*(.+)/i)?.[1] || "";
      continue;
    }
    if (line.match(/\*\*CTC:\*\*\s*(.+)/i)) {
      ctc = line.match(/\*\*CTC:\*\*\s*(.+)/i)?.[1] || "";
      continue;
    }
    if (line.match(/\*\*Location:\*\*\s*(.+)/i)) {
      location = line.match(/\*\*Location:\*\*\s*(.+)/i)?.[1] || "";
      continue;
    }

    if (line.match(/⚠️.*deadline/i) || line.match(/deadline/i)) {
      deadline = line
        .replace(/⚠️|\*\*/g, "")
        .replace(/deadline:?\s*/i, "")
        .trim();
      continue;
    }

    if (line.match(/eligibility|criteria/i)) {
      inEligibility = true;
      inHiring = false;
      continue;
    }
    if (line.match(/hiring\s*(process|flow)/i)) {
      inHiring = true;
      inEligibility = false;
      continue;
    }
    if (line.match(/posted\s*by/i) || line.match(/on:/i)) {
      inEligibility = false;
      inHiring = false;
      continue;
    }

    if (inEligibility && !line.match(/posted\s*by/i)) {
      const cleanEligibilityLine = cleanLine.replace(/\*\*/g, "").trim();
      eligibilityLines.push(cleanEligibilityLine);
    } else if (inHiring && !line.match(/posted\s*by/i)) {
      hiringLines.push(cleanLine);
    } else if (
      !line.match(/company:|role:|ctc:|location:|posted\s*by|on:/i) &&
      !line.match(/📢|🎉|job posting|shortlisting update|announcement/i)
    ) {
      // Drop orphan bracket-only lines like ")" or "("
      if (!/^\s*[(){}\[\]]\s*$/.test(line)) {
        bodyLines.push(rawLine);
      }
    }
  }

  body = bodyLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // Sanitize CTC text for trailing orphan "(" e.g., "4.5 LPA ("
  if (ctc) ctc = ctc.replace(/\s*\($/, "").trim();
  eligibility = eligibilityLines.join("\n").trim();
  hiringProcess = hiringLines.join("\n").trim();

  return {
    title,
    body,
    eligibility,
    hiringProcess,
    deadline,
    location,
    ctc,
    company,
    role,
  };
};

export const formatEligibility = (eligibilityText: string) => {
  if (!eligibilityText) return null;
  const lines = eligibilityText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const criteria: any[] = [];

  const isDegreeLine = (line: string) => {
    // Only match checks that clearly start with a degree name.
    // We avoid generic " - " check because it catches "Xth - 70%" too.
    return /^B\.?Tech|^M\.?Tech|^MBA|^MCA|^BBA|^BCA|^Ph\.?D/i.test(line);
  };

  const getLevelFromContext = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("10th") || t.includes("xth") || t.includes("ssc"))
      return "Xth";
    if (t.includes("12th") || t.includes("xiith") || t.includes("hsc"))
      return "XIIth";
    if (
      t.includes("current") ||
      t.includes("ug") ||
      t.includes("graduation") ||
      t.includes("degree") ||
      t.includes("b.tech")
    )
      return "UG";
    if (t.includes("pg") || t.includes("post") || t.includes("m.tech"))
      return "PG";
    if (t.includes("marks")) return "Marks";
    if (t.includes("cgpa")) return "CGPA";
    if (t.includes("percentage")) return "Percentage";
    return text.trim().replace(/[:=-]$/, "").trim();
  };

  for (const line of lines) {
    if (line.match(/courses?:|branches?:/i)) {
      const coursesMatch =
        line.match(/courses?:\s*(.+)/i) || line.match(/branches?:\s*(.+)/i);
      if (coursesMatch) {
        const vals = coursesMatch[1]
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        criteria.push({
          type: "courses",
          value: vals,
        });
      }
      continue;
    }

    // Degree lines (e.g. "M.Tech - Biotechnology") should be general
    if (isDegreeLine(line) && !line.match(/cgpa|marks|%/i)) {
       criteria.push({
        type: "general",
        value: line,
      });
      continue;
    }

    // Parse Marks/CGPA using context
    // We look for a number at the end (or near end) of the string
    // e.g. "Xth: 70", "Xth - 70%", "Marks (10th): 70.0"
    const valueMatch = line.match(
      /(?:[:=-]|\s+|^)\s*(\d+\.?\d*)\s*(cgpa|%|percent)?\s*$/i
    );

    if (valueMatch) {
      const rawValue = valueMatch[1];
      // Infer unit: if "cgpa" or value <= 10 (heuristic), use CGPA, else %
      // User requested explicit check, but we can default safely
      let unit = valueMatch[2]
        ? valueMatch[2].toLowerCase().includes("cgpa")
          ? "CGPA"
          : "%"
        : Number(rawValue) <= 10
        ? "CGPA"
        : "%";

      const context = line.substring(0, valueMatch.index).trim();
      
      // If the line started with a degree (e.g. "M.Tech - 5 CGPA"),
      // we might want it as general OR as a marks criteria.
      // Current requirement: "M.Tech. Post Graduate - 5 CGPA" -> Show as list (general)?
      // User said: "if there is no current cgpa requirements then they shd just just play the all the other requements as a list only"
      // But if it is "M.Tech - 5 CGPA", it's a specific requirement.
      // Let's treat it as marks if we can parse context, but if context is a degree name, maybe force general?
      // Actually, my `isDegreeLine` check above handles "M.Tech - Biotechnology". 
      // "M.Tech - 5 CGPA" matches `marks` regex inside it? 
      // Loop condition: `if (isDegreeLine(line) && !line.match(/cgpa|marks|%/i))`
      // So "M.Tech - 5 CGPA" FAILS that check (it has CGPA), so it comes here.
      // Context: "M.Tech -". Level: "M.Tech".
      // This will render "M.Tech : 5 CGPA". This seems arguably correct/better than bullet?
      // But if the user strictly wants "Xth", "XIIth", "UG", then "M.Tech" as a level might be weird if inconsistent.
      // Let's stick to parsing it.

      if (context) {
        const level = getLevelFromContext(context);
        criteria.push({
          type: "marks",
          level: level,
          value: rawValue,
          unit: unit,
        });
        continue;
      }
    }
    
    if (line.match(/no\s*backlogs?/i)) {
      criteria.push({ type: "requirement", value: "No backlogs" });
    } else {
      // General fallback
      const val = line.replace(/^[-•\d.\)]+\s*|\*\s*/, "").trim();
      if (val && !val.match(/eligibility criteria:?/i)) {
        criteria.push({
          type: "general",
          value: val,
        });
      }
    }
  }

  return criteria;
};

export const formatHiringProcess = (hiringText: string) => {
  if (!hiringText) return [];
  const lines = hiringText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const steps: string[] = [];

  for (const line of lines) {
    let step = line
      .replace(/^\d+\.?\s*/, "")
      .replace(/^-/, "")
      .replace(/^\*\s*/, "")
      .trim();
    if (step && !step.match(/^hiring|^process|^flow/i)) {
      steps.push(step);
    }
  }

  return steps;
};

export const formatDateTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
};

export const parseShortlistFromText = (text: string) => {
  if (!text) return [];
  const results: any[] = [];
  const seen = new Set<string>();
  const cleaned = text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

  const patternA = /([A-Za-z][A-Za-z.'\- ]+?)\s*\(([A-Za-z0-9]{7,})\)/g;
  let matchA: RegExpExecArray | null;
  while ((matchA = patternA.exec(cleaned))) {
    const name = matchA[1].trim();
    const enroll = matchA[2];
    if (!seen.has(enroll)) {
      results.push({ name, enrollment_number: enroll });
      seen.add(enroll);
    }
  }

  const patternB =
    /(\d+\s+)?([A-Za-z0-9]{7,})\s+([^@\d][A-Za-z .'-]+?)(?:\s+([\w.+-]+@[\w.-]+\.[A-Za-z]{2,}))?(?:\s+(CL\d+|[A-Z]{2}\d+))(?=\s|$)/g;
  let matchB: RegExpExecArray | null;
  while ((matchB = patternB.exec(cleaned))) {
    const enroll = matchB[2];
    const name = matchB[3].trim();
    const email = matchB[4];
    const venue = matchB[5];
    if (!seen.has(enroll)) {
      results.push({ name, enrollment_number: enroll, email, venue });
      seen.add(enroll);
    }
  }

  return results;
};

export const extractShortlistingSections = (text: string, noticeData?: any) => {
  const src = (text || "").replace(/\r/g, "\n");
  const lines = src.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const summary: string[] = [];
  const hiringSteps: string[] = [];
  const companyRole: { company?: string; role?: string; ctcAmount?: string } = {};
  let ctcLines: string[] = [];
  let inHiring = false;
  let inCTC = false;

  const isStudentLine = (l: string) => /\(\d{7,}\)/.test(l) || /\b\d{7,}\b/.test(l);

  for (const l of lines.slice(0, 6)) {
    const m1 = l.match(/Company\s*:\s*([^|]+?)(?:\s*\||$)/i);
    if (m1) companyRole.company = m1[1].trim();
    const m2 = l.match(/Role\s*:\s*([^|]+?)(?:\s*\||$)/i);
    if (m2) companyRole.role = m2[1].trim();
    const m3 = l.match(/CTC\s*:\s*([0-9.]+)\s*(LPA|lacs?)/i);
    if (m3) companyRole.ctcAmount = `${m3[1]} ${m3[2].toUpperCase()}`;
  }

  for (const l of lines) {
    const lower = l.toLowerCase();
    const plain = lower.replace(/[>*_`~#:\\-]+/g, "").trim();
    if (/^hiring process\s*:/i.test(lower)) {
      inHiring = true;
      inCTC = false;
      continue;
    }
    if (/^(ctc|package|compensation|salary component)/i.test(l) || /^(ctc|package|compensation|salary component)/i.test(plain)) {
      inCTC = true;
      inHiring = false;
      ctcLines.push(l);
      continue;
    }
    if (/^posted by|^posted on|^\*posted by\*/i.test(lower)) {
      inHiring = false;
      inCTC = false;
    }

    if (inHiring) {
      if (!isStudentLine(l)) hiringSteps.push(l.replace(/^[-•\d.\)]+\s*/, "").trim());
      continue;
    }
    if (inCTC) {
      ctcLines.push(l);
      continue;
    }
    if (!isStudentLine(l)) summary.push(l);
  }

  const summaryMarkdown = summary.slice(0, 6).join("\n\n");
  const ctcMarkdown = ctcLines.join("\n");

  if (!companyRole.ctcAmount && noticeData?.matched_job) {
    const packageMatch = (noticeData as any).package;
    if (packageMatch) {
      companyRole.ctcAmount = packageMatch.includes("LPA") ? packageMatch : `${packageMatch} LPA`;
    }
  }

  return {
    summaryMarkdown,
    hiringSteps: hiringSteps.filter(Boolean),
    ctcMarkdown,
    ...companyRole,
  };
};

// Heuristic to detect short placement-bot style posts that only announce placements
// and should be hidden from the main feed. This covers examples like:
// "1 student have been placed at InterviewBit." with a short formatted_message
// and a congratulatory line. It's intentionally conservative to avoid dropping
// legitimate, detailed placement updates.
export const isPlacementBotPost = (notice: Partial<Notice> | { formatted_message?: string; title?: string; author?: string; content?: string }) => {
  const n: any = notice as any;
  const text = `${n.formatted_message || ""}\n${n.title || ""}\n${n.content || ""}`.toLowerCase();

  // Common short patterns seen in placement bot posts
  const shortAnnouncementPatterns = [
    /\bstudent(s)? have been placed at\b/i, // e.g. "1 student have been placed at InterviewBit."
    /\bstudent(s)? has been placed at\b/i, // grammar variants
    /congratulations to all selected/i,
    /positions:\s*/i,
    /sde intern:\s*\d+ offer/i,
  ];

  // If author looks like a bot
  const author = String(n.author || "").toLowerCase();
  if (author && /bot|placementbot|placement-bot|placement_bot/i.test(author)) return true;

  // If message is very short and matches announcement patterns, hide it
  const lengthThreshold = 300; // chars; messages shorter than this and matching pattern are suspicious
  const isShort = (text || "").trim().length > 0 && (text || "").trim().length < lengthThreshold;

  const matchesPattern = shortAnnouncementPatterns.some((re) => re.test(text));

  return isShort && matchesPattern;
};
