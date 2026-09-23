"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { usePlacementYear } from "@/components/PlacementYearProvider";
import {
	BranchStatsData,
	CampusStatsData,
	CompanyStatsData,
	StatsApiResponse,
	StatsSummary,
	StatsTimelinePoint,
} from "@/lib/stats-api";

async function fetchStats<T>(path: string, signal: AbortSignal): Promise<T> {
	const response = await fetch(path, { cache: "no-store", signal });
	const payload = await response.json();
	if (!response.ok || !payload.ok) {
		throw new Error(payload.error || "Failed to load placement statistics");
	}
	return (payload as StatsApiResponse<T>).data;
}

function statsPath(endpoint: string, year: string, query: string): string {
	const params = new URLSearchParams({ year });
	if (query) params.set("q", query);
	return `/api/stats/${endpoint}?${params.toString()}`;
}

export function useDebouncedStatsSearch(query: string): string {
	const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
	useEffect(() => {
		const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
		return () => window.clearTimeout(timeout);
	}, [query]);
	return debouncedQuery;
}

export function useStatsSummary(query: string, enabled: boolean) {
	const { year } = usePlacementYear();
	return useQuery<StatsSummary>({
		queryKey: ["stats-summary", year, query],
		queryFn: ({ signal }) => fetchStats(statsPath("summary", year, query), signal),
		enabled,
		placeholderData: keepPreviousData,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
}

export function useBranchStats(query: string, enabled: boolean) {
	const { year } = usePlacementYear();
	return useQuery<BranchStatsData>({
		queryKey: ["stats-branches", year, query],
		queryFn: ({ signal }) => fetchStats(statsPath("branches", year, query), signal),
		enabled,
		placeholderData: keepPreviousData,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
}

export function useCompanyStats(query: string, enabled: boolean) {
	const { year } = usePlacementYear();
	return useQuery<CompanyStatsData>({
		queryKey: ["stats-companies", year, query],
		queryFn: ({ signal }) => fetchStats(statsPath("companies", year, query), signal),
		enabled,
		placeholderData: keepPreviousData,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
}

export function useTimelineStats(
	query: string,
	timeFrame: "month" | "day",
	cumulative: boolean,
	enabled: boolean,
) {
	const { year } = usePlacementYear();
	return useQuery<StatsTimelinePoint[]>({
		queryKey: ["stats-timeline", year, query, timeFrame, cumulative],
		queryFn: ({ signal }) => {
			const params = new URLSearchParams({
				year,
				timeFrame,
				cumulative: cumulative ? "1" : "0",
			});
			if (query) params.set("q", query);
			return fetchStats(`/api/stats/timeline?${params.toString()}`, signal);
		},
		enabled,
		placeholderData: keepPreviousData,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
}

export function useCampusStats(query: string, enabled: boolean) {
	const { year } = usePlacementYear();
	return useQuery<CampusStatsData>({
		queryKey: ["stats-campus", year, query],
		queryFn: ({ signal }) => fetchStats(statsPath("campus", year, query), signal),
		enabled,
		placeholderData: keepPreviousData,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
}
