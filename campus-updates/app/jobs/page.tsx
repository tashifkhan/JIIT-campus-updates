"use client";

import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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
}

export default function JobsPage() {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [expandedJob, setExpandedJob] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	// Filters state
	const [query, setQuery] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
	const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
	const [minPackageLpa, setMinPackageLpa] = useState<number>(0);
	const [openOnly, setOpenOnly] = useState<boolean>(false);

	useEffect(() => {
		fetch("/data/jobs.json")
			.then((res) => res.json())
			.then((data) => {
				// Sort by createdAt descending
				const sorted = [...data].sort(
					(a: Job, b: Job) => (b.createdAt || 0) - (a.createdAt || 0)
				);
				// De-duplicate by id (keep the latest by createdAt)
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
			});
	}, []);

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

	const getCategoryColor = (code: number) => {
		switch (code) {
			case 1:
				return "bg-red-100 text-red-800 border-red-200";
			case 2:
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case 3:
				return "bg-green-100 text-green-800 border-green-200";
			case 4:
				return "bg-blue-100 text-blue-800 border-blue-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
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
	// Reset min when max changes
	useEffect(() => {
		setMinPackageLpa(0);
	}, [maxPackageLpa]);

	const now = Date.now();
	const filteredJobs = useMemo(() => {
		return jobs.filter((job) => {
			if (openOnly && job.deadline && job.deadline < now) return false;
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
		setOpenOnly(false);
	};

	if (loading) {
		return (
			<Layout>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardHeader>
								<div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
								<div className="h-4 bg-gray-200 rounded w-1/2"></div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="h-3 bg-gray-200 rounded"></div>
									<div className="h-3 bg-gray-200 rounded w-5/6"></div>
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
					<h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
						Job Opportunities
					</h1>
					<p className="text-gray-600">
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
													className={`mr-2 inline-flex items-center px-2 py-0.5 border rounded ${getCategoryColor(
														code
													)}`}
												>
													{code}
												</span>
												Category {code}
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

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-center">
							<div className="space-y-2">
								<div className="text-sm text-gray-600 flex items-center justify-between">
									<span>Minimum package (LPA)</span>
									<span className="font-medium text-gray-900">
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

							<div className="flex items-center gap-2">
								<Checkbox
									id="openOnly"
									checked={openOnly}
									onCheckedChange={(v) => setOpenOnly(!!v)}
								/>
								<label
									htmlFor="openOnly"
									className="text-sm text-gray-700 cursor-pointer"
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

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredJobs.map((job) => (
						<Card key={job.id} className="hover:shadow-lg transition-shadow">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-lg font-semibold text-gray-900 mb-1">
											{job.job_profile}
										</CardTitle>
										<div className="flex items-center text-gray-600 mb-2">
											<BuildingIcon className="w-4 h-4 mr-1" />
											<span className="font-medium">{job.company}</span>
										</div>
									</div>
									<div className="text-right">
										<div className="text-xs text-gray-500 mb-1">
											{formatDateTime(job.createdAt)}
										</div>
									</div>
								</div>

								<Badge
									variant="outline"
									className={getCategoryColor(job.placement_category_code)}
								>
									{job.placement_category}
								</Badge>
								{job.eligibility_courses?.length ? (
									<div className="mt-3">
										<div className="text-xs text-gray-600 mb-1">
											Eligible Branches
										</div>
										<div className="flex flex-wrap gap-1">
											{job.eligibility_courses
												.slice(0, 4)
												.map((course, idx) => (
													<Badge
														key={idx}
														variant="secondary"
														className="text-[10px]"
													>
														{course}
													</Badge>
												))}
											{job.eligibility_courses.length > 4 && (
												<Badge variant="outline" className="text-[10px]">
													+{job.eligibility_courses.length - 4} more
												</Badge>
											)}
										</div>
									</div>
								) : null}
							</CardHeader>

							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div className="flex items-center">
										<IndianRupeeIcon className="w-4 h-4 mr-1 text-green-600" />
										<span className="font-semibold text-green-700">
											{formatPackage(job.package)}
										</span>
									</div>
									<div className="flex items-center text-gray-600">
										<MapPinIcon className="w-4 h-4 mr-1" />
										<span>{job.location}</span>
									</div>
								</div>

								<div className="flex items-center text-sm text-red-600">
									<ClockIcon className="w-4 h-4 mr-1" />
									<span>
										{job.deadline ? (
											<>Deadline: {formatDate(job.deadline)}</>
										) : (
											<>No deadline</>
										)}
									</span>
								</div>

								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setExpandedJob(expandedJob === job.id ? null : job.id)
									}
									className="w-full"
								>
									{expandedJob === job.id ? (
										<>
											Less Details <ChevronUpIcon className="w-4 h-4 ml-1" />
										</>
									) : (
										<>
											More Details <ChevronDownIcon className="w-4 h-4 ml-1" />
										</>
									)}
								</Button>

								{expandedJob === job.id && (
									<div className="space-y-4 pt-4 border-t">
										<div>
											<h4 className="font-semibold text-gray-900 mb-2 flex items-center">
												<BookOpenIcon className="w-4 h-4 mr-1" />
												Job Description
											</h4>
											<div
												className="text-sm text-gray-700 prose prose-sm max-w-none"
												dangerouslySetInnerHTML={{
													__html: job.job_description,
												}}
											/>
										</div>

										<Separator />

										<div>
											<h4 className="font-semibold text-gray-900 mb-2">
												Eligibility Marks
											</h4>
											<div className="space-y-1">
												{job.eligibility_marks.map((mark, idx) => (
													<div
														key={idx}
														className="flex justify-between text-sm"
													>
														<span className="text-gray-600">{mark.level}:</span>
														<span className="font-medium">
															{mark.criteria}%
														</span>
													</div>
												))}
											</div>
										</div>

										<div>
											<h4 className="font-semibold text-gray-900 mb-2">
												Eligible Courses
											</h4>
											<div className="flex flex-wrap gap-1">
												{job.eligibility_courses.map((course, idx) => (
													<Badge
														key={idx}
														variant="secondary"
														className="text-xs"
													>
														{course}
													</Badge>
												))}
											</div>
										</div>

										{job.required_skills.length > 0 && (
											<div>
												<h4 className="font-semibold text-gray-900 mb-2">
													Required Skills
												</h4>
												<div className="flex flex-wrap gap-1">
													{job.required_skills.map((skill, idx) => (
														<Badge
															key={idx}
															variant="outline"
															className="text-xs"
														>
															{skill}
														</Badge>
													))}
												</div>
											</div>
										)}

										<div>
											<h4 className="font-semibold text-gray-900 mb-2">
												Hiring Process
											</h4>
											<div className="space-y-2">
												{job.hiring_flow.map((step, idx) => (
													<div key={idx} className="flex items-center text-sm">
														<div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center mr-3">
															{idx + 1}
														</div>
														<span>{step}</span>
													</div>
												))}
											</div>
										</div>

										{job.package_info && (
											<div>
												<h4 className="font-semibold text-gray-900 mb-2">
													Package Info
												</h4>
												<p className="text-sm text-gray-700">
													{job.package_info}
												</p>
											</div>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</Layout>
	);
}
