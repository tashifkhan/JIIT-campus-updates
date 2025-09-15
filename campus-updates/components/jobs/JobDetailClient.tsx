"use client";

import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	BuildingIcon,
	IndianRupeeIcon,
	MapPinIcon,
	ClockIcon,
	DownloadIcon,
	FileTextIcon,
	ExternalLinkIcon,
	Share,
	ArrowLeftIcon,
	BookOpenIcon,
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
	annum_months?: string;
	required_skills: string[];
	hiring_flow: string[];
	placement_type: string | null;
	documents?: Array<{
		name: string;
		identifier: string;
		url: string;
	}>;
}

export default function JobDetailClient({ job }: { job: Job }) {
	const router = useRouter();

	const category_mapping: Record<number, string> = {
		1: "High",
		2: "Middle",
		3: "> 4.6L",
		4: "Internship",
	};

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

	const formatPackage = (job: Job) => {
		const amount = job.package;
		const annumMonths = job.annum_months;

		// Check if annum_months exists and starts with "M" (case insensitive)
		const isMonthly =
			annumMonths &&
			(annumMonths.toUpperCase().startsWith("M") ||
				annumMonths.toLowerCase().startsWith("m"));

		if (amount >= 100000) {
			const suffix = isMonthly ? "LPM" : "LPA";
			return `₹${(amount / 100000).toFixed(1)} ${suffix}`;
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
				return { ...baseStyle, color: "#dc2626" };
			case 2:
				return { ...baseStyle, color: "#d97706" };
			case 3:
				return { ...baseStyle, color: "#059669" };
			case 4:
				return { ...baseStyle, color: "#2563eb" };
			default:
				return { ...baseStyle, color: "var(--text-color)" };
		}
	};

	const jobLocal = job;

	// Share handler: uses Web Share API when available, otherwise copies link
	const handleShare = async () => {
		try {
			const title = `${jobLocal.company} ${jobLocal.job_profile} - JIIT Placement Updates`;
			const url = typeof window !== "undefined" ? window.location.href : "";
			// Try Web Share API
			if (navigator && (navigator as any).share) {
				await (navigator as any).share({
					title,
					text: stripHtml(jobLocal.job_description).slice(0, 200),
					url,
				});
				return;
			}

			// Fallback: copy to clipboard
			if (navigator && navigator.clipboard && url) {
				await navigator.clipboard.writeText(url);
				showToast("Link copied to clipboard");
				return;
			}
			// Final fallback: create temporary input
			const input = document.createElement("input");
			input.value = url;
			document.body.appendChild(input);
			input.select();
			document.execCommand("copy");
			document.body.removeChild(input);
			showToast("Link copied to clipboard");
		} catch (e) {
			showToast("Unable to share");
		}
	};

	const stripHtml = (html: string) => {
		if (!html) return "";
		const div = document.createElement("div");
		div.innerHTML = html;
		return div.textContent || div.innerText || "";
	};

	const showToast = (message: string) => {
		const toast = document.createElement("div");
		toast.setAttribute("role", "status");
		toast.textContent = message;
		Object.assign(toast.style, {
			position: "fixed",
			right: "20px",
			bottom: "96px",
			zIndex: "9999",
			background: "var(--accent-color)",
			color: "white",
			padding: "8px 12px",
			borderRadius: "9999px",
			boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
			fontSize: "13px",
			fontWeight: "600",
			opacity: "0",
			transform: "translateY(6px)",
			transition: "opacity 180ms ease, transform 180ms ease",
			pointerEvents: "none",
		});

		document.body.appendChild(toast);
		requestAnimationFrame(() => {
			toast.style.opacity = "1";
			toast.style.transform = "translateY(0)";
		});
		setTimeout(() => {
			toast.style.opacity = "0";
			toast.style.transform = "translateY(6px)";
			setTimeout(() => {
				if (toast.parentNode) toast.parentNode.removeChild(toast);
			}, 200);
		}, 2500);
	};

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

				<Button
					variant="outline"
					className="mb-6 ml-3 hover-theme"
					style={{
						borderColor: "var(--border-color)",
						color: "var(--text-color)",
					}}
					onClick={handleShare}
				>
					<Share className="w-4 h-4 mr-2" />
					Share
				</Button>

				<div className="mb-8">
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
						<div className="flex-1">
							<h1
								className="text-2xl lg:text-3xl font-bold mb-2 leading-tight"
								style={{ color: "var(--text-color)" }}
							>
								{jobLocal.job_profile}
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
									{jobLocal.company}
								</span>
							</div>
						</div>
						<div className="text-left sm:text-right self-start sm:self-auto flex items-center gap-2 sm:block">
							<Badge
								variant="outline"
								className="inline-flex items-center font-medium border text-sm"
								style={getCategoryColor(jobLocal.placement_category_code)}
							>
								{category_mapping[jobLocal.placement_category_code] ||
									jobLocal.placement_category}
							</Badge>
							<div
								className="text-sm mt-2 flex items-center sm:justify-end"
								style={{ color: "var(--label-color)" }}
							>
								<CalendarIcon className="w-4 h-4 mr-1" />
								Posted on {formatDateTime(jobLocal.createdAt)}
							</div>
						</div>
					</div>
				</div>

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
								{formatPackage(jobLocal)}
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
								{jobLocal.location}
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
								{jobLocal.deadline
									? formatDate(jobLocal.deadline)
									: "No deadline"}
							</p>
						</CardContent>
					</Card>
				</div>

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
							style={{ color: "var(--text-color)", wordBreak: "break-word" }}
							dangerouslySetInnerHTML={{ __html: jobLocal.job_description }}
						/>
					</CardContent>
				</Card>

				{jobLocal.documents && jobLocal.documents.length > 0 && (
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
								{jobLocal.documents.map((doc, idx) => (
									<div
										key={idx}
										className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
										style={{
											backgroundColor: "var(--primary-color)",
											borderColor: "var(--border-color)",
										}}
									>
										<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
											<div className="flex items-center flex-1 min-w-0 w-full">
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
											<div className="flex self-end gap-3 sm:self-auto">
												<Button
													variant="outline"
													className="flex items-center gap-2 hover-theme"
													style={{
														borderColor: "var(--accent-color)",
														color: "var(--accent-color)",
														backgroundColor: "transparent",
													}}
													onClick={() => window.open(doc.url, "_blank")}
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
								{jobLocal.eligibility_marks.map((mark, idx) => (
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
								{jobLocal.eligibility_courses.map((course, idx) => (
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

				{jobLocal.required_skills.length > 0 && (
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
								{jobLocal.required_skills.map((skill, idx) => (
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
							{jobLocal.hiring_flow.map((step, idx) => (
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

				{jobLocal.package_info && (
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
								style={{ color: "var(--text-color)", wordBreak: "break-word" }}
								dangerouslySetInnerHTML={{ __html: jobLocal.package_info }}
							/>
						</CardContent>
					</Card>
				)}

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
									{jobLocal.allowed_genders.map((gender, idx) => (
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
									{jobLocal.placement_type || "Not specified"}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
}
