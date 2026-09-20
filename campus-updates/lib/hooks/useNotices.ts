"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { NoticeFeedResponse } from "@/lib/notices";

type UseNoticesOptions = {
	year: string;
	query: string;
	categories: string[];
	page: number;
	pageSize?: number;
	hideShortPlacements: boolean;
};

export function useNotices({
	year,
	query,
	categories,
	page,
	pageSize = 20,
	hideShortPlacements,
}: UseNoticesOptions) {
	const [debouncedQuery, setDebouncedQuery] = useState(query.trim());

	useEffect(() => {
		const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
		return () => window.clearTimeout(timeout);
	}, [query]);

	const categoryKey = [...categories].sort().join("|");
	return useQuery<NoticeFeedResponse>({
		queryKey: [
			"notice-feed",
			year,
			debouncedQuery,
			categoryKey,
			page,
			pageSize,
			hideShortPlacements,
		],
		queryFn: async () => {
			const params = new URLSearchParams({
				year,
				page: String(page),
				pageSize: String(pageSize),
			});
			if (debouncedQuery) params.set("q", debouncedQuery);
			if (hideShortPlacements) params.set("hideShortPlacements", "1");
			categories.forEach((category) => params.append("category", category));

			const response = await fetch(`/api/notices?${params.toString()}`, {
				cache: "no-store",
			});
			const payload = await response.json();
			if (!response.ok || !payload.ok) {
				throw new Error(payload.error || "Failed to fetch notices");
			}
			return payload as NoticeFeedResponse;
		},
		placeholderData: keepPreviousData,
	});
}
