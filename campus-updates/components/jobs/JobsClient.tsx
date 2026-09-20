"use client";

import { useEffect, useState } from "react";

import JobCard from "@/components/jobs/JobCard";
import JobFilters from "@/components/jobs/JobFilters";
import JobsPagination from "@/components/jobs/JobsPagination";
import { usePlacementYear } from "@/components/PlacementYearProvider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useJobData } from "@/lib/hooks/useJobData";
import { JobFacets } from "@/lib/jobs";

const EMPTY_FACETS: JobFacets = {
	categories: [],
	locations: [],
	genders: [],
	courses: [],
	maxPackageLpa: 0,
	maxCgpa: 10,
};

function JobsLoading() {
	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{[0, 1, 2, 3, 4, 5].map((item) => (
				<Card
					key={item}
					className="animate-pulse card-theme border-border bg-card"
				>
					<div className="p-5 space-y-3">
						<div className="h-6 rounded w-3/4 bg-muted" />
						<div className="h-4 rounded w-1/2 bg-muted" />
						<div className="h-3 rounded w-full bg-muted" />
					</div>
				</Card>
			))}
		</div>
	);
}

function scrollJobsToTop() {
	const main = document.querySelector("main.lg\\:overflow-auto");
	if (main && window.innerWidth >= 1024) {
		main.scrollTo({ top: 0, behavior: "smooth" });
		return;
	}
	window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function JobsClient() {
	const { year } = usePlacementYear();
	const [query, setQuery] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
	const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
	const [minPackageLpa, setMinPackageLpa] = useState(0);
	const [cgpaRange, setCgpaRange] = useState<[number, number]>([0, 10]);
	const [cgpaInputMin, setCgpaInputMin] = useState("0.0");
	const [cgpaInputMax, setCgpaInputMax] = useState("10.0");
	const [openOnly, setOpenOnly] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const jobsQuery = useJobData({
		query,
		selectedCategories,
		selectedLocations,
		selectedGenders,
		selectedCourses,
		minPackageLpa,
		cgpaRange,
		openOnly,
		page: currentPage,
	});

	useEffect(() => {
		setCurrentPage(1);
	}, [year]);

	useEffect(() => {
		const serverPage = jobsQuery.data?.pagination.page;
		if (serverPage && serverPage !== currentPage) setCurrentPage(serverPage);
	}, [currentPage, jobsQuery.data?.pagination.page]);

	if (jobsQuery.isLoading) return <JobsLoading />;

	const data = jobsQuery.data;
	const jobs = data?.data || [];
	const pagination = data?.pagination || {
		page: 1,
		pageSize: 24,
		total: 0,
		totalPages: 0,
	};
	const resetPage = () => setCurrentPage(1);
	const clearFilters = () => {
		setQuery("");
		setSelectedCategories([]);
		setSelectedLocations([]);
		setSelectedGenders([]);
		setSelectedCourses([]);
		setMinPackageLpa(0);
		setCgpaRange([0, 10]);
		setCgpaInputMin("0.0");
		setCgpaInputMax("10.0");
		setOpenOnly(false);
		resetPage();
	};
	const changePage = (page: number) => {
		setCurrentPage(page);
		scrollJobsToTop();
	};

	return (
		<div className="max-w-7xl mx-auto">
			<JobFilters
				facets={data?.facets || EMPTY_FACETS}
				values={{
					query,
					selectedCategories,
					selectedLocations,
					selectedGenders,
					selectedCourses,
					minPackageLpa,
					cgpaRange,
					cgpaInputMin,
					cgpaInputMax,
					openOnly,
				}}
				onChange={{
					setQuery: (value) => {
						setQuery(value);
						resetPage();
					},
					setSelectedCategories: (update) => {
						setSelectedCategories(update);
						resetPage();
					},
					setSelectedLocations: (update) => {
						setSelectedLocations(update);
						resetPage();
					},
					setSelectedGenders: (update) => {
						setSelectedGenders(update);
						resetPage();
					},
					setSelectedCourses: (update) => {
						setSelectedCourses(update);
						resetPage();
					},
					setMinPackageLpa: (value) => {
						setMinPackageLpa(value);
						resetPage();
					},
					setCgpaRange: (value) => {
						setCgpaRange(value);
						resetPage();
					},
					setCgpaInputMin,
					setCgpaInputMax,
					setOpenOnly: (value) => {
						setOpenOnly(value);
						resetPage();
					},
					clearFilters,
				}}
				derived={{ resultsCount: pagination.total }}
			/>

			{jobsQuery.error ? (
				<Card className="p-8 text-center border-destructive/30">
					<p className="text-destructive">Unable to load job postings.</p>
					<button
						type="button"
						onClick={() => jobsQuery.refetch()}
						className="mt-2 text-sm text-primary underline underline-offset-4"
					>
						Try again
					</button>
				</Card>
			) : jobs.length === 0 ? (
				<EmptyState
					title="No jobs match your filters"
					description="Try widening the CGPA or package range, or clear some filters to see more postings."
					actionLabel="Clear all filters"
					onAction={clearFilters}
				/>
			) : (
				<div
					className={`stagger-children grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 transition-opacity ${
						jobsQuery.isFetching ? "opacity-70" : "opacity-100"
					}`}
				>
					{jobs.map((job) => (
						<JobCard key={job.id} job={job} year={year} />
					))}
				</div>
			)}

			<JobsPagination
				page={pagination.page}
				totalPages={pagination.totalPages}
				onPageChange={changePage}
			/>
		</div>
	);
}
