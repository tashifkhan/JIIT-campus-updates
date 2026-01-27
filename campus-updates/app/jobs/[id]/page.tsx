"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useJobData } from "@/lib/hooks/useJobData";
import JobDetailClient from "@/components/jobs/JobDetailClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export default function JobPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const { jobs, loading } = useJobData();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || loading) {
		return (
			<div className="min-h-screen bg-background p-4 md:p-8">
				<div className="max-w-5xl mx-auto space-y-8">
					{/* Header Skeleton */}
					<div className="space-y-4">
						<div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
						<div className="h-8 w-2/3 bg-muted rounded-md animate-pulse" />
					</div>
					{/* Content Skeleton */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="md:col-span-2 space-y-6">
							<div className="h-64 bg-muted rounded-xl animate-pulse" />
							<div className="h-32 bg-muted rounded-xl animate-pulse" />
						</div>
						<div className="space-y-6">
							<div className="h-40 bg-muted rounded-xl animate-pulse" />
							<div className="h-40 bg-muted rounded-xl animate-pulse" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	const job = jobs.find((j) => j.id === id);

	if (!job) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-4">
				<Card className="p-8 max-w-md w-full text-center space-y-4 border-border shadow-lg">
					<h2 className="text-2xl font-bold">Job Not Found</h2>
					<p className="text-muted-foreground">
						The job you are looking for does not exist or has been removed.
					</p>
					<Button onClick={() => router.push("/jobs")}>
						<ArrowLeftIcon className="w-4 h-4 mr-2" />
						Back to Jobs
					</Button>
				</Card>
			</div>
		);
	}

	return <JobDetailClient job={job} />;
}
