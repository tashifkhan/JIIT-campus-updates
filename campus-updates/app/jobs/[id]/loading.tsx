import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
	return (
		<div className="max-w-4xl mx-auto p-4">
			{/* Loading header section */}
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-6">
					<div
						className="w-20 h-8 rounded-md animate-pulse"
						style={{ backgroundColor: "var(--primary-color)" }}
					/>
					<div
						className="w-20 h-8 rounded-md animate-pulse"
						style={{ backgroundColor: "var(--primary-color)" }}
					/>
				</div>

				<div className="space-y-4">
					<div
						className="h-8 w-3/4 rounded-md animate-pulse"
						style={{ backgroundColor: "var(--primary-color)" }}
					/>
					<div
						className="h-6 w-1/2 rounded-md animate-pulse"
						style={{ backgroundColor: "var(--primary-color)" }}
					/>
				</div>
			</div>

			{/* Loading cards grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				{[1, 2, 3].map((i) => (
					<Card
						key={i}
						className="card-theme animate-pulse"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardContent className="p-6">
							<div
								className="h-4 w-16 mb-2 rounded animate-pulse"
								style={{ backgroundColor: "var(--primary-color)" }}
							/>
							<div
								className="h-6 w-24 rounded animate-pulse"
								style={{ backgroundColor: "var(--primary-color)" }}
							/>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Main content loading */}
			<Card
				className="mb-6 card-theme"
				style={{
					backgroundColor: "var(--card-bg)",
					borderColor: "var(--border-color)",
				}}
			>
				<CardContent className="p-6">
					<div className="flex items-center justify-center py-12">
						<div className="flex flex-col items-center gap-6">
							{/* Custom themed spinner */}
							<div className="relative">
								<div
									className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
									style={{
										borderColor: "var(--border-color)",
										borderTopColor: "transparent",
									}}
								/>
								<div
									className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-current animate-spin"
									style={{
										color: "var(--accent-color)",
										animationDuration: "1.5s",
										animationDirection: "reverse",
									}}
								/>
							</div>

							<div className="text-center space-y-2">
								<p
									className="text-base font-medium"
									style={{ color: "var(--text-color)" }}
								>
									Loading job details...
								</p>
								<p className="text-sm" style={{ color: "var(--label-color)" }}>
									Please wait while we fetch the information
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Additional loading cards */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{[1, 2].map((i) => (
					<Card
						key={i}
						className="card-theme animate-pulse"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<CardContent className="p-6">
							<div
								className="h-5 w-32 mb-4 rounded animate-pulse"
								style={{ backgroundColor: "var(--primary-color)" }}
							/>
							<div className="space-y-2">
								<div
									className="h-4 w-full rounded animate-pulse"
									style={{ backgroundColor: "var(--primary-color)" }}
								/>
								<div
									className="h-4 w-3/4 rounded animate-pulse"
									style={{ backgroundColor: "var(--primary-color)" }}
								/>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
