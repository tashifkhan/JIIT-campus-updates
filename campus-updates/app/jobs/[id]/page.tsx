"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	BuildingIcon,
	IndianRupeeIcon,
	MapPinIcon,
	UsersIcon,
	BookOpenIcon,
	ClockIcon,
	DownloadIcon,
	FileTextIcon,
	ExternalLinkIcon,
	ArrowLeftIcon,
	CalendarIcon,
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

export default function JobDetailPage() {
	const params = useParams();
	const router = useRouter();
	const jobId = params.id as string;

	const category_mapping: Record<number, string> = {
		1: "High",
		2: "Middle",
		3: "> 4.6L",
		4: "Internship",
	};

	// Fetch individual job
	const {
		data: jobResp,
		isLoading,
		error,
	} = useQuery<Job>({
		queryKey: ["job", jobId],
		queryFn: async () => {
			const res = await fetch(`/api/jobs/${jobId}`);
			const json = await res.json();
			if (!json.ok) {
				throw new Error(json.error || "Failed to fetch job");
			}
			return json.data as Job;
		},
		enabled: !!jobId,
	});

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

	if (isLoading) {
		return (
			<Layout>
				<div className="max-w-4xl mx-auto p-4">
					{/* Back Button Skeleton */}
					<div className="mb-6">
						<div
							className="h-10 w-24 rounded animate-pulse"
							style={{ backgroundColor: "var(--primary-color)" }}
						></div>
					</div>

					{/* Header Skeleton */}
					<div className="mb-8">
						<div
							className="h-8 w-3/4 rounded mb-4 animate-pulse"
							style={{ backgroundColor: "var(--primary-color)" }}
						></div>
						<div
							className="h-4 w-1/2 rounded animate-pulse"
							style={{ backgroundColor: "var(--primary-color)" }}
						></div>
					</div>

					{/* Content Skeletons */}
					<div className="grid gap-6">
						{[...Array(4)].map((_, i) => (
							<Card key={i} className="animate-pulse card-theme">
								<CardHeader>
									<div
										className="h-6 rounded w-1/3 mb-2"
										style={{ backgroundColor: "var(--primary-color)" }}
									></div>
								</CardHeader>
								<CardContent>
									<div
										className="h-20 rounded"
										style={{ backgroundColor: "var(--primary-color)" }}
									></div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</Layout>
		);
	}

	if (error || !jobResp) {
		return (
			<Layout>
				<div className="max-w-4xl mx-auto p-4">
					<Button
						variant="outline"
						onClick={() => router.back()}
						className="mb-6 hover-theme"
						style={{
							borderColor: "var(--border-color)",
							color: "var(--text-color)",
						}}
					>
						<ArrowLeftIcon className="w-4 h-4 mr-2" />
						Back
					</Button>

					<Card
						className="text-center py-12"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardContent>
							<h1
								className="text-xl font-bold mb-2"
								style={{ color: "var(--text-color)" }}
							>
								Job Not Found
							</h1>
							<p className="mb-4" style={{ color: "var(--label-color)" }}>
								The job posting you're looking for doesn't exist or has been
								removed.
							</p>
							<Button
								onClick={() => router.push("/jobs")}
								style={{
									backgroundColor: "var(--accent-color)",
									color: "var(--bg-color)",
								}}
							>
								Browse All Jobs
							</Button>
						</CardContent>
					</Card>
				</div>
			</Layout>
		);
	}

	const job = jobResp;

	return (
		<Layout>
			<div className="max-w-4xl mx-auto p-4">
				{/* Back Button */}
				<Button
					variant="outline"
					onClick={() => router.back()}
					className="mb-6 hover-theme"
					style={{
						borderColor: "var(--border-color)",
						color: "var(--text-color)",
					}}
				>
					<ArrowLeftIcon className="w-4 h-4 mr-2" />
					Back
				</Button>

				{/* Header */}
				<div className="mb-8">
					<div className="flex items-start justify-between mb-4">
						<div className="flex-1">
							<h1
								className="text-2xl lg:text-3xl font-bold mb-2 leading-tight"
								style={{ color: "var(--text-color)" }}
							>
								{job.job_profile}
							</h1>
							<div
								className="flex items-center mb-3"
								style={{ color: "var(--label-color)" }}
							>
								<BuildingIcon
									className="w-5 h-5 mr-2"
									style={{ color: "var(--accent-color)" }}
								/>
								<span
									className="text-lg font-semibold"
									style={{ color: "var(--accent-color)" }}
								>
									{job.company}
								</span>
							</div>
						</div>
						<div className="text-right">
							<Badge
								variant="outline"
								className="font-medium border text-sm"
								style={getCategoryColor(job.placement_category_code)}
							>
								{category_mapping[job.placement_category_code] ||
									job.placement_category}
							</Badge>
							<div
								className="text-sm mt-2 flex items-center"
								style={{ color: "var(--label-color)" }}
							>
								<CalendarIcon className="w-4 h-4 mr-1" />
								Posted on {formatDateTime(job.createdAt)}
							</div>
						</div>
					</div>
				</div>

				{/* Key Information Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<Card
						className="card-theme"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-2">
								<span
									className="text-sm font-medium"
									style={{ color: "var(--accent-color)" }}
								>
									Package
								</span>
								<IndianRupeeIcon
									className="w-5 h-5"
									style={{ color: "var(--accent-color)" }}
								/>
							</div>
							<p
								className="text-2xl font-bold"
								style={{ color: "var(--text-color)" }}
							>
								{formatPackage(job.package)}
							</p>
						</CardContent>
					</Card>

					<Card
						className="card-theme"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-2">
								<span
									className="text-sm font-medium"
									style={{ color: "var(--accent-color)" }}
								>
									Location
								</span>
								<MapPinIcon
									className="w-5 h-5"
									style={{ color: "var(--accent-color)" }}
								/>
							</div>
							<p
								className="text-xl font-semibold"
								style={{ color: "var(--text-color)" }}
							>
								{job.location}
							</p>
						</CardContent>
					</Card>

					<Card
						className="card-theme"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-2">
								<span
									className="text-sm font-medium"
									style={{ color: "var(--accent-color)" }}
								>
									Deadline
								</span>
								<ClockIcon
									className="w-5 h-5"
									style={{ color: "var(--accent-color)" }}
								/>
							</div>
							<p
								className="text-xl font-semibold"
								style={{ color: "var(--text-color)" }}
							>
								{job.deadline ? formatDate(job.deadline) : "No deadline"}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Job Description */}
				<Card
					className="mb-6 card-theme"
					style={{
						backgroundColor: "var(--card-bg)",
						borderColor: "var(--border-color)",
					}}
				>
					<CardHeader>
						<CardTitle
							className="flex items-center"
							style={{ color: "var(--text-color)" }}
						>
							<BookOpenIcon
								className="w-5 h-5 mr-2"
								style={{ color: "var(--accent-color)" }}
							/>
							Job Description
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className="prose prose-sm max-w-none job-description-content"
							style={{
								color: "var(--text-color)",
								wordBreak: "break-word",
							}}
							dangerouslySetInnerHTML={{
								__html: job.job_description,
							}}
						/>
					</CardContent>
				</Card>

				{/* Documents Section */}
				{job.documents && job.documents.length > 0 && (
					<Card
						className="mb-6 card-theme"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardHeader>
							<CardTitle
								className="flex items-center"
								style={{ color: "var(--text-color)" }}
							>
								<FileTextIcon
									className="w-5 h-5 mr-2"
									style={{ color: "var(--accent-color)" }}
								/>
								Documents & Attachments
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{job.documents.map((doc, idx) => (
									<div
										key={idx}
										className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--border-color)",
										}}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center flex-1 min-w-0">
												<FileTextIcon
													className="w-5 h-5 mr-3 flex-shrink-0"
													style={{ color: "var(--accent-color)" }}
												/>
												<div className="flex-1 min-w-0">
													<p
														className="text-base font-medium truncate"
														style={{ color: "var(--text-color)" }}
														title={doc.name}
													>
														{doc.name}
													</p>
													<p
														className="text-sm mt-1"
														style={{ color: "var(--label-color)" }}
													>
														Document ID: {doc.identifier.slice(0, 8)}...
													</p>
												</div>
											</div>
											<div className="flex gap-3 ml-4">
												<Button
													variant="outline"
													className="flex items-center gap-2 hover-theme"
													style={{
														borderColor: "var(--accent-color)",
														color: "var(--accent-color)",
														backgroundColor: "transparent",
													}}
													onClick={() => {
														window.open(doc.url, "_blank");
													}}
												>
													<ExternalLinkIcon className="w-4 h-4" />
													View
												</Button>
												<Button
													variant="outline"
													className="flex items-center gap-2 hover-theme"
													style={{
														borderColor: "var(--accent-color)",
														color: "var(--accent-color)",
														backgroundColor: "transparent",
													}}
													onClick={() => {
														// Create a temporary anchor element to trigger download
														const link = document.createElement("a");
														link.href = doc.url;
														link.download = doc.name;
														link.target = "_blank";
														document.body.appendChild(link);
														link.click();
														document.body.removeChild(link);
													}}
												>
													<DownloadIcon className="w-4 h-4" />
													Download
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Eligibility Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<Card
						className="card-theme"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardHeader>
							<CardTitle style={{ color: "var(--text-color)" }}>
								Eligibility Marks
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{job.eligibility_marks.map((mark, idx) => (
									<div
										key={idx}
										className="flex justify-between items-center p-3 rounded-lg"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--border-color)",
										}}
									>
										<span
											className="font-medium"
											style={{ color: "var(--label-color)" }}
										>
											{mark.level}:
										</span>
										<span
											className="font-bold text-lg"
											style={{ color: "var(--text-color)" }}
										>
											{mark.level.toLowerCase() === "ug"
												? `${mark.criteria.toFixed(1)}/10 CGPA`
												: `${mark.criteria}%`}
										</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					<Card
						className="card-theme"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardHeader>
							<CardTitle style={{ color: "var(--text-color)" }}>
								Eligible Courses
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{job.eligibility_courses.map((course, idx) => (
									<Badge
										key={idx}
										variant="secondary"
										className="text-sm border px-3 py-1"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--border-color)",
											color: "var(--text-color)",
										}}
									>
										{course}
									</Badge>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Skills Section */}
				{job.required_skills.length > 0 && (
					<Card
						className="mb-6 card-theme"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardHeader>
							<CardTitle style={{ color: "var(--text-color)" }}>
								Required Skills
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{job.required_skills.map((skill, idx) => (
									<Badge
										key={idx}
										variant="outline"
										className="text-sm px-3 py-1"
										style={{
											borderColor: "var(--border-color)",
											color: "var(--text-color)",
										}}
									>
										{skill}
									</Badge>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Hiring Process */}
				<Card
					className="mb-6 card-theme"
					style={{
						backgroundColor: "var(--card-bg)",
						borderColor: "var(--border-color)",
					}}
				>
					<CardHeader>
						<CardTitle style={{ color: "var(--text-color)" }}>
							Hiring Process
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{job.hiring_flow.map((step, idx) => (
								<div key={idx} className="flex items-start">
									<div
										className="w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center mr-4 flex-shrink-0"
										style={{
											backgroundColor: "var(--accent-color)",
											color: "var(--bg-color)",
										}}
									>
										{idx + 1}
									</div>
									<span
										className="text-base leading-relaxed pt-2"
										style={{ color: "var(--text-color)" }}
									>
										{step}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Package Details */}
				{job.package_info && (
					<Card
						className="mb-6 card-theme"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardHeader>
							<CardTitle style={{ color: "var(--text-color)" }}>
								Package Details
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div
								className="job-description-content"
								style={{
									color: "var(--text-color)",
									wordBreak: "break-word",
								}}
								dangerouslySetInnerHTML={{
									__html: job.package_info,
								}}
							/>
						</CardContent>
					</Card>
				)}

				{/* Additional Information */}
				<Card
					className="card-theme"
					style={{
						backgroundColor: "var(--card-bg)",
						borderColor: "var(--border-color)",
					}}
				>
					<CardHeader>
						<CardTitle style={{ color: "var(--text-color)" }}>
							Additional Information
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<h4
									className="font-semibold mb-2"
									style={{ color: "var(--text-color)" }}
								>
									Allowed Genders
								</h4>
								<div className="flex flex-wrap gap-2">
									{job.allowed_genders.map((gender, idx) => (
										<Badge
											key={idx}
											variant="outline"
											style={{
												borderColor: "var(--border-color)",
												color: "var(--text-color)",
											}}
										>
											{gender}
										</Badge>
									))}
								</div>
							</div>
							<div>
								<h4
									className="font-semibold mb-2"
									style={{ color: "var(--text-color)" }}
								>
									Placement Type
								</h4>
								<Badge
									variant="secondary"
									style={{
										backgroundColor: "var(--primary-color)",
										borderColor: "var(--border-color)",
										color: "var(--text-color)",
									}}
								>
									{job.placement_type || "Not specified"}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
}
