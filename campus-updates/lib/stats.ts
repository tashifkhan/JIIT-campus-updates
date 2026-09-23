// Shared types and utility helpers for the stats page/components

export interface Role {
  role: string;
  package: number | null;
  package_details: string | null;
}

export interface Student {
  name: string;
  enrollment_number: string;
  enrollment?: string;
  role: string;
  package: number | null;
  offer_received_at?: string | null;
  offerReceivedAt?: number | null;
}

export interface Placement {
  company: string;
  roles: Role[];
  job_location: string[] | null;
  joining_date: string | null;
  students_selected: Student[];
  number_of_offers: number;
  saved_at?: string;
  created_at?: string;
  time_sent?: string;
  createdAt?: string | number;
  _id?: string;
  /** Offer came through a campus drive, per the backend LLM judge. */
  likely_on_campus?: boolean;
  on_campus_confidence?: number | null;
  /** False when the judge never ran (no candidate drive was found). */
  campus_tagged?: boolean;
  /** The judge's one-line explanation, when the backend stored one. */
  on_campus_reason?: string | null;
  /** The judge flagged the offer as a pre-placement offer. */
  on_campus_ppo?: boolean;
  email_subject?: string | null;
  matched_job_id?: string | null;
}

export type StudentWithPlacement = Student & {
  company: string;
  roles: Role[];
  joining_date?: string;
  job_location?: string[] | null;
  placement: Placement;
};

export const formatPackage = (packageValue: number | null | undefined) => {
  if (packageValue == null) return "TBD";
  return `₹${packageValue.toFixed(1)} LPA`;
};

export const formatPercent = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(1)}%`;
};

type DateValue = string | number | Date | null | undefined;

const parseDate = (value: DateValue): Date | null => {
  if (value == null || value === "") return null;

  let normalizedValue: string | number | Date = value;
  if (typeof value === "number" && value < 10_000_000_000) {
    normalizedValue = value * 1000;
  } else if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const numericValue = Number(value);
    normalizedValue = value.trim().length > 10 ? numericValue : numericValue * 1000;
  }

  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getStudentOfferDate = (
  student: Student,
  placement?: Placement,
): Date | null => {
  const studentDate =
    parseDate(student.offer_received_at) ?? parseDate(student.offerReceivedAt);
  if (studentDate || !placement) return studentDate;

  return (
    parseDate(placement.created_at) ??
    parseDate(placement.time_sent) ??
    parseDate(placement.saved_at) ??
    parseDate(placement.createdAt)
  );
};

export const formatDate = (value?: DateValue) => {
  const date = parseDate(value);
  if (!date) return "TBD";

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Determine student package with multiple fallbacks (student -> exact role -> best viable role)
export const getStudentPackage = (
  student: Student,
  placement: Placement
): number | null => {
  if (student.package != null) return student.package;

  const exact = placement.roles.find((r) => r.role === student.role);
  if (exact && exact.package != null) return exact.package;

  const viable = placement.roles.filter((r) => r.package != null);
  if (viable.length === 1) return viable[0].package as number;
  if (viable.length > 1)
    return Math.max(...viable.map((r) => r.package as number));

  return null;
};

/**
 * How an offer reached the student.
 * - "on": the backend judge matched it to a campus drive.
 * - "ppo": a pre-placement or internship conversion offer. The mail says so in
 *   the subject, so it is split out even when the judge tagged it on campus,
 *   because nobody sat a drive for it this season.
 * - "off": everything else.
 */
export type CampusRoute = "on" | "ppo" | "off";

// "Internship to PPO" in a hiring mail is a drive, not a conversion, so a bare
// "PPO" is not enough on its own.
const PPO_SUBJECT = /pre[\s-]?placement|internship offer|offers? for [^|]*internship/i;

export const isPpoOffer = (
  placement: Pick<Placement, "email_subject" | "on_campus_ppo">,
): boolean =>
  placement.on_campus_ppo === true || PPO_SUBJECT.test(placement.email_subject || "");

export const getCampusRoute = (placement: Placement): CampusRoute => {
  if (isPpoOffer(placement)) return "ppo";
  return placement.likely_on_campus ? "on" : "off";
};
