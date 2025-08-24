import Layout from "@/components/Layout";
import NoticesClient from "@/components/NoticesClient";
import noticesData from "@/public/data/notices.json";

export default function HomePage() {
	// Server-rendered: load JSON at build/server time and pass to client component
	const sorted = (noticesData as any[])
		.slice()
		.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
		.map((n) => ({
			...n,
			category: (n.category || "")
				.toLowerCase()
				.trim()
				.replace(/^\[?shortlist(ing)?\]?$/, "shortlisting"),
		}));

	return (
		<Layout>
			<NoticesClient initialNotices={sorted} />
		</Layout>
	);
}
