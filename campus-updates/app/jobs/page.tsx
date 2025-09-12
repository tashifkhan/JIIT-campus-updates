"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	BuildingIcon,
	CalendarIcon,
	IndianRupeeIcon,
	MapPinIcon,
	UsersIcon,
	BookOpenIcon,
	ClockIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	DownloadIcon,
	Share2Icon,
	XIcon,
	FileTextIcon,
	ExternalLinkIcon,
	ArrowRightIcon,
} from "lucide-react";

interface Job {
	id: string;
	job_profile: string;
	company: string;
	placement_category_code: number;
	placement_category: string;
	createdAt: number;
	deadline: number | null;
	eligibility_marks: Array<{
		level: string;
		criteria: number;
	}>;
	eligibility_courses: string[];
	allowed_genders: string[];
	job_description: string;
	location: string;
	package: number;
	package_info: string;
	required_skills: string[];
	hiring_flow: string[];
	placement_type: string | null;
	documents?: Array<{
		name: string;
		identifier: string;
		url: string;
	}>;
}

export default function JobsPage() {
	// Secret unlock gate: clicking the word "JIIT" 7 times will set localStorage key "shh"
	const [unlocked, setUnlocked] = useState(false);
	const [secretClicks, setSecretClicks] = useState(0);

	useEffect(() => {
		const unlockState = () => {
			try {
				return typeof window !== "undefined" && !!localStorage.getItem("shh");
			} catch {
				return false;
			}
		};
		setUnlocked(unlockState());
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
				<style>{`
		  :root { color-scheme: light dark; }
		  html, body { height: 100%; margin: 0; }
		  body {
			display: grid;
			place-items: center;
			font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
			line-height: 1.5;
		  }
		  .card {
			max-width: 680px;
			padding: 2rem 2.5rem;
			border-radius: 14px;
			border: 1px solid rgba(0,0,0,0.1);
			box-shadow: 0 2px 24px rgba(0,0,0,0.06);
		  }
		  h1 { margin: 0 0 0.5rem; font-size: 1.75rem; }
		  p { margin: 0.25rem 0; opacity: 0.8; }
		  .muted { font-size: 0.9rem; opacity: 0.65; }
		  .linklike { background: transparent; border: none; padding: 0; margin: 0; color: inherit; font: inherit; cursor: pointer; text-decoration: none; }
		`}</style>

				<main className="card" role="main">
					<h1>Service unavailable Permanently</h1>
					<p>This site will not be accessible.</p>
					<p className="muted">
						As per the instructions of the{" "}
						<button
							type="button"
							className="linklike"
							onClick={handleSecretClick}
						>
							JIIT
						</button>{" "}
						Administration.
					</p>
				</main>
			</>
		);
	}

	return <JobsPageContent />;
}

