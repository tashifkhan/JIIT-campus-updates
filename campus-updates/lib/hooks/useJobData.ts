"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { usePlacementYear } from "@/components/PlacementYearProvider";
import { JobDocument, JobFeedResponse } from "@/lib/jobs";

export type JobQueryOptions = {
	query: string;
	selectedCategories: number[];
	selectedLocations: string[];
	selectedGenders: string[];
	selectedCourses: string[];
	minPackageLpa: number;
	cgpaRange: [number, number];
	openOnly: boolean;
	page: number;
	pageSize?: number;
};

export function useJobData(options: JobQueryOptions) {
	const { year } = usePlacementYear();
	const [debouncedQuery, setDebouncedQuery] = useState(options.query.trim());

	useEffect(() => {
		const timeout = window.setTimeout(
			() => setDebouncedQuery(options.query.trim()),
			300,
		);
		return () => window.clearTimeout(timeout);
	}, [options.query]);

	const categories = [...options.selectedCategories].sort((a, b) => a - b);
	const locations = [...options.selectedLocations].sort();
	const genders = [...options.selectedGenders].sort();
	const courses = [...options.selectedCourses].sort();
	const pageSize = options.pageSize || 24;

	return useQuery<JobFeedResponse>({
		queryKey: [
			"job-feed",
			year,
			debouncedQuery,
			categories,
			locations,
			genders,
			courses,
			options.minPackageLpa,
			options.cgpaRange,
			options.openOnly,
			options.page,
			pageSize,
		],
		queryFn: async ({ signal }) => {
			const params = new URLSearchParams({
				year,
				page: String(options.page),
				pageSize: String(pageSize),
				minPackageLpa: String(options.minPackageLpa),
				cgpaMin: String(options.cgpaRange[0]),
				cgpaMax: String(options.cgpaRange[1]),
			});
			if (debouncedQuery) params.set("q", debouncedQuery);
			if (options.openOnly) params.set("openOnly", "1");
			categories.forEach((value) => params.append("category", String(value)));
			locations.forEach((value) => params.append("location", value));
			genders.forEach((value) => params.append("gender", value));
			courses.forEach((value) => params.append("course", value));

			const response = await fetch(`/api/jobs?${params.toString()}`, {
				cache: "no-store",
				signal,
			});
			const payload = await response.json();
			if (!response.ok || !payload.ok) {
				throw new Error(payload.error || "Failed to load jobs");
			}
			return payload as JobFeedResponse;
		},
		placeholderData: keepPreviousData,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
}

export function useJobById(id: string, year: string) {
	return useQuery<JobDocument>({
		queryKey: ["job", year, id],
		queryFn: async ({ signal }) => {
			const response = await fetch(
				`/api/jobs/${encodeURIComponent(id)}?year=${encodeURIComponent(year)}`,
				{ cache: "no-store", signal },
			);
			const payload = await response.json();
			if (!response.ok || !payload.ok) {
				throw new Error(payload.error || "Failed to load job");
			}
			return payload.data as JobDocument;
		},
		enabled: Boolean(id && year),
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
}
