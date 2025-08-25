import Layout from "@/components/Layout";
import NoticesClient from "@/components/NoticesClient";
import { getNotices } from "@/lib/server/data";

export default async function HomePage() {
	// Server-rendered: load from MongoDB on the server only and pass to client component
		const noticesData = await getNotices();
		// Convert DB documents to plain objects safe to pass to client components.
		const normalized = (noticesData as any[])
			.map((n) => {
				// _id may be ObjectId / BSON - convert to string
				const id = n._id && typeof n._id === "object" && typeof n._id.toString === "function" ? n._id.toString() : n._id;
				const createdAt = n.createdAt
					? typeof n.createdAt === "number"
						? n.createdAt
						: new Date(n.createdAt).getTime()
					: null;
				const updatedAt = n.updatedAt
					? typeof n.updatedAt === "number"
						? n.updatedAt
						: new Date(n.updatedAt).getTime()
					: null;

						// Build matched_job object if any job info is available
						const matchedJobId = n.matched_job_id ?? n.matched_job?.id ?? null;
						const matched_job = matchedJobId
							? {
									id: typeof matchedJobId === "object" && typeof matchedJobId.toString === "function" ? matchedJobId.toString() : String(matchedJobId),
									company: n.job_company ?? n.matched_job?.company ?? null,
									job_profile: n.job_role ?? n.matched_job?.job_profile ?? null,
								}
							: null;

						return {
					// copy scalar fields explicitly to avoid passing BSON objects
					_id: id,
					id: n.id ?? null,
					title: n.title ?? null,
					content: n.content ?? null,
					author: n.author ?? null,
					createdAt,
					updatedAt,
							category: n.category ?? null,
							matched_job,
					matched_job_id: n.matched_job_id ?? null,
					job_company: n.job_company ?? null,
					job_role: n.job_role ?? null,
					package: n.package ?? null,
					package_breakdown: n.package_breakdown ?? null,
					formatted_message: n.formatted_message ?? null,
					location: n.location ?? null,
					sent_to_telegram: n.sent_to_telegram ?? null,
					updated_at: n.updated_at ?? null,
				};
			})
			.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
			.map((n) => ({
				...n,
				category:
					(n.category || "")
						.toLowerCase()
						.trim()
						.replace(/^\[?shortlist(ing)?\]?$/, "shortlisting"),
			}));

	return (
		<Layout>
			{/* initialNotices is server-populated; client does not fetch directly */}
			<NoticesClient initialNotices={normalized} />
		</Layout>
	);
}
