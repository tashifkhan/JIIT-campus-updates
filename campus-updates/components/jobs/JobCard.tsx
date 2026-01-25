"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ArrowRightIcon,
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
	getCategoryClass,
} from "./helpers";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function JobCard({ job }: { job: Job }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleNavigate = () => {
		startTransition(() => {
			router.push(`/jobs/${job.id}`);
		});
	};

	return (
		<Card
			className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-primary/50 dark:hover:border-primary/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] cursor-pointer ${
				isPending ? "opacity-70 pointer-events-none" : ""
			}`}
			role="button"
			tabIndex={0}
			onClick={handleNavigate}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleNavigate();
				}
			}}
		>
			<div className="flex flex-col h-full p-5 space-y-5">
				{/* Header Section */}
				<div className="flex flex-col gap-1">
					<div className="flex items-start justify-between gap-3">
						<h3 className="font-bold text-xl leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
							{job.job_profile}
						</h3>
						<Badge
							variant="outline"
							className={`shrink-0 font-medium ${getCategoryClass(
								job.placement_category_code,
							)}`}
						>
							{categoryMapping[job.placement_category_code] ||
								job.placement_category}
						</Badge>
					</div>
					<div className="flex items-center text-sm font-medium text-muted-foreground/80">
						<BuildingIcon className="w-4 h-4 mr-2 text-primary/70" />
						<span className="truncate">{job.company}</span>
					</div>
				</div>

				{/* Eligibility Badges */}
				{job.eligibility_courses?.length ? (
					<div className="flex flex-wrap gap-1.5">
						{job.eligibility_courses.slice(0, 3).map((course, idx) => (
							<Badge
								key={idx}
								variant="secondary"
								className="px-2 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80 transition-colors dark:bg-secondary/60 dark:text-foreground/90"
							>
								{course}
							</Badge>
						))}
						{job.eligibility_courses.length > 3 && (
							<Badge
								variant="outline"
								className="px-2 py-0.5 text-[10px] text-muted-foreground border-border/50 bg-secondary/20 dark:bg-secondary/10"
							>
								+{job.eligibility_courses.length - 3}
							</Badge>
						)}
					</div>
				) : null}

				{/* Info Grid */}
				<div className="grid grid-cols-2 gap-3 mt-auto">
					<div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/40 border border-border/30 group-hover:bg-muted/60 transition-colors dark:bg-muted/20 dark:border-border/20">
						<div className="flex items-center text-xs text-muted-foreground font-medium">
							<IndianRupeeIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
							Package
						</div>
						<div className="text-sm font-bold text-foreground truncate">
							{formatPackage(job)}
						</div>
					</div>

					<div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/40 border border-border/30 group-hover:bg-muted/60 transition-colors dark:bg-muted/20 dark:border-border/20">
						<div className="flex items-center text-xs text-muted-foreground font-medium">
							<MapPinIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
							Location
						</div>
						<div className="text-sm font-bold text-foreground truncate">
							{job.location}
						</div>
					</div>

					<div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/40 border border-border/30 group-hover:bg-muted/60 transition-colors dark:bg-muted/20 dark:border-border/20">
						<div className="flex items-center text-xs text-muted-foreground font-medium">
							<UsersIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
							CGPA
						</div>
						<div className="text-sm font-bold text-foreground truncate">
							{(() => {
								const ugMark = job.eligibility_marks.find(
									(m) => m.level.toLowerCase() === "ug",
								);
								return ugMark?.criteria
									? `${ugMark.criteria.toFixed(1)}+`
									: "N/A";
							})()}
						</div>
					</div>

					<div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/40 border border-border/30 group-hover:bg-muted/60 transition-colors dark:bg-muted/20 dark:border-border/20">
						<div className="flex items-center text-xs text-muted-foreground font-medium">
							<ClockIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
							Deadline
						</div>
						<div className="text-sm font-bold text-foreground truncate">
							{job.deadline ? formatDate(job.deadline) : "N/A"}
						</div>
					</div>
				</div>

				{/* Footer / Action */}
				<div className="pt-2 flex items-center justify-between border-t border-border/40">
					<span className="text-xs font-medium text-muted-foreground">
						Posted {formatDateTime(job.createdAt).split("at")[0]}
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 pr-0 font-semibold text-primary hover:text-primary/80 hover:bg-transparent p-0"
						disabled={isPending}
					>
						{isPending ? (
							<Loader2Icon className="w-4 h-4 animate-spin" />
						) : (
							<>
								View Details
								<ArrowRightIcon className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
							</>
						)}
					</Button>
				</div>
			</div>
		</Card>
	);
}
