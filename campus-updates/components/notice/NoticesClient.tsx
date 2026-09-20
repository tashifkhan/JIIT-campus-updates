"use client";

import { useEffect, useState } from "react";

import ResourceModal from "@/components/admin/ResourceModal";
import NoticeCard from "@/components/notice/NoticeCard";
import NoticesFilters from "@/components/notice/NoticesFilters";
import NoticesPagination from "@/components/notice/NoticesPagination";
import { usePlacementYear } from "@/components/PlacementYearProvider";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useNotices } from "@/lib/hooks/useNotices";
import { Notice } from "@/lib/notices";

type Props = {
	hideShortPlacements?: boolean;
};

function NoticesLoading() {
	return (
		<div className="space-y-4">
			{[0, 1, 2].map((item) => (
				<Card key={item} className="animate-pulse card-theme">
					<CardContent className="p-6">
						<div className="h-4 rounded w-3/4 mb-2 bg-muted/50" />
						<div className="h-3 rounded w-1/2 bg-muted/50" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function scrollFeedToTop() {
	const main = document.querySelector("main.lg\\:overflow-auto");
	if (main && window.innerWidth >= 1024) {
		main.scrollTo({ top: 0, behavior: "smooth" });
		return;
	}
	window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function NoticesClient({ hideShortPlacements = false }: Props) {
	const { year } = usePlacementYear();
	const [query, setQuery] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [editingItem, setEditingItem] = useState<{
		resourceType: "notices" | "placement-offers";
		data: any;
	} | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const noticesQuery = useNotices({
		year,
		query,
		categories: selectedCategories,
		page: currentPage,
		hideShortPlacements,
	});

	useEffect(() => {
		let active = true;
		fetch("/api/admin/check-auth")
			.then((response) => response.json())
			.then((data) => {
				if (active) setIsAdmin(Boolean(data.authenticated));
			})
			.catch(() => {});
		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		setCurrentPage(1);
		setExpandedNotice(null);
	}, [year]);

	useEffect(() => {
		const serverPage = noticesQuery.data?.pagination.page;
		if (serverPage && serverPage !== currentPage) setCurrentPage(serverPage);
	}, [currentPage, noticesQuery.data?.pagination.page]);

	if (noticesQuery.isLoading) return <NoticesLoading />;

	const data = noticesQuery.data;
	const notices = data?.data || [];
	const pagination = data?.pagination || {
		page: 1,
		pageSize: 20,
		total: 0,
		totalPages: 0,
	};

	const changeQuery = (value: string) => {
		setQuery(value);
		setCurrentPage(1);
	};
	const changeCategories = (categories: string[]) => {
		setSelectedCategories(categories);
		setCurrentPage(1);
	};
	const changePage = (page: number) => {
		setCurrentPage(page);
		setExpandedNotice(null);
		scrollFeedToTop();
	};

	// The public feed no longer carries raw edit payloads (they leaked scrape
	// internals). Admins fetch the raw record on demand from the admin API.
	const handleEdit = async (notice: Notice) => {
		const resourceType =
			notice.source === "placement-offer" ? "placement-offers" : "notices";
		try {
			const response = await fetch(
				`/api/admin/${resourceType}/${encodeURIComponent(notice.sourceId)}?year=${encodeURIComponent(year)}`,
				{ cache: "no-store" },
			);
			const payload = await response.json();
			if (!response.ok || !payload.ok) {
				throw new Error(payload.error || "Failed to load record");
			}
			setEditError(null);
			setEditingItem({ resourceType, data: payload.data });
		} catch (err: any) {
			setEditError(err?.message || "Failed to load record for editing");
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<Card className="mb-4 card-theme">
				<CardContent className="p-4 lg:p-6 space-y-3">
					<NoticesFilters
						query={query}
						onQueryChange={changeQuery}
						allCategories={data?.facets.categories || []}
						selectedCategories={selectedCategories}
						onCategoriesChange={changeCategories}
						resultsCount={pagination.total}
					/>
				</CardContent>
			</Card>

			{noticesQuery.error ? (
				<Card className="text-center py-12 card-theme border-destructive/30">
					<CardContent>
						<p className="text-destructive">Unable to load notices.</p>
						<button
							type="button"
							onClick={() => noticesQuery.refetch()}
							className="mt-2 text-sm text-primary underline underline-offset-4"
						>
							Try again
						</button>
					</CardContent>
				</Card>
			) : notices.length === 0 ? (
				<EmptyState
					title="No updates found"
					description="Nothing matches your current search or category filters. Try clearing them to see the full feed."
					actionLabel="Clear all filters"
					onAction={() => {
						changeQuery("");
						changeCategories([]);
					}}
				/>
			) : (
				<div
					className={`stagger-children space-y-6 transition-opacity ${
						noticesQuery.isFetching ? "opacity-70" : "opacity-100"
					}`}
				>
					{notices.map((notice) => (
						<NoticeCard
							key={`${notice.source}-${notice.sourceId}`}
							notice={notice}
							isAdmin={isAdmin}
							expanded={expandedNotice === notice.id}
							onToggleShortlist={() =>
								setExpandedNotice((current) =>
									current === notice.id ? null : notice.id,
								)
							}
							onEdit={handleEdit}
						/>
					))}
				</div>
			)}

			<NoticesPagination
				page={pagination.page}
				totalPages={pagination.totalPages}
				onPageChange={changePage}
			/>

			{editError ? (
				<Card className="text-center py-4 card-theme border-destructive/30">
					<CardContent>
						<p className="text-destructive text-sm">{editError}</p>
					</CardContent>
				</Card>
			) : null}

			<ResourceModal
				isOpen={editingItem != null}
				onClose={() => setEditingItem(null)}
				mode="update"
				resourceType={editingItem?.resourceType || "notices"}
				initialData={editingItem?.data}
				onSuccess={() => noticesQuery.refetch()}
				year={year}
			/>
		</div>
	);
}
