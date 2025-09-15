import { Job } from "./types";

export const categoryMapping: Record<number, string> = {
  1: "High",
  2: "Middle",
  3: "> 4.6L",
  4: "Internship",
};

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

export const formatPackage = (job: Job) => {
  const amount = job.package;
  const annumMonths = job.annum_months;
  const isMonthly =
    annumMonths &&
    (annumMonths.toUpperCase().startsWith("M") ||
      annumMonths.toLowerCase().startsWith("m"));

  if (amount >= 100000) {
    const suffix = isMonthly ? "LPM" : "LPA";
    return `₹${(amount / 100000).toFixed(1)} ${suffix}`;
  }
  return `₹${amount.toLocaleString()}`;
};

export const getCategoryColor = (code: number) => {
  const baseStyle = {
    borderColor: "var(--border-color)",
    backgroundColor: "var(--primary-color)",
  } as React.CSSProperties;

  switch (code) {
    case 1:
      return { ...baseStyle, color: "#dc2626" };
    case 2:
      return { ...baseStyle, color: "#d97706" };
    case 3:
      return { ...baseStyle, color: "#059669" };
    case 4:
      return { ...baseStyle, color: "#2563eb" };
    default:
      return { ...baseStyle, color: "var(--text-color)" };
  }
};

export const handleShareUrl = async (title: string, text: string, url: string) => {
  try {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      await (navigator as any).share({ title, text, url });
      return true;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // ignore and fallback below
  }
  if (typeof window !== "undefined") window.open(url, "_blank");
  return false;
};
