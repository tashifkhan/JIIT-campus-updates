import { useQuery } from "@tanstack/react-query";
import { Job } from "@/components/jobs/types"; // Verify this path exists or import types locally if needed

export function useJobData() {
	const {
		data: jobs = [],
		isLoading: loading,
		error,
	} = useQuery({
		queryKey: ["jobs"],
		queryFn: async () => {
			const res = await fetch("/api/jobs");
			const json = await res.json();
			if (!json.ok) throw new Error(json.error || "Failed to load jobs");

			// Deduplicate and sort logic to ensure consistency across the app
			const rawJobs = (json.data || []) as Job[];
			const sorted = [...rawJobs].sort(
				(a: Job, b: Job) => (b.createdAt || 0) - (a.createdAt || 0),
			);
			// Simple dedupe by ID
			const seen = new Set<string>();
			const deduped: Job[] = [];
			for (const j of sorted) {
				if (!seen.has(j.id)) {
					seen.add(j.id);
					deduped.push(j);
				}
			}
			return deduped;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		refetchOnWindowFocus: false,
	});

	const getJobById = (id: string) => {
		return jobs.find((job) => job.id === id);
	};

	return {
		jobs,
		loading,
		error,
		getJobById,
	};
}
