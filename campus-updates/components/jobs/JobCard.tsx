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
			className="hover:shadow-xl transition-all duration-300 border card-theme cursor-pointer"
			style={{
				backgroundColor: "var(--card-bg)",
				borderColor: "var(--border-color)",
				color: "var(--text-color)",
				opacity: isPending ? 0.7 : 1,
				pointerEvents: isPending ? "none" : "auto",
			}}
			role="button"
			tabIndex={0}
			onClick={() => onQuickView(job)}
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
							{categoryMapping[job.placement_category_code] ||
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
							{job.eligibility_courses.slice(0, 3).map((course, idx) => (
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
							{formatPackage(job)}
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
							onQuickView(job);
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
