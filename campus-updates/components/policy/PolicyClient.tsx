"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { Policy } from "@/lib/policy";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Map } from "lucide-react";

interface PolicyClientProps {
	initialSlug?: string;
}

export default function PolicyClient({
	initialSlug = "placement-policy-2026",
}: PolicyClientProps) {
	const [policy, setPolicy] = useState<Policy | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Simple in-memory cache for this session
	const policyCache = useRef<Record<string, Policy>>({});

	const contentRef = useRef<HTMLDivElement | null>(null);
	const [progress, setProgress] = useState(0);
	const [activeId, setActiveId] = useState<string>("");

	const [headings, setHeadings] = useState<
		Array<{
			id: string;
			title: string;
			sub: Array<{ id: string; title: string }>;
		}>
	>([]);

	const [currentSlug, setCurrentSlug] = useState(initialSlug);
	const [showFlowchart, setShowFlowchart] = useState(false);

	useEffect(() => {
		const fetchPolicy = async () => {
			// Check cache first
			if (policyCache.current[currentSlug]) {
				setPolicy(policyCache.current[currentSlug]);
				setLoading(false);
				setError(null);
				return;
			}

			try {
				setLoading(true);
				const res = await fetch(`/api/policies/${currentSlug}`);
				if (!res.ok) {
					throw new Error("Failed to fetch policy");
				}
				const data = await res.json();
				if (data.ok && data.policy) {
					// Update cache
					policyCache.current[currentSlug] = data.policy;
					setPolicy(data.policy);
					setError(null);
				} else {
					setError("Policy not found");
				}
			} catch (err) {
				console.error(err);
				setError("Error loading policy");
			} finally {
				setLoading(false);
			}
		};

		fetchPolicy();
	}, [currentSlug]);

	// Generate TOC from DOM to ensure IDs match exactly what rehype-slug generated
	useEffect(() => {
		if (!policy || loading) return;

		// Small timeout to ensure ReactMarkdown has rendered
		const timer = setTimeout(() => {
			const el = contentRef.current;
			if (!el) return;

			const nodes = el.querySelectorAll("h2, h3");
			const newHeadings: Array<{
				id: string;
				title: string;
				sub: Array<{ id: string; title: string }>;
			}> = [];
			let currentH2: (typeof newHeadings)[0] | null = null;

			nodes.forEach((node) => {
				const id = node.id;
				const title = node.textContent || "";

				if (node.tagName.toLowerCase() === "h2") {
					currentH2 = { id, title, sub: [] };
					newHeadings.push(currentH2);
				} else if (node.tagName.toLowerCase() === "h3" && currentH2) {
					currentH2.sub.push({ id, title });
				}
			});

			setHeadings(newHeadings);
		}, 100);

		return () => clearTimeout(timer);
	}, [policy, loading]);

	useEffect(() => {
		const onScroll = () => {
			const el = contentRef.current;
			if (!el) return;

			const total = el.scrollHeight - window.innerHeight;
			const scrolled = Math.min(
				Math.max(window.scrollY - el.offsetTop, 0),
				total,
			);
			const pct = total > 0 ? (scrolled / total) * 100 : 0;
			setProgress(pct);
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		// Trigger once
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, [policy, headings]); // Re-bind if policy/headings change

	// Scroll Spy
	useEffect(() => {
		if (!policy) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
				if (visible[0]) setActiveId(visible[0].target.id);
			},
			{ rootMargin: "-10% 0px -80% 0px", threshold: [0, 0.1] },
		);

		// We observe all headings that exist in the DOM
		const el = contentRef.current;
		if (el) {
			const nodes = el.querySelectorAll("h2[id], h3[id]");
			nodes.forEach((n) => observer.observe(n));
		}
		return () => observer.disconnect();
	}, [policy, headings]);

	return (
		<div className="space-y-6 animate-in fade-in duration-500">
			{/* Tabs are always visible */}
			<div className="flex flex-col gap-4">
				<Tabs
					value={currentSlug}
					onValueChange={setCurrentSlug}
					className="w-full"
				>
					<TabsList className="w-full h-auto p-1 bg-muted border border-border/50 rounded-xl grid grid-cols-2 mb-6">
						<TabsTrigger
							value="placement-policy-2026"
							className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:font-bold rounded-lg px-3 py-2.5 text-sm transition-all text-muted-foreground hover:text-foreground"
						>
							2026 Batch
						</TabsTrigger>
						<TabsTrigger
							value="jaypee-universities-placement-policy-2027-graduating-batches--engineering-and-mca-2027"
							className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:font-bold rounded-lg px-3 py-2.5 text-sm transition-all text-muted-foreground hover:text-foreground"
						>
							2027 Batch
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				<div className="lg:col-span-9">
					<Card className="card-theme border-none shadow-md bg-card/50 backdrop-blur-sm min-h-[60vh]">
						{loading ? (
							<div className="p-8 space-y-8">
								<div className="space-y-4">
									<Skeleton className="h-4 w-24 rounded" />
									<Skeleton className="h-10 w-3/4 rounded-lg" />
									<div className="flex gap-2 pt-2">
										<Skeleton className="h-5 w-24 rounded-full" />
										<Skeleton className="h-5 w-24 rounded-full" />
									</div>
								</div>
								<div className="space-y-4 pt-4">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-5/6" />
								</div>
								<div className="space-y-6 pt-6">
									<Skeleton className="h-8 w-1/3" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-4/5" />
									</div>
								</div>
							</div>
						) : error ? (
							<div className="flex flex-col items-center justify-center py-20 space-y-4">
								<div className="text-red-500 font-medium">
									{error || "Policy not found"}
								</div>
								<Button
									variant="outline"
									onClick={() => window.location.reload()}
								>
									Retry
								</Button>
							</div>
						) : policy ? (
							<>
								<CardHeader className="pb-4 border-b border-border/40">
									<CardTitle>
										<h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
											<span className="block text-sm font-semibold uppercase text-muted-foreground mb-2">
												{policy.badge}
											</span>
											<span className="inline-block text-foreground bg-clip-text">
												{policy.title}
											</span>
										</h1>
									</CardTitle>
									<div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
										<div
											className="h-2 w-2 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
											aria-hidden
										/>
										<div className="flex gap-2">
											{policy.updatedDates.map((d, i) => (
												<Badge
													key={i}
													variant="secondary"
													className="text-xs font-normal"
												>
													Updated:{" "}
													{new Date(d).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric",
													})}
												</Badge>
											))}
										</div>
									</div>
								</CardHeader>
								<CardContent
									ref={contentRef}
									className="prose prose-sm sm:prose-base dark:prose-invert max-w-none pt-8 pb-8 px-4 sm:px-8"
									style={{
										scrollBehavior: "smooth",
									}}
								>
									<style jsx global>{`
										.prose {
											font-family: var(--font-sans);
										}
										.prose h2 {
											margin-top: 2.5rem;
											margin-bottom: 1.25rem;
											font-weight: 800;
											font-size: 1.65rem;
											line-height: 1.35;
											letter-spacing: -0.02em;
											padding-bottom: 0.5rem;
											border-bottom: 2px solid var(--border);
											scroll-margin-top: 6rem;
											color: var(--foreground);
										}
										.prose h3 {
											margin-top: 2rem;
											margin-bottom: 1rem;
											font-size: 1.35rem;
											font-weight: 700;
											line-height: 1.4;
											color: var(--primary);
											scroll-margin-top: 6rem;
										}
										.prose p {
											margin-top: 0.75rem;
											margin-bottom: 0.75rem;
											line-height: 1.8;
											color: var(--foreground/90);
										}
										.prose ul {
											margin-top: 0.75rem;
											margin-bottom: 0.75rem;
											list-style-type: disc;
											padding-left: 1.5rem;
										}
										.prose li {
											margin-top: 0.5rem;
											margin-bottom: 0.5rem;
											line-height: 1.7;
											color: var(--foreground/85);
										}
										.prose strong {
											font-weight: 600;
											color: var(--foreground);
										}
										.prose table {
											width: 100%;
											border-collapse: separate;
											border-spacing: 0;
											margin-top: 2rem;
											margin-bottom: 2rem;
											border-radius: 0.5rem;
											overflow: hidden;
											border: 1px solid var(--border);
										}
										.prose thead {
											background-color: var(--muted);
										}
										.prose th {
											padding: 1rem;
											text-align: left;
											font-weight: 600;
											color: var(--foreground);
											border-bottom: 1px solid var(--border);
										}
										.prose td {
											padding: 1rem;
											border-bottom: 1px solid var(--border);
											background-color: var(--card);
										}
										.prose tr:last-child td {
											border-bottom: none;
										}
										.prose tr:hover td {
											background-color: var(--muted/50);
										}
										.prose .overflow-x-auto {
											margin-top: 1rem;
											margin-bottom: 1rem;
											border-radius: 0.5rem;
											box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
										}
									`}</style>

									<ReactMarkdown
										remarkPlugins={[remarkGfm]}
										rehypePlugins={[rehypeRaw, rehypeSlug]}
										components={{
											table: ({ node, ...props }) => (
												<div className="overflow-x-auto my-6">
													<table {...props} className="min-w-full" />
												</div>
											),
										}}
									>
										{policy.content}
									</ReactMarkdown>
								</CardContent>
							</>
						) : null}
					</Card>
				</div>

				<aside className="lg:col-span-3 hidden lg:block">
					<Card className="card-theme sticky top-24 border-none shadow-md bg-card/80 backdrop-blur-md">
						<CardHeader className="pb-3 border-b border-border/40">
							<CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
								On this page
								<span className="text-xs font-normal opacity-70">
									{Math.round(progress)}%
								</span>
							</CardTitle>
							<div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
								<div
									className="h-full rounded-full transition-all duration-300 ease-out bg-primary"
									style={{
										width: `${Math.min(100, Math.max(0, progress))}%`,
									}}
								/>
							</div>
						</CardHeader>
						<CardContent className="pt-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
							{loading ? (
								<div className="space-y-4">
									{[1, 2, 3, 4, 5].map((i) => (
										<div key={i} className="space-y-2">
											<Skeleton className="h-4 w-3/4" />
											<div className="pl-4 space-y-1">
												<Skeleton className="h-3 w-full" />
												<Skeleton className="h-3 w-5/6" />
											</div>
										</div>
									))}
								</div>
							) : (
								<nav className="relative flex flex-col gap-1 pl-2">
									<div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
									{headings.map((h) => {
										const parentActive =
											activeId === h.id ||
											(h.sub || []).some((s) => activeId === s.id);
										return (
											<div key={h.id} className="relative py-1">
												<div
													className={`absolute left-0 top-[1.125rem] w-[22px] h-px transition-colors duration-300 ${parentActive ? "bg-primary" : "bg-transparent"}`}
												></div>
												<a
													href={`#${h.id}`}
													onClick={(e) => {
														e.preventDefault();
														document
															.getElementById(h.id)
															?.scrollIntoView({ behavior: "smooth" });
														window.history.pushState(null, "", `#${h.id}`);
													}}
													className={`block text-xs font-semibold pl-8 pr-2 py-1.5 rounded-md transition-all duration-200 ${
														parentActive
															? "text-primary bg-primary/5 translate-x-1"
															: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
													}`}
												>
													{h.title}
												</a>

												{h.sub.length > 0 && (
													<div
														className={`mt-1 ml-6 space-y-1 overflow-hidden transition-all duration-300 ${parentActive ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
													>
														{h.sub.map((s) => {
															const isActive = activeId === s.id;
															return (
																<a
																	key={s.id}
																	href={`#${s.id}`}
																	onClick={(e) => {
																		e.preventDefault();
																		document
																			.getElementById(s.id)
																			?.scrollIntoView({ behavior: "smooth" });
																		window.history.pushState(
																			null,
																			"",
																			`#${s.id}`,
																		);
																	}}
																	className={`block text-[11px] pl-4 py-1 border-l-2 transition-colors ${
																		isActive
																			? "border-primary text-primary font-medium"
																			: "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
																	}`}
																>
																	{s.title}
																</a>
															);
														})}
													</div>
												)}
											</div>
										);
									})}
								</nav>
							)}
						</CardContent>
					</Card>

					{policy && policy.flowchart && (
						<div className="fixed bottom-10 right-10 z-50">
							<Button
								onClick={() => setShowFlowchart(true)}
								className="gap-2 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 px-8 rounded-full"
							>
								<Map className="h-5 w-5" />
								View Process Flowchart
							</Button>
						</div>
					)}
				</aside>
			</div>

			{policy && policy.flowchart && (
				<>
					<Button
						className="lg:hidden fixed bottom-24 right-6 z-50 rounded-2xl shadow-lg h-14 w-14 p-0 bg-primary hover:bg-primary/90 text-primary-foreground border-transparent"
						onClick={() => setShowFlowchart(true)}
					>
						<Map className="h-6 w-6" />
						<span className="sr-only">View Flowchart</span>
					</Button>

					<Dialog open={showFlowchart} onOpenChange={setShowFlowchart}>
						<DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6">
							<DialogHeader className="mb-2">
								<DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
									<Map className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
									Placement Policy Process Flow
								</DialogTitle>
							</DialogHeader>
							<div className="mt-2 rounded-xl overflow-hidden border border-border bg-muted/20 shadow-inner">
								<img
									src={policy.flowchart}
									alt="Policy Flowchart"
									className="w-full h-auto"
								/>
							</div>
						</DialogContent>
					</Dialog>
				</>
			)}
		</div>
	);
}
