"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Job } from "@/components/jobs/types";
import JobFilters from "@/components/jobs/JobFilters";
import JobCard from "@/components/jobs/JobCard";
import QuickViewDialog from "@/components/jobs/QuickViewDialog";
import { categoryMapping, formatDateTime } from "@/components/jobs/helpers";

// Job type moved to components/jobs/types

export default function JobsPage() {
	// Secret unlock gate: clicking the word "JIIT" 7 times will set localStorage key "shh"
	const [unlocked, setUnlocked] = useState(false);
	const [secretClicks, setSecretClicks] = useState(0);

	useEffect(() => {
		const checkAndUnlockFromQuery = () => {
			try {
				if (typeof window === "undefined") return false;
				const params = new URLSearchParams(window.location.search);
				if (params.has("shh")) {
					try {
						localStorage.setItem("shh", "1");
					} catch {
						/* ignore */
					}
					setUnlocked(true);
					// Clean the URL (remove ?shh) without reloading
					params.delete("shh");
					const newUrl = `${window.location.pathname}${
						params.toString() ? `?${params.toString()}` : ""
					}${window.location.hash || ""}`;
					window.history.replaceState({}, "", newUrl);
					return true;
				}
			} catch {
				// ignore
			}
			return false;
		};

		// If not unlocked via query, fall back to localStorage check
		const unlockedFromQuery = checkAndUnlockFromQuery();
		if (!unlockedFromQuery) {
			const hasLocal = (() => {
				try {
					return typeof window !== "undefined" && !!localStorage.getItem("shh");
				} catch {
					return false;
				}
			})();
			setUnlocked(hasLocal);
		}
	}, []);

	const handleSecretClick = () => {
		setSecretClicks((c) => {
			const next = c + 1;
			if (next >= 7) {
				try {
					localStorage.setItem("shh", "1");
				} catch {
					/* ignore */
				}
				// Force a reload to keep hooks order consistent on next mount
				if (typeof window !== "undefined") window.location.reload();
			}
			return next;
		});
	};

	if (!unlocked) {
		return (
			<>
				<main
					role="main"
					className="min-h-screen flex items-center justify-center font-sans"
				>
					<div className="p-8 md:p-10 rounded-[14px] border border-border shadow-lg bg-card text-card-foreground">
						<h1 className="m-0 mb-2 text-2xl md:text-3xl font-bold">
							Service unavailable Permanently
						</h1>
						<p className="m-0 mb-1 text-base text-muted-foreground">
							This site will not be accessible.
						</p>
						<p className="m-0 text-sm text-muted-foreground/80">
							As per the instructions of the{" "}
							<span
								onClick={handleSecretClick}
								className="cursor-pointer hover:text-primary transition-colors"
							>
								JIIT
							</span>{" "}
							Administration.
						</p>
					</div>
				</main>
			</>
		);
	}

	return <JobsPageContent />;
}

