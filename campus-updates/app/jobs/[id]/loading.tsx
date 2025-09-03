import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
	return (
		<div className="max-w-4xl mx-auto p-4">
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
		</div>
	);
}
