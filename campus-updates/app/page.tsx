import Layout from "@/components/Layout";
import NoticesClient from "@/components/NoticesClient";
import { getNotices } from "@/lib/server/data";

export default async function HomePage() {
	// Server-rendered: load from MongoDB on the server only and pass to client component
	const noticesData = await getNotices();
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
			{/* initialNotices is server-populated; client does not fetch directly */}
			<NoticesClient initialNotices={sorted} />
		</Layout>
	);
}