function JobsPageContent() {
	const router = useRouter();
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

	const category_mapping: Record<number, string> = {
		1: "High",
		2: "Middle",
		3: "> 4.6L",
		4: "Internship",
	};
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

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const formatDateTime = (timestamp: number) => {
		const date = new Date(timestamp);
		const dateStr = date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
		const timeStr = date.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
		return `${dateStr} at ${timeStr}`;
	};

	const formatPackage = (amount: number) => {
		if (amount >= 100000) {
			return `₹${(amount / 100000).toFixed(1)} LPA`;
		}
		return `₹${amount.toLocaleString()}`;
	};

	// Share helper used by header buttons (desktop + mobile)
	const handleShare = async (job: Job) => {
		try {
			const url = `${window.location.origin}/jobs/${job.id}`;
			const shareData = {
				title: `${job.job_profile} at ${job.company}`,
				text: `${job.job_profile} at ${job.company} — ${formatPackage(
					job.package
				)}`,
				url,
			};

			if ((navigator as any).share) {
				await (navigator as any).share(shareData);
				return;
			}
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(url);
				window.alert("Job link copied to clipboard");
				return;
			}
			window.open(url, "_blank");
		} catch (err) {
			try {
				await navigator.clipboard.writeText(
					`${window.location.origin}/jobs/${job.id}`
				);
				window.alert("Job link copied to clipboard");
			} catch {
				window.open(`${window.location.origin}/jobs/${job.id}`, "_blank");
			}
		}
	};

	const getCategoryColor = (code: number) => {
		const baseStyle = {
			borderColor: "var(--border-color)",
			backgroundColor: "var(--primary-color)",
		};

		switch (code) {
			case 1:
				return { ...baseStyle, color: "#dc2626" }; // red-600
			case 2:
				return { ...baseStyle, color: "#d97706" }; // amber-600
			case 3:
				return { ...baseStyle, color: "#059669" }; // emerald-600
			case 4:
				return { ...baseStyle, color: "#2563eb" }; // blue-600
			default:
				return { ...baseStyle, color: "var(--text-color)" };
		}
	};

	// Derived filter options
	const unique = <T,>(arr: T[]) => Array.from(new Set(arr));
	const allLocations = useMemo(
		() => unique(jobs.map((j) => j.location).filter(Boolean)).sort(),
		[jobs]
	);
	const allCategories = useMemo(
		() =>
			unique(jobs.map((j) => j.placement_category_code)).sort((a, b) => a - b),
		[jobs]
	);
	const allGenders = useMemo(
		() => unique(jobs.flatMap((j) => j.allowed_genders || [])).sort(),
		[jobs]
	);
	const allCourses = useMemo(
		() => unique(jobs.flatMap((j) => j.eligibility_courses || [])).sort(),
		[jobs]
	);
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
			<Layout>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<Card key={i} className="animate-pulse card-theme">
							<CardHeader>
								<div
									className="h-6 rounded w-3/4 mb-2"
									style={{ backgroundColor: "var(--primary-color)" }}
								></div>
								<div
									className="h-4 rounded w-1/2"
									style={{ backgroundColor: "var(--primary-color)" }}
								></div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div
										className="h-3 rounded"
										style={{ backgroundColor: "var(--primary-color)" }}
									></div>
									<div
										className="h-3 rounded w-5/6"
										style={{ backgroundColor: "var(--primary-color)" }}
									></div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-8">
					<h1
						className="text-2xl lg:text-3xl font-bold mb-2"
						style={{ color: "var(--text-color)" }}
					>
						Job Opportunities
					</h1>
					<p style={{ color: "var(--label-color)" }}>
						Explore campus placement opportunities
					</p>
				</div>

				{/* Filters */}
				<Card className="mb-6">
					<CardContent className="p-4 lg:p-6 space-y-4">
						<div className="flex flex-col md:flex-row gap-3 md:items-center">
							<div className="flex-1">
								<Input
									placeholder="Search by role, company or location"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
							</div>
							<div className="flex gap-2 flex-wrap">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="whitespace-nowrap">
											Category
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-56">
										<DropdownMenuLabel>Select categories</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{allCategories.map((code) => (
											<DropdownMenuCheckboxItem
												key={code}
												checked={selectedCategories.includes(code)}
												onCheckedChange={(checked) => {
													setSelectedCategories((prev) =>
														checked
															? [...prev, code]
															: prev.filter((c) => c !== code)
													);
												}}
											>
												<span
													className="inline-flex items-center px-2 py-0.5 border rounded"
													style={getCategoryColor(code)}
												>
													{category_mapping[code] || code}
												</span>
											</DropdownMenuCheckboxItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="whitespace-nowrap">
											Location
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-64 max-h-72 overflow-auto">
										<DropdownMenuLabel>Select locations</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{allLocations.map((loc) => (
											<DropdownMenuCheckboxItem
												key={loc}
												checked={selectedLocations.includes(loc)}
												onCheckedChange={(checked) => {
													setSelectedLocations((prev) =>
														checked
															? [...prev, loc]
															: prev.filter((l) => l !== loc)
													);
												}}
											>
												{loc}
											</DropdownMenuCheckboxItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="whitespace-nowrap">
											Gender
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-56">
										<DropdownMenuLabel>Select genders</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{allGenders.map((g) => (
											<DropdownMenuCheckboxItem
												key={g}
												checked={selectedGenders.includes(g)}
												onCheckedChange={(checked) => {
													setSelectedGenders((prev) =>
														checked ? [...prev, g] : prev.filter((x) => x !== g)
													);
												}}
											>
												{g}
											</DropdownMenuCheckboxItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" className="whitespace-nowrap">
											Branches
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-72 max-h-80 overflow-auto">
										<DropdownMenuLabel>
											Select eligible branches
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{allCourses.map((course) => (
											<DropdownMenuCheckboxItem
												key={course}
												checked={selectedCourses.includes(course)}
												onCheckedChange={(checked) => {
													setSelectedCourses((prev) =>
														checked
															? [...prev, course]
															: prev.filter((c) => c !== course)
													);
												}}
											>
												{course}
											</DropdownMenuCheckboxItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:items-end">
							<div className="space-y-2">
								<div
									className="text-sm flex items-center justify-between"
									style={{ color: "var(--label-color)" }}
								>
									<span>Minimum package (LPA)</span>
									<span
										className="font-medium"
										style={{ color: "var(--text-color)" }}
									>
										{minPackageLpa}+
									</span>
								</div>
								<Slider
									min={0}
									max={Math.max(maxPackageLpa, 1)}
									step={1}
									value={[minPackageLpa]}
									onValueChange={(v) => setMinPackageLpa(v[0] ?? 0)}
								/>
							</div>

							<div className="space-y-2">
								<div
									className="text-sm flex items-center justify-between"
									style={{ color: "var(--label-color)" }}
								>
									<span>CGPA Range</span>
									<span
										className="font-medium"
										style={{ color: "var(--text-color)" }}
									>
										{cgpaRange[0].toFixed(1)} - {cgpaRange[1].toFixed(1)}
									</span>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<Input
										type="number"
										min="0"
										max="10"
										step="0.1"
										value={cgpaInputMin}
										onChange={(e) => {
											setCgpaInputMin(e.target.value);
										}}
										onBlur={(e) => {
											const minVal = Math.max(
												0,
												Math.min(10, parseFloat(e.target.value) || 0)
											);
											setCgpaRange([minVal, Math.max(minVal, cgpaRange[1])]);
											setCgpaInputMin(minVal.toFixed(1));
										}}
										placeholder="Min"
										className="text-sm h-9"
									/>
									<Input
										type="number"
										min="0"
										max="10"
										step="0.1"
										value={cgpaInputMax}
										onChange={(e) => {
											setCgpaInputMax(e.target.value);
										}}
										onBlur={(e) => {
											const maxVal = Math.max(
												0,
												Math.min(10, parseFloat(e.target.value) || 10)
											);
											setCgpaRange([Math.min(cgpaRange[0], maxVal), maxVal]);
											setCgpaInputMax(maxVal.toFixed(1));
										}}
										placeholder="Max"
										className="text-sm h-9"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<div
									className="text-sm"
									style={{ color: "var(--label-color)" }}
								>
									Quick CGPA Filters
								</div>
								<div className="flex gap-1 flex-wrap">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setCgpaRange([6.0, 8.0]);
											setCgpaInputMin("6.0");
											setCgpaInputMax("8.0");
										}}
										className={`text-xs h-7 px-2 ${
											cgpaRange[0] === 6.0 && cgpaRange[1] === 8.0
												? "border-theme"
												: "hover-theme"
										}`}
										style={{
											backgroundColor:
												cgpaRange[0] === 6.0 && cgpaRange[1] === 8.0
													? "var(--primary-color)"
													: "transparent",
											color:
												cgpaRange[0] === 6.0 && cgpaRange[1] === 8.0
													? "var(--accent-color)"
													: "var(--text-color)",
											borderColor:
												cgpaRange[0] === 6.0 && cgpaRange[1] === 8.0
													? "var(--accent-color)"
													: "var(--border-color)",
										}}
									>
										6.0-8.0
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setCgpaRange([7.0, 9.0]);
											setCgpaInputMin("7.0");
											setCgpaInputMax("9.0");
										}}
										className={`text-xs h-7 px-2 ${
											cgpaRange[0] === 7.0 && cgpaRange[1] === 9.0
												? "border-theme"
												: "hover-theme"
										}`}
										style={{
											backgroundColor:
												cgpaRange[0] === 7.0 && cgpaRange[1] === 9.0
													? "var(--primary-color)"
													: "transparent",
											color:
												cgpaRange[0] === 7.0 && cgpaRange[1] === 9.0
													? "var(--accent-color)"
													: "var(--text-color)",
											borderColor:
												cgpaRange[0] === 7.0 && cgpaRange[1] === 9.0
													? "var(--accent-color)"
													: "var(--border-color)",
										}}
									>
										7.0-9.0
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setCgpaRange([0, 10]);
											setCgpaInputMin("0.0");
											setCgpaInputMax("10.0");
										}}
										className={`text-xs h-7 px-2 ${
											cgpaRange[0] === 0 && cgpaRange[1] === 10
												? "border-theme"
												: "hover-theme"
										}`}
										style={{
											backgroundColor:
												cgpaRange[0] === 0 && cgpaRange[1] === 10
													? "var(--primary-color)"
													: "transparent",
											color:
												cgpaRange[0] === 0 && cgpaRange[1] === 10
													? "var(--accent-color)"
													: "var(--text-color)",
											borderColor:
												cgpaRange[0] === 0 && cgpaRange[1] === 10
													? "var(--accent-color)"
													: "var(--border-color)",
										}}
									>
										All
									</Button>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Checkbox
									id="openOnly"
									checked={openOnly}
									onCheckedChange={(v) => setOpenOnly(!!v)}
								/>
								<label
									htmlFor="openOnly"
									className="text-sm cursor-pointer"
									style={{ color: "var(--text-color)" }}
								>
									Show only open postings (deadline in future)
								</label>
							</div>

							<div className="flex gap-2 md:justify-end">
								<Button variant="ghost" onClick={clearFilters}>
									Reset
								</Button>
								<Badge variant="secondary" className="self-center">
									{filteredJobs.length} results
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{filteredJobs.map((job) => (
						<Card
							key={job.id}
							className="hover:shadow-xl transition-all duration-300 border card-theme cursor-pointer"
							style={{
								backgroundColor: "var(--card-bg)",
								borderColor: "var(--border-color)",
								color: "var(--text-color)",
							}}
							role="button"
							tabIndex={0}
							onClick={() => {
								// Open quick view modal on card click instead of navigating
								setSelectedJobModal(job);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setSelectedJobModal(job);
								}
							}}
						>
							<CardHeader className="pb-4">
								<div className="flex items-start justify-between mb-3">
									<div className="flex-1">
										<CardTitle
											className="text-lg font-bold mb-2 leading-tight"
											style={{ color: "var(--text-color)" }}
										>
											{job.job_profile}
										</CardTitle>
										<div
											className="flex items-center mb-3"
											style={{ color: "var(--label-color)" }}
										>
											<BuildingIcon
												className="w-4 h-4 mr-2"
												style={{ color: "var(--accent-color)" }}
											/>
											<span
												className="font-semibold"
												style={{ color: "var(--accent-color)" }}
											>
												{job.company}
											</span>
										</div>
									</div>
									<div className="text-right">
										<Badge
											variant="outline"
											className="font-medium border"
											style={getCategoryColor(job.placement_category_code)}
										>
											{category_mapping[job.placement_category_code] ||
												job.placement_category}
										</Badge>
										<div
											className="text-xs mt-1"
											style={{ color: "var(--label-color)" }}
										>
											{formatDateTime(job.createdAt)}
										</div>
									</div>
								</div>

								{job.eligibility_courses?.length ? (
									<div
										className="border rounded-lg p-3"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--border-color)",
										}}
									>
										<div
											className="text-xs font-medium mb-2"
											style={{ color: "var(--accent-color)" }}
										>
											Eligible Branches
										</div>
										<div className="flex flex-wrap gap-1">
											{job.eligibility_courses
												.slice(0, 3)
												.map((course, idx) => (
													<Badge
														key={idx}
														variant="secondary"
														className="text-[10px] border"
														style={{
															backgroundColor: "var(--card-bg)",
															borderColor: "var(--border-color)",
															color: "var(--accent-color)",
														}}
													>
														{course}
													</Badge>
												))}
											{job.eligibility_courses.length > 3 && (
												<Badge
													variant="outline"
													className="text-[10px]"
													style={{
														borderColor: "var(--border-color)",
														color: "var(--text-color)",
													}}
												>
													+{job.eligibility_courses.length - 3} more
												</Badge>
											)}
										</div>
									</div>
								) : null}
							</CardHeader>

							<CardContent className="space-y-3 md:space-y-4 pt-0">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div
										className="border rounded-lg p-3"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--border-color)",
										}}
									>
										<div className="flex items-center">
											<IndianRupeeIcon
												className="w-4 h-4 mr-2"
												style={{ color: "var(--accent-color)" }}
											/>
											<span
												className="text-sm font-medium"
												style={{ color: "var(--accent-color)" }}
											>
												Package
											</span>
										</div>
										<span
											className="text-lg font-bold block"
											style={{ color: "var(--text-color)" }}
										>
											{formatPackage(job.package)}
										</span>
									</div>
									<div
										className="border rounded-lg p-3"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--border-color)",
										}}
									>
										<div className="flex items-center">
											<MapPinIcon
												className="w-4 h-4 mr-2"
												style={{ color: "var(--accent-color)" }}
											/>
											<span
												className="text-sm font-medium"
												style={{ color: "var(--accent-color)" }}
											>
												Location
											</span>
										</div>
										<span
											className="text-sm font-semibold block mt-1"
											style={{ color: "var(--text-color)" }}
										>
											{job.location}
										</span>
									</div>
								</div>

								{/* CGPA and Deadline Row */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{(() => {
										const ugMark = job.eligibility_marks.find(
											(mark) => mark.level.toLowerCase() === "ug"
										);
										return ugMark ? (
											<div
												className="border rounded-lg p-3"
												style={{
													backgroundColor: "var(--primary-color)",
													borderColor: "var(--border-color)",
												}}
											>
												<div className="flex items-center">
													<UsersIcon
														className="w-4 h-4 mr-2"
														style={{ color: "var(--accent-color)" }}
													/>
													<span
														className="text-sm font-medium"
														style={{ color: "var(--accent-color)" }}
													>
														Min CGPA
													</span>
												</div>
												<span
													className="text-lg font-bold block"
													style={{ color: "var(--text-color)" }}
												>
													{ugMark.criteria.toFixed(1)}/10
												</span>
											</div>
										) : (
											<div
												className="border rounded-lg p-3"
												style={{
													backgroundColor: "var(--primary-color)",
													borderColor: "var(--border-color)",
												}}
											>
												<div className="flex items-center">
													<UsersIcon
														className="w-4 h-4 mr-2"
														style={{ color: "var(--label-color)" }}
													/>
													<span
														className="text-sm font-medium"
														style={{ color: "var(--label-color)" }}
													>
														CGPA
													</span>
												</div>
												<span
													className="text-sm block"
													style={{ color: "var(--label-color)" }}
												>
													Not specified
												</span>
											</div>
										);
									})()}
									<div
										className="border rounded-lg p-3"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--border-color)",
										}}
									>
										<div className="flex items-center">
											<ClockIcon
												className="w-4 h-4 mr-2"
												style={{ color: "var(--accent-color)" }}
											/>
											<span
												className="text-sm font-medium"
												style={{ color: "var(--accent-color)" }}
											>
												Deadline
											</span>
										</div>
										<span
											className="text-sm font-semibold block mt-1"
											style={{ color: "var(--text-color)" }}
										>
											{job.deadline ? formatDate(job.deadline) : "No deadline"}
										</span>
									</div>
								</div>

								<div className="flex gap-2 mt-2">
									<Button
										variant="outline"
										size="sm"
										className="flex-1 font-medium border hover-theme"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--accent-color)",
											color: "var(--accent-color)",
										}}
										onClick={(e) => {
											e.stopPropagation();
											setSelectedJobModal(job);
										}}
									>
										Quick View
										<ChevronDownIcon className="w-4 h-4 ml-1" />
									</Button>
									<Button
										variant="default"
										size="sm"
										className="flex-1 font-medium"
										style={{
											backgroundColor: "var(--accent-color)",
											color: "var(--bg-color)",
										}}
										onClick={(e) => {
											e.stopPropagation();
											router.push(`/jobs/${job.id}`);
										}}
									>
										Full Details
										<ArrowRightIcon className="w-4 h-4 ml-1" />
									</Button>
								</div>

								<Dialog
									open={selectedJobModal?.id === job.id}
									onOpenChange={(open) => {
										if (!open) setSelectedJobModal(null);
									}}
								>
									<DialogContent
										className="max-w-none md:max-w-4xl max-h-[80vh] md:max-h-[80vh] h-screen md:h-auto w-screen md:w-auto overflow-y-auto card-theme p-4 md:p-6"
										style={{
											backgroundColor: "var(--card-bg)",
											borderColor: "var(--border-color)",
										}}
									>
										<DialogHeader className="mobile-dialog-header">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<DialogTitle
														className="text-lg md:text-xl font-bold flex items-center gap-2"
														style={{ color: "var(--text-color)" }}
													>
														<BuildingIcon
															className="w-4 h-4 md:w-5 md:h-5"
															style={{ color: "var(--accent-color)" }}
														/>
														<span className="line-clamp-2">
															{job.job_profile} at {job.company}
														</span>
													</DialogTitle>
													<DialogDescription
														className="text-sm mt-1"
														style={{ color: "var(--label-color)" }}
													>
														{job.placement_category} • Posted on{" "}
														{formatDate(job.createdAt)}
													</DialogDescription>
												</div>
												<div className="flex items-center gap-2 ml-2">
													<Button
														variant="outline"
														size="sm"
														className="hidden md:flex items-center gap-1 hover-theme"
														style={{
															borderColor: "var(--accent-color)",
															color: "var(--accent-color)",
															backgroundColor: "transparent",
														}}
														onClick={(e) => {
															e.stopPropagation();
															router.push(`/jobs/${job.id}`);
														}}
													>
														<ArrowRightIcon className="w-4 h-4" />
														Full Page
													</Button>
													<Button
														variant="outline"
														size="sm"
														className="hidden md:flex items-center gap-1 hover-theme"
														style={{
															borderColor: "var(--accent-color)",
															color: "var(--accent-color)",
															backgroundColor: "transparent",
														}}
														onClick={async (e) => {
															e.stopPropagation();
															const url = `${window.location.origin}/jobs/${job.id}`;
															const shareData = {
																title: `${job.job_profile} at ${job.company}`,
																text: `${job.job_profile} at ${
																	job.company
																} — ${formatPackage(job.package)}`,
																url,
															};

															try {
																if ((navigator as any).share) {
																	await (navigator as any).share(shareData);
																} else if (
																	navigator.clipboard &&
																	navigator.clipboard.writeText
																) {
																	await navigator.clipboard.writeText(url);
																	// lightweight feedback
																	window.alert("Job link copied to clipboard");
																} else {
																	// final fallback: open the link in a new tab
																	window.open(url, "_blank");
																}
															} catch (err) {
																// ignore user-cancel or other errors, fallback to copying
																try {
																	await navigator.clipboard.writeText(url);
																	window.alert("Job link copied to clipboard");
																} catch {
																	window.open(url, "_blank");
																}
															}
														}}
													>
														<Share2Icon className="w-4 h-4" />
														Share
													</Button>
													{/* Mobile actions: show icon buttons in header on small screens */}
													<div className="flex items-center gap-2 md:hidden">
														<Button
															variant="ghost"
															size="sm"
															className="p-2"
															style={{ color: "var(--text-color)" }}
															onClick={(e) => {
																e.stopPropagation();
																handleShare(job);
															}}
														>
															<Share2Icon className="w-5 h-5" />
														</Button>

														<Button
															variant="ghost"
															size="sm"
															className="p-2"
															style={{ color: "var(--text-color)" }}
															onClick={(e) => {
																e.stopPropagation();
																setSelectedJobModal(null);
																router.push(`/jobs/${job.id}`);
															}}
														>
															<ArrowRightIcon className="w-5 h-5" />
														</Button>

														<Button
															variant="ghost"
															size="sm"
															className="p-2"
															style={{ color: "var(--text-color)" }}
															onClick={(e) => {
																e.stopPropagation();
																setSelectedJobModal(null);
															}}
														>
															<XIcon className="w-5 h-5" />
														</Button>
													</div>
												</div>
											</div>
										</DialogHeader>

										<div className="space-y-4 md:space-y-6 mt-4 mobile-dialog-content">
											{/* Key Info Cards */}
											<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
												<div
													className="border rounded-lg p-3 md:p-4"
													style={{
														backgroundColor: "var(--primary-color)",
														borderColor: "var(--border-color)",
													}}
												>
													<div className="flex items-center justify-between">
														<span
															className="text-sm font-medium"
															style={{ color: "var(--accent-color)" }}
														>
															Package
														</span>
														<IndianRupeeIcon
															className="w-4 h-4"
															style={{ color: "var(--accent-color)" }}
														/>
													</div>
													<p
														className="text-lg font-bold"
														style={{ color: "var(--text-color)" }}
													>
														{formatPackage(job.package)}
													</p>
												</div>
												<div
													className="border rounded-lg p-4"
													style={{
														backgroundColor: "var(--primary-color)",
														borderColor: "var(--border-color)",
													}}
												>
													<div className="flex items-center justify-between">
														<span
															className="text-sm font-medium"
															style={{ color: "var(--accent-color)" }}
														>
															Location
														</span>
														<MapPinIcon
															className="w-4 h-4"
															style={{ color: "var(--accent-color)" }}
														/>
													</div>
													<p
														className="text-lg font-semibold"
														style={{ color: "var(--text-color)" }}
													>
														{job.location}
													</p>
												</div>
												<div
													className="border rounded-lg p-4"
													style={{
														backgroundColor: "var(--primary-color)",
														borderColor: "var(--border-color)",
													}}
												>
													<div className="flex items-center justify-between">
														<span
															className="text-sm font-medium"
															style={{ color: "var(--accent-color)" }}
														>
															Deadline
														</span>
														<ClockIcon
															className="w-4 h-4"
															style={{ color: "var(--accent-color)" }}
														/>
													</div>
													<p
														className="text-lg font-semibold"
														style={{ color: "var(--text-color)" }}
													>
														{job.deadline
															? formatDate(job.deadline)
															: "No deadline"}
													</p>
												</div>
											</div>

											{/* Job Description */}
											<div
												className="border rounded-lg p-4"
												style={{
													backgroundColor: "var(--primary-color)",
													borderColor: "var(--border-color)",
												}}
											>
												<h4
													className="font-semibold mb-3 flex items-center"
													style={{ color: "var(--text-color)" }}
												>
													<BookOpenIcon
														className="w-5 h-5 mr-2"
														style={{ color: "var(--accent-color)" }}
													/>
													Job Description
												</h4>
												<div
													className="text-sm prose prose-sm max-w-none job-description-content"
													style={{
														color: "var(--text-color)",
														wordBreak: "break-word",
													}}
													dangerouslySetInnerHTML={{
														__html: job.job_description,
													}}
												/>
											</div>

											{/* Eligibility */}
											<div className="grid grid-cols-1 gap-3 md:gap-4">
												<div
													className="border rounded-lg p-3 md:p-4"
													style={{
														backgroundColor: "var(--primary-color)",
														borderColor: "var(--border-color)",
													}}
												>
													<h4
														className="font-semibold mb-3"
														style={{ color: "var(--text-color)" }}
													>
														Eligibility Marks
													</h4>
													<div className="space-y-2">
														{job.eligibility_marks.map((mark, idx) => (
															<div
																key={idx}
																className="flex justify-between text-sm"
															>
																<span style={{ color: "var(--label-color)" }}>
																	{mark.level}:
																</span>
																<span
																	className="font-semibold"
																	style={{ color: "var(--text-color)" }}
																>
																	{mark.level.toLowerCase() === "ug"
																		? `${mark.criteria.toFixed(1)}/10 CGPA`
																		: `${mark.criteria}%`}
																</span>
															</div>
														))}
													</div>
												</div>

												<div
													className="border rounded-lg p-4"
													style={{
														backgroundColor: "var(--primary-color)",
														borderColor: "var(--border-color)",
													}}
												>
													<h4
														className="font-semibold mb-3"
														style={{ color: "var(--text-color)" }}
													>
														Eligible Courses
													</h4>
													<div className="flex flex-wrap gap-1">
														{job.eligibility_courses.map((course, idx) => (
															<Badge
																key={idx}
																variant="secondary"
																className="text-xs border"
																style={{
																	backgroundColor: "var(--card-bg)",
																	borderColor: "var(--border-color)",
																	color: "var(--text-color)",
																}}
															>
																{course}
															</Badge>
														))}
													</div>
												</div>
											</div>

											{/* Skills and Hiring Process */}
											{job.required_skills.length > 0 && (
												<div
													className="border rounded-lg p-4"
													style={{
														backgroundColor: "var(--primary-color)",
														borderColor: "var(--border-color)",
													}}
												>
													<h4
														className="font-semibold mb-3"
														style={{ color: "var(--text-color)" }}
													>
														Required Skills
													</h4>
													<div className="flex flex-wrap gap-2">
														{job.required_skills.map((skill, idx) => (
															<Badge
																key={idx}
																variant="outline"
																className="text-sm"
																style={{
																	borderColor: "var(--border-color)",
																	color: "var(--text-color)",
																}}
															>
																{skill}
															</Badge>
														))}
													</div>
												</div>
											)}

											<div
												className="border rounded-lg p-4"
												style={{
													backgroundColor: "var(--primary-color)",
													borderColor: "var(--border-color)",
												}}
											>
												<h4
													className="font-semibold mb-3"
													style={{ color: "var(--text-color)" }}
												>
													Hiring Process
												</h4>
												<div className="space-y-3">
													{job.hiring_flow.map((step, idx) => (
														<div key={idx} className="flex items-start">
															<div
																className="w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center mr-3 flex-shrink-0"
																style={{
																	backgroundColor: "var(--accent-color)",
																	color: "var(--bg-color)",
																}}
															>
																{idx + 1}
															</div>
															<span
																className="leading-relaxed"
																style={{ color: "var(--text-color)" }}
															>
																{step}
															</span>
														</div>
													))}
												</div>
											</div>

											{job.package_info && (
												<div
													className="border rounded-lg p-4 job-description-content"
													style={{
														backgroundColor: "var(--primary-color)",
														borderColor: "var(--border-color)",
													}}
												>
													<h4
														className="font-semibold mb-2"
														style={{ color: "var(--text-color)" }}
													>
														Package Details
													</h4>
													<p
														className="text-sm"
														style={{
															color: "var(--text-color)",
															wordBreak: "break-word",
														}}
														dangerouslySetInnerHTML={{
															__html: job.package_info,
														}}
													></p>
												</div>
											)}

											{/* Documents Section */}
											{job.documents && job.documents.length > 0 && (
												<div
													className="border rounded-lg p-4"
													style={{
														backgroundColor: "var(--primary-color)",
														borderColor: "var(--border-color)",
													}}
												>
													<h4
														className="font-semibold mb-3 flex items-center"
														style={{ color: "var(--text-color)" }}
													>
														<FileTextIcon
															className="w-5 h-5 mr-2"
															style={{ color: "var(--accent-color)" }}
														/>
														Documents & Attachments
													</h4>
													<div className="space-y-3">
														{job.documents.map((doc, idx) => (
															<div
																key={idx}
																className="border rounded-lg p-3 hover:shadow-md transition-shadow duration-200"
																style={{
																	backgroundColor: "var(--card-bg)",
																	borderColor: "var(--border-color)",
																}}
															>
																<div className="flex items-center justify-between">
																	<div className="flex items-center flex-1 min-w-0">
																		<FileTextIcon
																			className="w-4 h-4 mr-3 flex-shrink-0"
																			style={{ color: "var(--accent-color)" }}
																		/>
																		<div className="flex-1 min-w-0">
																			<p
																				className="text-sm font-medium truncate"
																				style={{ color: "var(--text-color)" }}
																				title={doc.name}
																			>
																				{doc.name}
																			</p>
																			<p
																				className="text-xs mt-1"
																				style={{ color: "var(--label-color)" }}
																			>
																				Document ID:{" "}
																				{doc.identifier.slice(0, 8)}...
																			</p>
																		</div>
																	</div>
																	<div className="flex gap-2 ml-3">
																		<Button
																			variant="outline"
																			size="sm"
																			className="flex items-center gap-1 hover-theme"
																			style={{
																				borderColor: "var(--accent-color)",
																				color: "var(--accent-color)",
																				backgroundColor: "transparent",
																			}}
																			onClick={(e) => {
																				e.stopPropagation();
																				window.open(doc.url, "_blank");
																			}}
																		>
																			<ExternalLinkIcon className="w-3 h-3" />
																			<span className="hidden sm:inline">
																				View
																			</span>
																		</Button>
																		<Button
																			variant="outline"
																			size="sm"
																			className="flex items-center gap-1 hover-theme"
																			style={{
																				borderColor: "var(--accent-color)",
																				color: "var(--accent-color)",
																				backgroundColor: "transparent",
																			}}
																			onClick={(e) => {
																				e.stopPropagation();
																				// Create a temporary anchor element to trigger download
																				const link =
																					document.createElement("a");
																				link.href = doc.url;
																				link.download = doc.name;
																				link.target = "_blank";
																				document.body.appendChild(link);
																				link.click();
																				document.body.removeChild(link);
																			}}
																		>
																			<DownloadIcon className="w-3 h-3" />
																			<span className="hidden sm:inline">
																				Download
																			</span>
																		</Button>
																	</div>
																</div>
															</div>
														))}
													</div>
												</div>
											)}

											{/* Mobile Full Page Button */}
											<div
												className="md:hidden pt-4 border-t"
												style={{ borderColor: "var(--border-color)" }}
											>
												<Button
													variant="default"
													className="w-full font-medium"
													style={{
														backgroundColor: "var(--accent-color)",
														color: "var(--bg-color)",
													}}
													onClick={(e) => {
														e.stopPropagation();
														setSelectedJobModal(null);
														router.push(`/jobs/${job.id}`);
													}}
												>
													<ArrowRightIcon className="w-4 h-4 mr-2" />
													Open Full Page
												</Button>
											</div>
										</div>
									</DialogContent>
								</Dialog>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</Layout>
	);
}
