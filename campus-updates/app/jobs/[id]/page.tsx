"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { useQueryState } from "nuqs";

import JobDetailClient from "@/components/jobs/JobDetailClient";
import { usePlacementYear } from "@/components/PlacementYearProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useJobById } from "@/lib/hooks/useJobData";
import { jobDetailQueryParams } from "@/lib/query-params";

function JobDetailLoading() {
	return (
		<div className="min-h-screen bg-background p-4 md:p-8">
			<div className="max-w-5xl mx-auto space-y-8">
				<div className="space-y-4">
					<div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
					<div className="h-8 w-2/3 bg-muted rounded-md animate-pulse" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="md:col-span-2 h-64 bg-muted rounded-xl animate-pulse" />
					<div className="h-40 bg-muted rounded-xl animate-pulse" />
				</div>
			</div>
		</div>
	);
}

export default function JobPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const [requestedYear] = useQueryState("year", jobDetailQueryParams.year);
	const router = useRouter();
	const placementYear = usePlacementYear();
	const year = requestedYear || placementYear.year;
	const jobQuery = useJobById(id, year);

	if (jobQuery.isLoading) return <JobDetailLoading />;

	if (!jobQuery.data) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-4">
				<Card className="p-8 max-w-md w-full text-center space-y-4 border-border shadow-lg">
					<h2 className="text-2xl font-bold">Job Not Found</h2>
					<p className="text-muted-foreground">
						The job could not be loaded or has been removed.
					</p>
					<Button onClick={() => router.push("/jobs")}>
						<ArrowLeftIcon className="w-4 h-4 mr-2" />
						Back to Jobs
					</Button>
				</Card>
			</div>
		);
	}

	return <JobDetailClient job={jobQuery.data} />;
}