function JobsPageContent() {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [selectedJobModal, setSelectedJobModal] = useState<Job | null>(null);
	const [loading, setLoading] = useState(true);
	// Filters state
	const [query, setQuery] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
	const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
	const [minPackageLpa, setMinPackageLpa] = useState<number>(0);
	const [cgpaRange, setCgpaRange] = useState<[number, number]>([0, 10]);
	const [cgpaInputMin, setCgpaInputMin] = useState<string>("0.0");
	const [cgpaInputMax, setCgpaInputMax] = useState<string>("10.0");
	const [openOnly, setOpenOnly] = useState<boolean>(false);

	// Use react-query to fetch jobs
	const { data: jobsResp, isLoading: jobsLoading } = useQuery<Job[]>({
		queryKey: ["jobs"],
		queryFn: async () => {
			const res = await fetch("/api/jobs");
			const json = await res.json();
			return (json?.ok ? json.data : []) as Job[];
		},
	});

	useEffect(() => {
		if (jobsResp) {
			const sorted = [...jobsResp].sort(
				(a: Job, b: Job) => (b.createdAt || 0) - (a.createdAt || 0)
			);
			const seen = new Set<string>();
			const deduped: Job[] = [];
			for (const j of sorted) {
				if (!seen.has(j.id)) {
					seen.add(j.id);
					deduped.push(j);
				}
			}
			setJobs(deduped);
			setLoading(false);
		}
	}, [jobsResp]);

	useEffect(() => setLoading(jobsLoading), [jobsLoading]);

	// Helpers moved to components/jobs/helpers

	// Derived filter options
	// Options are computed inside JobFilters, so keep only derived for sliders and results
	const maxPackageLpa = useMemo(
		() =>
			Math.ceil(
				jobs.reduce((max, j) => Math.max(max, j.package || 0), 0) / 100000
			) || 0,
		[jobs]
	);
	const maxCgpa = useMemo(() => {
		const cgpaValues = jobs.flatMap(
			(j) =>
				j.eligibility_marks
					.filter((mark) => mark.level.toLowerCase() === "ug")
					.map((mark) => mark.criteria) // UG is already in CGPA out of 10
		);
		return Math.ceil(Math.max(...cgpaValues, 0) * 10) / 10 || 10; // Round to 1 decimal, default to 10
	}, [jobs]);
	// Reset min when max changes
	useEffect(() => {
		setMinPackageLpa(0);
		setCgpaRange([0, 10]);
		setCgpaInputMin("0.0");
		setCgpaInputMax("10.0");
	}, [maxPackageLpa, maxCgpa]);

	const now = Date.now();
	const filteredJobs = useMemo(() => {
		return jobs.filter((job) => {
			// When 'openOnly' is enabled, exclude jobs that have no deadline
			// and also exclude those whose deadline is in the past.
			if (openOnly && (job.deadline == null || job.deadline < now))
				return false;
			const q = query.trim().toLowerCase();
			if (q) {
				const hay =
					`${job.job_profile} ${job.company} ${job.location}`.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			if (
				selectedCategories.length &&
				!selectedCategories.includes(job.placement_category_code)
			)
				return false;
			if (selectedLocations.length && !selectedLocations.includes(job.location))
				return false;
			if (selectedGenders.length) {
				const genders = job.allowed_genders || [];
				if (!selectedGenders.every((g) => genders.includes(g))) return false;
			}
			if (selectedCourses.length) {
				const courses = job.eligibility_courses || [];
				if (!selectedCourses.some((c) => courses.includes(c))) return false;
			}
			const lpa = (job.package || 0) / 100000;
			if (lpa < minPackageLpa) return false;

			// CGPA filter
			if (cgpaRange[0] > 0 || cgpaRange[1] < 10) {
				const ugMarks = job.eligibility_marks.filter(
					(mark) => mark.level.toLowerCase() === "ug"
				);
				if (ugMarks.length > 0) {
					const jobMinCgpa = Math.min(...ugMarks.map((mark) => mark.criteria)); // UG is already in CGPA
					// Job is suitable if its minimum requirement falls within user's CGPA range
					if (jobMinCgpa < cgpaRange[0] || jobMinCgpa > cgpaRange[1])
						return false;
				}
			}

			return true;
		});
	}, [
		jobs,
		query,
		selectedCategories,
		selectedLocations,
		selectedGenders,
		selectedCourses,
		minPackageLpa,
		cgpaRange,
		openOnly,
		now,
	]);

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
	};

	if (loading) {
		return (
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{[...Array(6)].map((_, i) => (
					<Card
						key={i}
						className="animate-pulse card-theme border-border bg-card"
					>
						{/* skeleton block */}
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

	return (
		<div className="max-w-7xl mx-auto">
			<div className="text-center mb-8">
				<h1 className="text-2xl lg:text-3xl font-bold mb-2 text-foreground">
					Job Opportunities
				</h1>
				<p className="text-muted-foreground">
					Explore campus placement opportunities
				</p>
			</div>

			<JobFilters
				jobs={jobs}
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
					setQuery,
					setSelectedCategories: (u) =>
						setSelectedCategories((prev) => u(prev)),
					setSelectedLocations: (u) => setSelectedLocations((prev) => u(prev)),
					setSelectedGenders: (u) => setSelectedGenders((prev) => u(prev)),
					setSelectedCourses: (u) => setSelectedCourses((prev) => u(prev)),
					setMinPackageLpa,
					setCgpaRange,
					setCgpaInputMin,
					setCgpaInputMax,
					setOpenOnly,
					clearFilters,
				}}
				derived={{
					maxPackageLpa,
					maxCgpa,
					resultsCount: filteredJobs.length,
				}}
			/>

			<div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
				{filteredJobs.map((job) => (
					<JobCard
						key={job.id}
						job={job}
						onQuickView={(j) => setSelectedJobModal(j)}
					/>
				))}
			</div>
			<QuickViewDialog
				job={selectedJobModal}
				open={!!selectedJobModal}
				onOpenChange={(open) => !open && setSelectedJobModal(null)}
			/>
		</div>
	);
}
