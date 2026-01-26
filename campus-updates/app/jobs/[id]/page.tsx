import JobDetailClient from "../../../components/jobs/JobDetailClient";
import React from "react";

type Job = {
	id: string;
	job_profile: string;
	company: string;
	[key: string]: any;
};

import { getJobs } from "@/lib/server/data";

async function fetchJob(id: string) {
	try {
		const jobs = await getJobs({ id }, 1);
		if (!jobs || jobs.length === 0) return null;
		return jobs[0] as unknown as Job;
	} catch (error) {
		console.error("Error fetching job:", error);
		return null;
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const job = await fetchJob(id);
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

export default async function JobPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const job = await fetchJob(id);

	if (!job) {
		return (
			<div className="p-4">
				<h2 className="text-xl font-bold">Job not found</h2>
			</div>
		);
	}

	return <JobDetailClient job={job as any} />;
}
