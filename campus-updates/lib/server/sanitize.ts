import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * Server-side HTML sanitization for untrusted rich text stored in MongoDB
 * (job descriptions, package info, ...). The source data is scraped from
 * emails, so it must be treated as attacker-controlled: rendered with
 * dangerouslySetInnerHTML on the job detail page.
 *
 * The allowlist covers typical job-description formatting while stripping
 * scripts, event handlers, iframes, forms, styles, and javascript: URLs.
 */
const OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: [
		"a",
		"b",
		"strong",
		"i",
		"em",
		"u",
		"s",
		"p",
		"br",
		"hr",
		"ul",
		"ol",
		"li",
		"span",
		"div",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"blockquote",
		"code",
		"pre",
		"table",
		"thead",
		"tbody",
		"tfoot",
		"tr",
		"th",
		"td",
		"caption",
		"colgroup",
		"col",
	],
	allowedAttributes: {
		a: ["href", "title", "target", "rel"],
		th: ["colspan", "rowspan"],
		td: ["colspan", "rowspan"],
		col: ["span"],
		colgroup: ["span"],
	},
	allowedSchemes: ["https", "http", "mailto"],
	// No class/style/id attributes: kills CSS-based exfiltration and keeps the
	// page's own prose styling authoritative.
	allowedStyles: {},
	transformTags: {
		a: sanitizeHtml.simpleTransform("a", {
			rel: "noopener noreferrer",
		}),
	},
};

export function sanitizeRichText(html: string): string {
	if (!html) return "";
	return sanitizeHtml(html, OPTIONS);
}
