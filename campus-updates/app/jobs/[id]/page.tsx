import JobDetailClient from "./JobDetailClient";
import React from "react";

type Job = {
	id: string;
	job_profile: string;
	company: string;
	[key: string]: any;
};

async function fetchJob(id: string) {
	// Build an absolute URL for server-side fetch. When NEXT_PUBLIC_BASE_URL is not set
	// (for example during local dev or on some hosting), fall back to Vercel URL or localhost.
	const base =
		process.env.NEXT_PUBLIC_BASE_URL ||
		(process.env.NEXT_PUBLIC_VERCEL_URL
			? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
			: "http://localhost:3000");

	const url = new URL(`/api/jobs/${id}`, base).toString();

	const res = await fetch(url, {
		cache: "no-store",
	});
	if (!res.ok) return null;
	const json = await res.json();
	return json.data as Job;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
	const job = await fetchJob(params.id);
	const title = job
		? `${job.company} ${job.job_profile}`
		: "JIIT Placement Updates";

	return {
		title,
		openGraph: {
			title,
			description: "Campus placement and updates portal",
		},
		twitter: {
			title,
			description: "Campus placement and updates portal",
		},
	};
}

export default async function JobPage({ params }: { params: { id: string } }) {
	const job = await fetchJob(params.id);

	if (!job) {
		return (
			<div className="p-4">
				<h2 className="text-xl font-bold">Job not found</h2>
			</div>
		);
	}

	return <JobDetailClient job={job as any} />;
}
