import "server-only";

/**
 * Shared sanitizer for PlacementOffer documents sent to clients.
 * Strips scrape internals and student contact details (PII) while keeping
 * the fields the stats pages and admin dashboard need.
 */

const SENSITIVE_OFFER_FIELDS = [
	"email_sender",
	"email_subject",
	"additional_info",
	// Stored for auditing the campus tag; not for clients.
	"on_campus_model",
	"on_campus_reasoning",
] as const;

const SENSITIVE_STUDENT_FIELDS = [
	"email",
	"phone",
	"mobile",
	"contact",
	"contact_number",
] as const;

export function sanitizePlacementOffer(offer: any) {
	const sanitized: any = { ...offer };
	for (const field of SENSITIVE_OFFER_FIELDS) {
		delete sanitized[field];
	}

	// Use time_sent as saved_at if available
	if (sanitized.time_sent) {
		sanitized.saved_at = sanitized.time_sent;
	}

	if (Array.isArray(sanitized.students_selected)) {
		sanitized.students_selected = sanitized.students_selected.map(
			(student: any) => {
				const clean = { ...student };
				for (const field of SENSITIVE_STUDENT_FIELDS) {
					delete clean[field];
				}
				return clean;
			},
		);
	}

	return sanitized;
}
