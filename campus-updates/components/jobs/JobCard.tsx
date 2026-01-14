"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ArrowRightIcon,
	ChevronDownIcon,
	ClockIcon,
	IndianRupeeIcon,
	MapPinIcon,
	UsersIcon,
	BuildingIcon,
	Loader2Icon,
} from "lucide-react";
import { Job } from "./types";
import {
	categoryMapping,
	formatDate,
	formatDateTime,
	formatPackage,
	getCategoryColor,
} from "./helpers";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
	job: Job;
	onQuickView: (job: Job) => void;
};

export default function JobCard({ job, onQuickView }: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<Card
			className={`hover:shadow-[0_0_30px_rgba(var(--primary),0.15)] hover:border-primary/50 transition-all duration-300 border card-theme cursor-pointer bg-card border-border text-foreground ${
				isPending ? "opacity-70 pointer-events-none" : ""
			}`}
			role="button"
			tabIndex={0}
			onClick={() => {
				if (
					typeof window !== "undefined" &&
					window.matchMedia("(max-width: 767px)").matches
				) {
					// On mobile, go directly to full page
					startTransition(() => {
						router.push(`/jobs/${job.id}`);
					});
				} else {
					// On larger screens, open quick view
					onQuickView(job);
				}
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onQuickView(job);
				}
			}}
		>
			<CardHeader className="pb-4">
				<div className="flex items-start justify-between mb-3">
					<div className="flex-1">
						<CardTitle className="text-lg font-bold mb-2 leading-tight text-foreground">
							{job.job_profile}
						</CardTitle>
						<div className="flex items-center mb-3 text-muted-foreground">
							<BuildingIcon className="w-4 h-4 mr-2 text-primary" />
							<span className="font-semibold text-primary">{job.company}</span>
						</div>
					</div>
					<div className="text-right">
						<Badge
							variant="outline"
							className="font-medium border"
							style={getCategoryColor(job.placement_category_code)}
						>
							{categoryMapping[job.placement_category_code] ||
								job.placement_category}
						</Badge>
						<div className="text-xs mt-1 text-muted-foreground">
							{formatDateTime(job.createdAt)}
						</div>
					</div>
				</div>

				{job.eligibility_courses?.length ? (
					<div className="border rounded-lg p-3">
						<div className="text-xs font-medium mb-2 text-primary">
							Eligible Branches
						</div>
						<div className="flex flex-wrap gap-1">
							{job.eligibility_courses.slice(0, 3).map((course, idx) => (
								<Badge
									key={idx}
									variant="secondary"
									className="text-[10px] border text-primary bg-card border-border"
								>
									{course}
								</Badge>
							))}
							{job.eligibility_courses.length > 3 && (
								<Badge
									variant="outline"
									className="text-[10px] border-border text-foreground"
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
					<div className="border rounded-lg p-3 bg-muted/50 border-border">
						<div className="flex items-center">
							<IndianRupeeIcon className="w-4 h-4 mr-2 text-primary" />
							<span className="text-sm font-medium text-primary">Package</span>
						</div>
						<span className="text-lg font-bold block text-foreground">
							{formatPackage(job)}
						</span>
					</div>
					<div className="border rounded-lg p-3 bg-muted/50 border-border">
						<div className="flex items-center">
							<MapPinIcon className="w-4 h-4 mr-2 text-primary" />
							<span className="text-sm font-medium text-primary">Location</span>
						</div>
						<span className="text-sm font-semibold block mt-1 text-foreground">
							{job.location}
						</span>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{(() => {
						const ugMark = job.eligibility_marks.find(
							(mark) => mark.level.toLowerCase() === "ug"
						);
						return ugMark ? (
							<div className="border rounded-lg p-3 bg-muted/50 border-border">
								<div className="flex items-center">
									<UsersIcon className="w-4 h-4 mr-2 text-primary" />
									<span className="text-sm font-medium text-primary">
										Min CGPA
									</span>
								</div>
								<span className="text-lg font-bold block text-foreground">
									{ugMark.criteria.toFixed(1)}/10
								</span>
							</div>
						) : (
							<div className="border rounded-lg p-3 bg-primary/10 border-border">
								<div className="flex items-center">
									<UsersIcon className="w-4 h-4 mr-2 text-muted-foreground" />
									<span className="text-sm font-medium text-muted-foreground">
										CGPA
									</span>
								</div>
								<span className="text-sm block text-muted-foreground">
									Not specified
								</span>
							</div>
						);
					})()}
					<div className="border rounded-lg p-3 bg-muted/50 border-border">
						<div className="flex items-center">
							<ClockIcon className="w-4 h-4 mr-2 text-primary" />
							<span className="text-sm font-medium text-primary">Deadline</span>
						</div>
						<span className="text-sm font-semibold block mt-1 text-foreground">
							{job.deadline ? formatDate(job.deadline) : "No deadline"}
						</span>
					</div>
				</div>

				<div className="flex gap-2 mt-2">
					<Button
						variant="outline"
						size="sm"
						className="flex-1 font-medium border hover-theme bg-primary/10 border-primary text-primary"
						onClick={(e) => {
							e.stopPropagation();
							if (
								typeof window !== "undefined" &&
								window.matchMedia("(max-width: 767px)").matches
							) {
								startTransition(() => {
									router.push(`/jobs/${job.id}`);
								});
							} else {
								onQuickView(job);
							}
						}}
					>
						Quick View
						<ChevronDownIcon className="w-4 h-4 ml-1" />
					</Button>
					<Button
						variant="default"
						size="sm"
						className="flex-1 font-medium bg-primary text-primary-foreground"
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
								Full Details
								<ArrowRightIcon className="w-4 h-4 ml-1" />
							</>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
