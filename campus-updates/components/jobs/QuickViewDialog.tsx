"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Job } from "./types";
import {
	ArrowRightIcon,
	BuildingIcon,
	ClockIcon,
	DownloadIcon,
	ExternalLinkIcon,
	FileTextIcon,
	IndianRupeeIcon,
	MapPinIcon,
	Share2Icon,
	XIcon,
	Loader2Icon,
	BookOpenIcon,
} from "lucide-react";
import {
	categoryMapping,
	formatDate,
	formatPackage,
	handleShareUrl,
} from "./helpers";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
	job: Job | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export default function QuickViewDialog({ job, open, onOpenChange }: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	if (!job) return null;
	const share = async () => {
		const url = `${window.location.origin}/jobs/${job.id}`;
		await handleShareUrl(
			`${job.job_profile} at ${job.company}`,
			`${job.job_profile} at ${job.company} — ${formatPackage(job)}`,
			url
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
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
								{job.placement_category} • Posted on {formatDate(job.createdAt)}
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
								disabled={isPending}
								onClick={(e) => {
									e.stopPropagation();
									startTransition(() => {
										router.push(`/jobs/${job.id}`);
									});
								}}
							>
								{isPending ? (
									<span className="flex items-center gap-2">
										<Loader2Icon className="w-4 h-4 animate-spin" />
										Loading...
									</span>
								) : (
									<>
										<ArrowRightIcon className="w-4 h-4" />
										Full Page
									</>
								)}
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
								onClick={(e) => {
									e.stopPropagation();
									share();
								}}
							>
								<Share2Icon className="w-4 h-4" />
								Share
							</Button>
							<div className="flex items-center gap-2 md:hidden">
								<Button
									variant="ghost"
									size="sm"
									className="p-2"
									style={{ color: "var(--text-color)" }}
									onClick={(e) => {
										e.stopPropagation();
										share();
									}}
								>
									<Share2Icon className="w-5 h-5" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="p-2"
									style={{ color: "var(--text-color)" }}
									disabled={isPending}
									onClick={(e) => {
										e.stopPropagation();
										onOpenChange(false);
										startTransition(() => {
											router.push(`/jobs/${job.id}`);
										});
									}}
								>
									{isPending ? (
										<Loader2Icon className="w-5 h-5 animate-spin" />
									) : (
										<ArrowRightIcon className="w-5 h-5" />
									)}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="p-2"
									style={{ color: "var(--text-color)" }}
									onClick={(e) => {
										e.stopPropagation();
										onOpenChange(false);
									}}
								>
									<XIcon className="w-5 h-5" />
								</Button>
							</div>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 md:space-y-6 mt-4 mobile-dialog-content">
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
								{formatPackage(job)}
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
								{job.deadline ? formatDate(job.deadline) : "No deadline"}
							</p>
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
							style={{ color: "var(--text-color)", wordBreak: "break-word" }}
							dangerouslySetInnerHTML={{ __html: job.job_description }}
						/>
					</div>

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
									<div key={idx} className="flex justify-between text-sm">
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
								style={{ color: "var(--text-color)", wordBreak: "break-word" }}
								dangerouslySetInnerHTML={{ __html: job.package_info }}
							/>
						</div>
					)}

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
														Document ID: {doc.identifier.slice(0, 8)}...
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
													<span className="hidden sm:inline">View</span>
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
														const link = document.createElement("a");
														link.href = doc.url;
														link.download = doc.name;
														link.target = "_blank";
														document.body.appendChild(link);
														link.click();
														document.body.removeChild(link);
													}}
												>
													<DownloadIcon className="w-3 h-3" />
													<span className="hidden sm:inline">Download</span>
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

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
								opacity: isPending ? 0.7 : 1,
							}}
							disabled={isPending}
							onClick={(e) => {
								e.stopPropagation();
								onOpenChange(false);
								startTransition(() => {
									router.push(`/jobs/${job.id}`);
								});
							}}
						>
							<ArrowRightIcon className="w-4 h-4 mr-2" />
							{isPending ? "Loading..." : "Open Full Page"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
