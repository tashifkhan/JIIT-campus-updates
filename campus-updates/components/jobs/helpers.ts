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

export const getCategoryClass = (code: number) => {
	const base = "border";
	switch (code) {
		case 1: // High
			return `${base} text-destructive border-destructive bg-background`;
		case 2: // Middle
			// Using Chart 2 (Blue/Cyan in global css)
			return `${base} text-[var(--chart-2)] border-[var(--chart-2)] bg-background`;
		case 3: // > 4.6L
			// Using Chart 3 (Green/Chartreuse in global css)
			return `${base} bg-background`;
		case 4: // Internship
			return `${base} text-primary border-primary bg-background`;
		default:
			return `${base} text-muted-foreground border-border bg-background`;
	}
};

export const getCategoryColor = (code: number) => {
	// Deprecated: keeping for temporary backward compatibility if needed,
	// but ideally we switch all consumers to getCategoryClass
	// Returning empty object or minimal valid style to prevent crash during migration
	return {};
};

export const handleShareUrl = async (
	title: string,
	text: string,
	url: string,
) => {
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
