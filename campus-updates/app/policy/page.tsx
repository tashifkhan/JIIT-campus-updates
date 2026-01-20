import PolicyClient from "@/components/policy/PolicyClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Placement Policy",
	description: "Jaypee Universities Placement Policy (2026 Graduating Batches)",
};

export default function PolicyPage() {
	return (
		<>
			<div className="max-w-7xl mx-auto">
				{/* 
				    We pass initialSlug assuming the main policy is always this one for this page.
				    In the future, if we have multiple policies, this could be dynamic [slug] page.
				*/}
				<PolicyClient initialSlug="placement-policy-2026" />
			</div>
		</>
	);
}
