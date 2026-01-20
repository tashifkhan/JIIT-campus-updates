import { NextRequest, NextResponse } from "next/server";
import { getPolicy } from "@/lib/server/data";
import { generateToc } from "@/lib/policy";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params;

		if (!slug) {
			return NextResponse.json(
				{ ok: false, error: "Missing slug" },
				{ status: 400 },
			);
		}

		const policy = await getPolicy(slug);

		if (!policy) {
			return NextResponse.json(
				{ ok: false, error: "Policy not found" },
				{ status: 404 },
			);
		}

		// Use stored TOC if available, otherwise generate it
		let toc = policy.toc;
		if (!toc || toc.length === 0) {
			toc = generateToc(policy.content);
		}

		return NextResponse.json({
			ok: true,
			policy: {
				...policy,
				toc,
			},
		});
	} catch (error) {
		console.error("Error fetching policy:", error);
		return NextResponse.json(
			{ ok: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}
