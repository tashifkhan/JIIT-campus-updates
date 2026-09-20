import GithubSlugger from "github-slugger";

export interface Policy {
	_id?: string;
	slug: string;
	title: string;
	description: string;
	badge: string;
	updatedDates: string[];
	published: boolean;
	contentFormat: "markdown";
	content: string;
	flowchart?: string;
	toc?: TocItem[];
	createdAt: string;
	updatedAt: string;
}

export interface TocItem {
	id: string;
	text: string;
	level: number;
}

export interface PolicyResponse {
	ok: boolean;
	policy: Policy | null;
	error?: string;
}

/**
 * Generates a Table of Contents from Markdown content.
 * It mimics the behavior of rehype-slug by using github-slugger
 * to ensure IDs match exactly what's rendered on the client.
 */
export function generateToc(markdown: string): TocItem[] {
	const slugger = new GithubSlugger();
	const lines = markdown.split("\n");
	const toc: TocItem[] = [];

	// Regex to match headings: # Heading, ## Heading, etc.
	// We only care about h2 (##) and h3 (###) for the TOC as per requirements.
	const headingRegex = /^(#{2,3})\s+(.+)$/;

	for (const line of lines) {
		const match = line.match(headingRegex);
		if (match) {
			const level = match[1].length; // 2 for ##, 3 for ###
			const text = match[2].trim();
			// Remove any inline markdown links or formatting if simple text is preferred,
			// but for now we keep it simple or strip common markdown syntax if needed.
			// A simple strip of bold/italic might be good:
			const cleanText = text
				.replace(/(\*\*|__)(.*?)\1/g, "$2")
				.replace(/(\*|_)(.*?)\1/g, "$2");

			const id = slugger.slug(cleanText);

			toc.push({
				id,
				text: cleanText,
				level,
			});
		}
	}

	return toc;
}
