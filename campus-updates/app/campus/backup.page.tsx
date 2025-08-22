"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ExternalLinkIcon,
	CalendarIcon,
	UsersIcon,
	GlobeIcon,
	CompassIcon,
} from "lucide-react";

interface Society {
	id: string;
	name: string;
	description: string;
	website: string;
	category: string;
}

const categoryColors = {
	Technical: {
		backgroundColor: "var(--primary-color)",
		color: "var(--accent-color)",
		borderColor: "var(--border-color)",
	},
	Cultural: {
		backgroundColor: "var(--primary-color)",
		color: "var(--accent-color)",
		borderColor: "var(--border-color)",
	},
	Sports: {
		backgroundColor: "var(--primary-color)",
		color: "var(--accent-color)",
		borderColor: "var(--border-color)",
	},
	Business: {
		backgroundColor: "var(--primary-color)",
		color: "var(--accent-color)",
		borderColor: "var(--border-color)",
	},
	Literary: {
		backgroundColor: "var(--primary-color)",
		color: "var(--accent-color)",
		borderColor: "var(--border-color)",
	},
};

export default function CampusPage() {
	const [societies, setSocieties] = useState<Society[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/data/societies.json")
			.then((res) => res.json())
			.then((data) => {
				setSocieties(data);
				setLoading(false);
			});
	}, []);

	if (loading) {
		return (
			<Layout>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<Card key={i} className="animate-pulse card-theme">
							<CardHeader>
								<div
									className="h-6 rounded w-3/4 mb-2"
									style={{ backgroundColor: "var(--primary-color)" }}
								></div>
								<div
									className="h-4 rounded w-1/2"
									style={{ backgroundColor: "var(--primary-color)" }}
								></div>
							</CardHeader>
							<CardContent>
								<div
									className="h-4 rounded w-full mb-2"
									style={{ backgroundColor: "var(--primary-color)" }}
								></div>
								<div
									className="h-4 rounded w-2/3"
									style={{ backgroundColor: "var(--primary-color)" }}
								></div>
							</CardContent>
						</Card>
					))}
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="max-w-7xl mx-auto space-y-8">
				<div className="text-center mb-8">
					<h1
						className="text-2xl lg:text-3xl font-bold mb-2"
						style={{ color: "var(--text-color)" }}
					>
						Campus Life
					</h1>
					<p style={{ color: "var(--label-color)" }}>
						Explore student societies and campus events
					</p>
				</div>

				{/* Coming Soon Banner */}
				<Card
					className="border card-theme"
					style={{
						backgroundColor: "var(--primary-color)",
						borderColor: "var(--border-color)",
					}}
				>
					<CardContent className="p-8 text-center">
						<CalendarIcon
							className="w-12 h-12 mx-auto mb-4"
							style={{ color: "var(--accent-color)" }}
						/>
						<h2
							className="text-2xl font-bold mb-2"
							style={{ color: "var(--text-color)" }}
						>
							Campus Events Coming Soon!
						</h2>
						<p className="mb-4" style={{ color: "var(--label-color)" }}>
							We're working on bringing you the latest updates about campus
							events, workshops, seminars, and activities from all student
							societies.
						</p>
						<Badge
							className="px-4 py-2"
							style={{
								backgroundColor: "var(--card-bg)",
								color: "var(--accent-color)",
								borderColor: "var(--border-color)",
							}}
						>
							<CompassIcon className="w-4 h-4 mr-1" />
							Feature in Development
						</Badge>
					</CardContent>
				</Card>

				{/* Student Societies */}
				<div>
					<div className="flex items-center mb-6">
						<UsersIcon
							className="w-6 h-6 mr-2"
							style={{ color: "var(--accent-color)" }}
						/>
						<h2
							className="text-xl font-bold"
							style={{ color: "var(--text-color)" }}
						>
							Student Societies
						</h2>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{societies.map((society) => (
							<Card
								key={society.id}
								className="hover:shadow-md transition-all duration-300 card-theme"
								style={{
									backgroundColor: "var(--card-bg)",
									borderColor: "var(--border-color)",
									color: "var(--text-color)",
								}}
							>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<CardTitle
												className="text-lg font-semibold mb-2"
												style={{ color: "var(--text-color)" }}
											>
												{society.name}
											</CardTitle>
											<Badge
												variant="outline"
												style={
													categoryColors[
														society.category as keyof typeof categoryColors
													] || {
														backgroundColor: "var(--primary-color)",
														color: "var(--text-color)",
														borderColor: "var(--border-color)",
													}
												}
											>
												{society.category}
											</Badge>
										</div>
									</div>
								</CardHeader>

								<CardContent className="space-y-4">
									<p
										className="text-sm leading-relaxed"
										style={{ color: "var(--text-color)" }}
									>
										{society.description}
									</p>

									<div className="pt-2">
										<Button
											variant="outline"
											size="sm"
											className="w-full hover-theme"
											style={{
												backgroundColor: "var(--card-bg)",
												borderColor: "var(--border-color)",
												color: "var(--accent-color)",
											}}
											onClick={() => window.open(society.website, "_blank")}
										>
											<GlobeIcon className="w-4 h-4 mr-2" />
											Visit Website
											<ExternalLinkIcon className="w-3 h-3 ml-1" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* Future Features Preview */}
				<Card
					className="border-dashed border-2"
					style={{
						borderColor: "var(--border-color)",
						backgroundColor: "var(--card-bg)",
					}}
				>
					<CardContent className="p-8 text-center">
						<h3
							className="text-lg font-semibold mb-3"
							style={{ color: "var(--text-color)" }}
						>
							Coming Features
						</h3>
						<div className="grid md:grid-cols-3 gap-4 text-sm">
							<div
								className="p-4 rounded-lg"
								style={{ backgroundColor: "var(--primary-color)" }}
							>
								<CalendarIcon
									className="w-6 h-6 mx-auto mb-2"
									style={{ color: "var(--accent-color)" }}
								/>
								<p
									className="font-medium"
									style={{ color: "var(--text-color)" }}
								>
									Event Calendar
								</p>
								<p
									className="text-xs mt-1"
									style={{ color: "var(--label-color)" }}
								>
									Society events & activities
								</p>
							</div>
							<div
								className="p-4 rounded-lg"
								style={{ backgroundColor: "var(--primary-color)" }}
							>
								<UsersIcon
									className="w-6 h-6 mx-auto mb-2"
									style={{ color: "var(--accent-color)" }}
								/>
								<p
									className="font-medium"
									style={{ color: "var(--text-color)" }}
								>
									Society Updates
								</p>
								<p
									className="text-xs mt-1"
									style={{ color: "var(--label-color)" }}
								>
									Latest news & announcements
								</p>
							</div>
							<div
								className="p-4 rounded-lg"
								style={{ backgroundColor: "var(--primary-color)" }}
							>
								<GlobeIcon
									className="w-6 h-6 mx-auto mb-2"
									style={{ color: "var(--accent-color)" }}
								/>
								<p
									className="font-medium"
									style={{ color: "var(--text-color)" }}
								>
									Event Registration
								</p>
								<p
									className="text-xs mt-1"
									style={{ color: "var(--label-color)" }}
								>
									Register for events online
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
}
