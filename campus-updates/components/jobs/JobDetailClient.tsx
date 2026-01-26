"use client";

import { useRouter } from "next/navigation";
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
	CheckCircle2Icon,
	GraduationCapIcon,
	BriefcaseIcon,
	UsersIcon,
	GlobeIcon,
} from "lucide-react";
import { getCategoryClass } from "./helpers";
import { cn } from "@/lib/utils";

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
			month: "short",
			year: "numeric",
		});
	};

	const formatDateTime = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	const formatPackage = (job: Job) => {
		const amount = job.package;
		const annumMonths = job.annum_months;

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

	const handleShare = async () => {
		try {
			const title = `${job.company} ${job.job_profile} - JIIT Placement Updates`;
			const url = typeof window !== "undefined" ? window.location.href : "";

			if (navigator && (navigator as any).share) {
				await (navigator as any).share({
					title,
					text: stripHtml(job.job_description).slice(0, 200),
					url,
				});
				return;
			}

			if (navigator && navigator.clipboard && url) {
				await navigator.clipboard.writeText(url);
				showToast("Link copied to clipboard");
				return;
			}

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
			bottom: "20px",
			zIndex: "9999",
			background: "var(--primary)",
			color: "var(--primary-foreground)",
			padding: "10px 16px",
			borderRadius: "8px",
			boxShadow: "var(--shadow-lg)",
			fontSize: "14px",
			fontWeight: "500",
			opacity: "0",
			transform: "translateY(10px)",
			transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
			pointerEvents: "none",
		});

		document.body.appendChild(toast);
		requestAnimationFrame(() => {
			toast.style.opacity = "1";
			toast.style.transform = "translateY(0)";
		});
		setTimeout(() => {
			toast.style.opacity = "0";
			toast.style.transform = "translateY(10px)";
			setTimeout(() => {
				if (toast.parentNode) toast.parentNode.removeChild(toast);
			}, 300);
		}, 3000);
	};

	return (
		<div className="min-h-screen bg-background pb-12">
			{/* Top Navigation */}
			<div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
				<div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
					<Button
						variant="ghost"
						onClick={() => router.back()}
						className="hover:bg-accent/50 -ml-2"
					>
						<ArrowLeftIcon className="w-5 h-5 mr-2 text-muted-foreground" />
						<span className="text-muted-foreground font-medium">Back</span>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="hover:bg-accent/50 mr-2"
						onClick={handleShare}
					>
						<Share className="w-5 h-5 text-muted-foreground" />
					</Button>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-4 pt-8">
				{/* Header Section */}
				<div className="mb-10">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
						<div className="space-y-3">
							<div className="space-y-2">
								<Badge
									variant="outline"
									className={cn(
										"px-2.5 py-0.5 text-xs font-medium border-0",
										getCategoryClass(job.placement_category_code),
									)}
								>
									{category_mapping[job.placement_category_code] ||
										job.placement_category}
								</Badge>
								<h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground bg-clip-text">
									{job.job_profile}
								</h1>
							</div>
							<div className="flex items-center gap-2 text-lg text-muted-foreground font-medium">
								<BuildingIcon className="w-5 h-5 text-primary/80" />
								<span>{job.company}</span>
							</div>
						</div>

						{/* Quick Actions / Desktop apply button placeholder if needed */}
						<div className="hidden md:block">
							<div className="text-sm font-medium text-muted-foreground text-right">
								Posted on {formatDateTime(job.createdAt)}
							</div>
						</div>
					</div>

					{/* Key Metrics Grid */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card className="card-subtle border-l-4 border-l-primary/50 relative overflow-hidden group">
							<div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
								<IndianRupeeIcon className="w-12 h-12" />
							</div>
							<CardContent className="p-5">
								<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
									CTC / Package
								</p>
								<p className="text-2xl font-bold text-foreground">
									{formatPackage(job)}
								</p>
								<p className="text-xs text-muted-foreground mt-1 line-clamp-1">
									{job.package_info || "Base + Variable"}
								</p>
							</CardContent>
						</Card>

						<Card className="card-subtle border-l-4 border-l-secondary/50 relative overflow-hidden group">
							<div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
								<MapPinIcon className="w-12 h-12" />
							</div>
							<CardContent className="p-5">
								<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
									Location
								</p>
								<p className="text-xl font-semibold text-foreground">
									{job.location}
								</p>
								<p className="text-xs text-muted-foreground mt-1">On-site</p>
							</CardContent>
						</Card>

						<Card className="card-subtle border-l-4 border-l-destructive/50 relative overflow-hidden group">
							<div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
								<ClockIcon className="w-12 h-12" />
							</div>
							<CardContent className="p-5">
								<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
									Deadline
								</p>
								<div className="flex items-baseline gap-2">
									<p className="text-xl font-semibold text-foreground">
										{job.deadline ? formatDate(job.deadline) : "ASAP"}
									</p>
									{job.deadline && (
										<span
											className={cn(
												"text-[10px] px-1.5 py-0.5 rounded-full",
												new Date(job.deadline).getTime() - Date.now() < 86400000
													? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
													: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
											)}
										>
											{Math.ceil(
												(new Date(job.deadline).getTime() - Date.now()) /
													(1000 * 60 * 60 * 24),
											)}{" "}
											days left
										</span>
									)}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									{job.deadline
										? new Date(job.deadline).toLocaleTimeString("en-GB", {
												hour: "2-digit",
												minute: "2-digit",
											})
										: "No specific deadline"}
								</p>
							</CardContent>
						</Card>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Column: Description & Details */}
					<div className="lg:col-span-2 space-y-8">
						{/* Job Description */}
						<div className="space-y-4">
							<h2 className="text-xl font-bold flex items-center gap-2">
								<div className="p-1.5 rounded-lg bg-primary/10 text-primary">
									<BookOpenIcon className="w-4 h-4" />
								</div>
								Description
							</h2>
							<Card className="card-subtle border-border/60 shadow-none">
								<CardContent className="p-5">
									<div
										className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80"
										style={{ wordBreak: "break-word" }}
										dangerouslySetInnerHTML={{ __html: job.job_description }}
									/>
								</CardContent>
							</Card>
						</div>

						{/* Hiring Flow */}
						<div className="space-y-4">
							<h2 className="text-xl font-bold flex items-center gap-2">
								<div className="p-1.5 rounded-lg bg-secondary/10 text-secondary-foreground">
									<BriefcaseIcon className="w-4 h-4" />
								</div>
								Hiring Process
							</h2>
							<div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
								{job.hiring_flow.map((step, idx) => (
									<div key={idx} className="relative">
										<div className="absolute -left-[29px] mt-1.5 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
											<div className="w-2.5 h-2.5 rounded-full bg-primary" />
										</div>
										<div className="bg-card border border-border/60 rounded-xl p-3.5 hover:shadow-md transition-shadow">
											<h3 className="font-semibold text-base mb-1">
												Step {idx + 1}
											</h3>
											<p className="text-sm text-muted-foreground">{step}</p>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Package Info Details (if available) */}
						{job.package_info && (
							<div className="space-y-4">
								<h2 className="text-xl font-bold flex items-center gap-2">
									<div className="p-1.5 rounded-lg bg-primary/10 text-primary">
										<IndianRupeeIcon className="w-4 h-4" />
									</div>
									Package Structure
								</h2>
								<Card className="card-subtle border-border/60 shadow-none">
									<CardContent className="p-5">
										<div
											className="prose prose-sm max-w-none text-muted-foreground"
											dangerouslySetInnerHTML={{ __html: job.package_info }}
										/>
									</CardContent>
								</Card>
							</div>
						)}
					</div>

					{/* Right Column: Key Details & Meta */}
					<div className="space-y-8">
						{/* Eligibility Section */}
						<div className="space-y-4">
							<h2 className="text-lg font-bold flex items-center gap-2">
								<GraduationCapIcon className="w-4 h-4 text-primary" />
								Eligibility
							</h2>
							<Card className="card-subtle border-border/60 shadow-none">
								<CardContent className="p-0">
									<div className="divide-y divide-border/60">
										{job.eligibility_marks.map((mark, idx) => (
											<div
												key={idx}
												className="p-3.5 flex justify-between items-center hover:bg-muted/50 transition-colors"
											>
												<span className="font-medium text-sm text-muted-foreground">
													{mark.level}
												</span>
												<Badge
													variant="secondary"
													className="font-bold text-sm"
												>
													{mark.level.toLowerCase() === "ug"
														? `${mark.criteria} ${mark.criteria <= 10 ? "CGPA" : "%"}`
														: `${mark.criteria}%`}
												</Badge>
											</div>
										))}
									</div>
									<div className="p-3.5 bg-muted/20 border-t border-border/60">
										<p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
											Allowed Courses
										</p>
										<div className="flex flex-wrap gap-1.5">
											{job.eligibility_courses.map((course, idx) => (
												<Badge
													key={idx}
													variant="outline"
													className="bg-background text-foreground hover:bg-accent cursor-default text-xs font-normal"
												>
													{course}
												</Badge>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Skills Section */}
						{job.required_skills.length > 0 && (
							<div className="space-y-4">
								<h2 className="text-lg font-bold flex items-center gap-2">
									<CheckCircle2Icon className="w-4 h-4 text-primary" />
									Skills Required
								</h2>
								<div className="flex flex-wrap gap-1.5">
									{job.required_skills.map((skill, idx) => (
										<Badge
											key={idx}
											variant="secondary"
											className="px-2.5 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-transparent"
										>
											{skill}
										</Badge>
									))}
								</div>
							</div>
						)}

						{/* Documents Section */}
						{job.documents && job.documents.length > 0 && (
							<div className="space-y-4">
								<h2 className="text-lg font-bold flex items-center gap-2">
									<FileTextIcon className="w-4 h-4 text-primary" />
									Attachments
								</h2>
								<div className="space-y-3">
									{job.documents.map((doc, idx) => (
										<div
											key={idx}
											className="group relative flex flex-col p-3 bg-card border border-border rounded-xl hover:border-primary/50 transition-all hover:shadow-md"
										>
											<div className="flex items-start gap-2.5 mb-2.5">
												<div className="p-1.5 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
													<FileTextIcon className="w-4 h-4" />
												</div>
												<div className="flex-1 min-w-0">
													<p
														className="font-medium text-sm text-foreground truncate"
														title={doc.name}
													>
														{doc.name}
													</p>
													<p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
														ID: {doc.identifier.slice(0, 6)}...
													</p>
												</div>
											</div>
											<div className="grid grid-cols-2 gap-2 mt-auto">
												<Button
													variant="secondary"
													size="sm"
													className="w-full text-xs h-7"
													onClick={() => window.open(doc.url, "_blank")}
												>
													<ExternalLinkIcon className="w-3 h-3 mr-2" />
													View
												</Button>
												<Button
													variant="outline"
													size="sm"
													className="w-full text-xs h-7"
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
													<DownloadIcon className="w-3 h-3 mr-2" />
													Save
												</Button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Meta Info */}
						<Card className="card-subtle bg-muted/10 border-none">
							<CardContent className="p-4 space-y-4">
								<div>
									<h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
										<UsersIcon className="w-4 h-4 text-muted-foreground" />
										Allowed Genders
									</h4>
									<div className="flex flex-wrap gap-2">
										{job.allowed_genders.map((gender, idx) => (
											<Badge
												key={idx}
												variant="outline"
												className="bg-background text-xs"
											>
												{gender}
											</Badge>
										))}
									</div>
								</div>
								<div>
									<h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
										<GlobeIcon className="w-4 h-4 text-muted-foreground" />
										Placement Type
									</h4>
									<Badge variant="outline" className="bg-background text-xs">
										{job.placement_type || "Standard"}
									</Badge>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
