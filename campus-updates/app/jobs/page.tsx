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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
	}, [maxPackageLpa, maxCgpa]);

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

						<div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:items-center">
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

							<div className="space-y-2">
								<div className="text-sm text-gray-600 flex items-center justify-between">
									<span>CGPA Range</span>
									<span className="font-medium text-gray-900">
										{cgpaRange[0].toFixed(1)} - {cgpaRange[1].toFixed(1)}
									</span>
								</div>
								<Slider
									min={0}
									max={10}
									step={0.1}
									value={cgpaRange}
									onValueChange={(v) => setCgpaRange([v[0] ?? 0, v[1] ?? 10])}
									className="w-full"
								/>
								<div className="flex justify-between text-xs text-gray-500">
									<span>0.0</span>
									<span>10.0</span>
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
						<Card
							key={job.id}
							className="hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50"
						>
							<CardHeader className="pb-4">
								<div className="flex items-start justify-between mb-3">
									<div className="flex-1">
										<CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight">
											{job.job_profile}
										</CardTitle>
										<div className="flex items-center text-gray-600 mb-3">
											<BuildingIcon className="w-4 h-4 mr-2 text-blue-600" />
											<span className="font-semibold text-blue-700">
												{job.company}
											</span>
										</div>
									</div>
									<div className="text-right">
										<Badge
											variant="outline"
											className={`${getCategoryColor(
												job.placement_category_code
											)} font-medium`}
										>
											{job.placement_category}
										</Badge>
										<div className="text-xs text-gray-500 mt-1">
											{formatDateTime(job.createdAt)}
										</div>
									</div>
								</div>

								{job.eligibility_courses?.length ? (
									<div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
										<div className="text-xs font-medium text-blue-700 mb-2">
											Eligible Branches
										</div>
										<div className="flex flex-wrap gap-1">
											{job.eligibility_courses
												.slice(0, 3)
												.map((course, idx) => (
													<Badge
														key={idx}
														variant="secondary"
														className="text-[10px] bg-white border-blue-200 text-blue-700"
													>
														{course}
													</Badge>
												))}
											{job.eligibility_courses.length > 3 && (
												<Badge
													variant="outline"
													className="text-[10px] border-blue-300"
												>
													+{job.eligibility_courses.length - 3} more
												</Badge>
											)}
										</div>
									</div>
								) : null}
							</CardHeader>

							<CardContent className="space-y-4 pt-0">
								<div className="grid grid-cols-2 gap-3">
									<div className="bg-green-50 border border-green-200 rounded-lg p-3">
										<div className="flex items-center">
											<IndianRupeeIcon className="w-4 h-4 mr-2 text-green-600" />
											<span className="text-sm font-medium text-green-600">
												Package
											</span>
										</div>
										<span className="text-lg font-bold text-green-700 block">
											{formatPackage(job.package)}
										</span>
									</div>
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
										<div className="flex items-center">
											<MapPinIcon className="w-4 h-4 mr-2 text-blue-600" />
											<span className="text-sm font-medium text-blue-600">
												Location
											</span>
										</div>
										<span className="text-sm font-semibold text-blue-700 block mt-1">
											{job.location}
										</span>
									</div>
								</div>

								{/* CGPA and Deadline Row */}
								<div className="grid grid-cols-2 gap-3">
									{(() => {
										const ugMark = job.eligibility_marks.find(
											(mark) => mark.level.toLowerCase() === "ug"
										);
										return ugMark ? (
											<div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
												<div className="flex items-center">
													<UsersIcon className="w-4 h-4 mr-2 text-purple-600" />
													<span className="text-sm font-medium text-purple-600">
														Min CGPA
													</span>
												</div>
												<span className="text-lg font-bold text-purple-700 block">
													{ugMark.criteria.toFixed(1)}/10
												</span>
											</div>
										) : (
											<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
												<div className="flex items-center">
													<UsersIcon className="w-4 h-4 mr-2 text-gray-400" />
													<span className="text-sm font-medium text-gray-500">
														CGPA
													</span>
												</div>
												<span className="text-sm text-gray-500 block">
													Not specified
												</span>
											</div>
										);
									})()}
									<div className="bg-red-50 border border-red-200 rounded-lg p-3">
										<div className="flex items-center">
											<ClockIcon className="w-4 h-4 mr-2 text-red-600" />
											<span className="text-sm font-medium text-red-600">
												Deadline
											</span>
										</div>
										<span className="text-sm font-semibold text-red-700 block mt-1">
											{job.deadline ? formatDate(job.deadline) : "No deadline"}
										</span>
									</div>
								</div>

								<Dialog>
									<DialogTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 font-medium"
											onClick={() => setSelectedJobModal(job)}
										>
											View Details
											<ChevronDownIcon className="w-4 h-4 ml-1" />
										</Button>
									</DialogTrigger>
									<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
										<DialogHeader>
											<DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
												<BuildingIcon className="w-5 h-5 text-blue-600" />
												{job.job_profile} at {job.company}
											</DialogTitle>
											<DialogDescription className="text-gray-600">
												{job.placement_category} • Posted on{" "}
												{formatDate(job.createdAt)}
											</DialogDescription>
										</DialogHeader>

										<div className="space-y-6 mt-4">
											{/* Key Info Cards */}
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
												<div className="bg-green-50 border border-green-200 rounded-lg p-4">
													<div className="flex items-center justify-between">
														<span className="text-sm text-green-600 font-medium">
															Package
														</span>
														<IndianRupeeIcon className="w-4 h-4 text-green-600" />
													</div>
													<p className="text-lg font-bold text-green-700">
														{formatPackage(job.package)}
													</p>
												</div>
												<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
													<div className="flex items-center justify-between">
														<span className="text-sm text-blue-600 font-medium">
															Location
														</span>
														<MapPinIcon className="w-4 h-4 text-blue-600" />
													</div>
													<p className="text-lg font-semibold text-blue-700">
														{job.location}
													</p>
												</div>
												<div className="bg-red-50 border border-red-200 rounded-lg p-4">
													<div className="flex items-center justify-between">
														<span className="text-sm text-red-600 font-medium">
															Deadline
														</span>
														<ClockIcon className="w-4 h-4 text-red-600" />
													</div>
													<p className="text-lg font-semibold text-red-700">
														{job.deadline
															? formatDate(job.deadline)
															: "No deadline"}
													</p>
												</div>
											</div>

											{/* Job Description */}
											<div className="bg-white border border-gray-200 rounded-lg p-4">
												<h4 className="font-semibold text-gray-900 mb-3 flex items-center">
													<BookOpenIcon className="w-5 h-5 mr-2 text-blue-600" />
													Job Description
												</h4>
												<div
													className="text-sm text-gray-700 prose prose-sm max-w-none"
													dangerouslySetInnerHTML={{
														__html: job.job_description,
													}}
												/>
											</div>

											{/* Eligibility */}
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
													<h4 className="font-semibold text-amber-900 mb-3">
														Eligibility Marks
													</h4>
													<div className="space-y-2">
														{job.eligibility_marks.map((mark, idx) => (
															<div
																key={idx}
																className="flex justify-between text-sm"
															>
																<span className="text-amber-700">
																	{mark.level}:
																</span>
																<span className="font-semibold text-amber-800">
																	{mark.level.toLowerCase() === "ug"
																		? `${mark.criteria.toFixed(1)}/10 CGPA`
																		: `${mark.criteria}%`}
																</span>
															</div>
														))}
													</div>
												</div>

												<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
													<h4 className="font-semibold text-purple-900 mb-3">
														Eligible Courses
													</h4>
													<div className="flex flex-wrap gap-1">
														{job.eligibility_courses.map((course, idx) => (
															<Badge
																key={idx}
																variant="secondary"
																className="text-xs bg-white border-purple-300"
															>
																{course}
															</Badge>
														))}
													</div>
												</div>
											</div>

											{/* Skills and Hiring Process */}
											{job.required_skills.length > 0 && (
												<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
													<h4 className="font-semibold text-gray-900 mb-3">
														Required Skills
													</h4>
													<div className="flex flex-wrap gap-2">
														{job.required_skills.map((skill, idx) => (
															<Badge
																key={idx}
																variant="outline"
																className="text-sm"
															>
																{skill}
															</Badge>
														))}
													</div>
												</div>
											)}

											<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
												<h4 className="font-semibold text-indigo-900 mb-3">
													Hiring Process
												</h4>
												<div className="space-y-3">
													{job.hiring_flow.map((step, idx) => (
														<div key={idx} className="flex items-start">
															<div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center mr-3 flex-shrink-0">
																{idx + 1}
															</div>
															<span className="text-indigo-800 leading-relaxed">
																{step}
															</span>
														</div>
													))}
												</div>
											</div>

											{job.package_info && (
												<div className="bg-green-50 border border-green-200 rounded-lg p-4">
													<h4 className="font-semibold text-green-900 mb-2">
														Package Details
													</h4>
													<p className="text-sm text-green-800">
														{job.package_info}
													</p>
												</div>
											)}
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
