import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, Share } from "lucide-react";

export default function Loading() {
	return (
		<div className="max-w-4xl mx-auto p-4">
			{/* Back and Share buttons skeleton */}
			<div className="flex gap-3 mb-6">
				<Button
					variant="outline"
					disabled
					className="bg-background border-border"
				>
					<ArrowLeftIcon className="w-4 h-4 mr-2" />
					Back
				</Button>
				<Button
					variant="outline"
					disabled
					className="bg-background border-border"
				>
					<Share className="w-4 h-4 mr-2" />
					Share
				</Button>
			</div>

			{/* Header Section */}
			<div className="mb-8">
				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
					<div className="flex-1 space-y-3">
						<Skeleton className="h-8 w-3/4 max-w-md bg-muted" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-5 w-5 rounded-full bg-muted" />
							<Skeleton className="h-6 w-40 bg-muted" />
						</div>
					</div>
					<div className="flex flex-col sm:items-end gap-2">
						<Skeleton className="h-6 w-24 rounded-full bg-muted" />
						<div className="flex items-center gap-2 mt-2">
							<Skeleton className="h-4 w-4 bg-muted" />
							<Skeleton className="h-4 w-32 bg-muted" />
						</div>
					</div>
				</div>
			</div>

			{/* Key Details Grid (Package, Location, Deadline) */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				{[1, 2, 3].map((i) => (
					<Card key={i} className="card-theme bg-card border-border">
						<CardContent className="p-6 space-y-3">
							<div className="flex justify-between items-center">
								<Skeleton className="h-4 w-16 bg-muted" />
								<Skeleton className="h-5 w-5 bg-muted" />
							</div>
							<Skeleton className="h-8 w-32 bg-muted" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Job Description Skeleton */}
			<Card className="mb-6 card-theme bg-card border-border">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5 bg-muted" />
						<Skeleton className="h-6 w-40 bg-muted" />
					</div>
				</CardHeader>
				<CardContent className="space-y-2">
					<Skeleton className="h-4 w-full bg-muted" />
					<Skeleton className="h-4 w-full bg-muted" />
					<Skeleton className="h-4 w-3/4 bg-muted" />
					<Skeleton className="h-4 w-full bg-muted" />
					<Skeleton className="h-4 w-5/6 bg-muted" />
				</CardContent>
			</Card>

			{/* Documents Skeleton (Optional placeholder) */}
			<Card className="mb-6 card-theme bg-card border-border">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5 bg-muted" />
						<Skeleton className="h-6 w-48 bg-muted" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="border rounded-lg p-4 bg-primary/5 border-border flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded bg-muted" />
						<div className="space-y-2 flex-1">
							<Skeleton className="h-4 w-40 bg-muted" />
							<Skeleton className="h-3 w-24 bg-muted" />
						</div>
						<div className="flex gap-2">
							<Skeleton className="h-9 w-20 bg-muted" />
							<Skeleton className="h-9 w-24 bg-muted" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Eligibility Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				{/* Eligibility Marks */}
				<Card className="card-theme bg-card border-border">
					<CardHeader>
						<Skeleton className="h-6 w-32 bg-muted" />
					</CardHeader>
					<CardContent className="space-y-3">
						{[1, 2].map((i) => (
							<div
								key={i}
								className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-border"
							>
								<Skeleton className="h-5 w-10 bg-muted" />
								<Skeleton className="h-6 w-24 bg-muted" />
							</div>
						))}
					</CardContent>
				</Card>

				{/* Eligible Courses */}
				<Card className="card-theme bg-card border-border">
					<CardHeader>
						<Skeleton className="h-6 w-32 bg-muted" />
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{[1, 2, 3, 4, 5].map((i) => (
								<Skeleton key={i} className="h-8 w-24 rounded-full bg-muted" />
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Hiring Process Skeleton */}
			<Card className="mb-6 card-theme bg-card border-border">
				<CardHeader>
					<Skeleton className="h-6 w-36 bg-muted" />
				</CardHeader>
				<CardContent className="space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex items-center gap-4">
							<Skeleton className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
							<Skeleton className="h-5 w-full bg-muted" />
						</div>
					))}
				</CardContent>
			</Card>

			{/* Additional Info Skeleton */}
			<Card className="card-theme bg-card border-border">
				<CardHeader>
					<Skeleton className="h-6 w-48 bg-muted" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Skeleton className="h-5 w-32 bg-muted" />
							<div className="flex gap-2">
								<Skeleton className="h-6 w-16 rounded-full bg-muted" />
								<Skeleton className="h-6 w-16 rounded-full bg-muted" />
							</div>
						</div>
						<div className="space-y-2">
							<Skeleton className="h-5 w-32 bg-muted" />
							<Skeleton className="h-6 w-24 rounded-full bg-muted" />
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
