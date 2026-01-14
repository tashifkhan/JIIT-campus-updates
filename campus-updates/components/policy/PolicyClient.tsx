"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PolicyClient({
	children,
}: {
	children: React.ReactNode;
}) {
	const contentRef = useRef<HTMLDivElement | null>(null);
	const [progress, setProgress] = useState(0);
	const [activeId, setActiveId] = useState<string>("");

	const headings = useMemo<
		Array<{
			id: string;
			title: string;
			sub: Array<{ id: string; title: string }>;
		}>
	>(() => {
		return [
			{
				id: "general-placement-drive-rules",
				title: "I. General Placement Drive Rules",
				sub: [
					// {
					// 	id: "eligibility-and-registration",
					// 	title: "Eligibility & Registration",
					// },
					// { id: "pre-placement-procedures", title: "Pre-Placement Procedures" },
					// { id: "attendance-and-conduct", title: "Attendance & Conduct" },
				],
			},
			{
				id: "internship-policy",
				title: "II. Internship Policy and its Impact on Placements",
				sub: [
					// {
					// 	id: "internship-definition",
					// 	title: "Internship — definition & Duration",
					// },
					// { id: "effect-on-placements", title: "Effect on Final Placements" },
				],
			},
			{
				id: "package-level-and-offer-management",
				title: "III. Package Level and Offer Management",
				sub: [
					// { id: "package-band-definitions", title: "Package band definitions" },
					// { id: "offer-acceptance", title: "Offer acceptance & rescinding" },
					// { id: "conflict-resolution", title: "Conflict resolution" },
				],
			},
			{
				id: "provisions-jan-2026",
				title: "IV. Provisions from January 1, 2026",
				sub: [
					// { id: "new-clauses", title: "New clauses overview" },
					// { id: "transition-rules", title: "Transition rules" },
				],
			},
			{
				id: "modes-of-joining",
				title: "V. Modes of Joining the Company",
				sub: [
					// { id: "direct-joining", title: "Direct Joining" },
					// { id: "bonded-joining", title: "Bonded / Training-to-join" },
				],
			},
			{
				id: "business-development-roles",
				title: "VI. Business Development Roles",
				sub: [
					// { id: "bd-definitions", title: "BD — role definitions" },
					// { id: "bd-offer-terms", title: "Offer terms for BD" },
				],
			},
			{
				id: "off-campus-offers",
				title: "VII. Off-Campus Offers",
				sub: [
					// { id: "off-campus-eligibility", title: "Eligibility & notification" },
					// { id: "accepting-off-campus", title: "Accepting off-campus offers" },
				],
			},
			{
				id: "miscellaneous",
				title: "VIII. Miscellaneous",
				sub: [
					// { id: "data-privacy", title: "Data & privacy" },
					// { id: "definitions", title: "Definitions & glossary" },
				],
			},
			{
				id: "key-takeaways",
				title: "Key Takeaways and Potential Questions",
				sub: [
					// { id: "faq", title: "FAQ" },
					// { id: "contact", title: "Contact & escalation" },
				],
			},
		];
	}, []);

	useEffect(() => {
		const onScroll = () => {
			const el = contentRef.current;
			if (!el) return;
			const total = el.scrollHeight - window.innerHeight;
			const scrolled = Math.min(
				Math.max(window.scrollY - el.offsetTop, 0),
				total
			);
			const pct = total > 0 ? (scrolled / total) * 100 : 0;
			setProgress(pct);
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
				if (visible[0]) setActiveId(visible[0].target.id);
			},
			{ rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
		);
		const el = contentRef.current;
		if (el) {
			const nodes = el.querySelectorAll("h2[id]");
			nodes.forEach((n) => observer.observe(n));
		}
		return () => observer.disconnect();
	}, []);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Link href="/">
					<Button variant="outline" className="h-10 px-4">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Home
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				<div className="lg:col-span-9">
					<Card className="card-theme">
						<CardHeader className="pb-4">
							<CardTitle>
								<h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
									<span className="block text-sm font-semibold uppercase text-muted-foreground">
										Placement Policy 2026
									</span>
									<span className="mt-1 inline-block text-primary">
										Jaypee Universities Placement Policy (2026 Graduating
										Batches)
									</span>
								</h1>
							</CardTitle>
							<div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
								<div
									className="h-2 w-2 rounded-full bg-primary/60"
									aria-hidden
								/>
								<Badge variant="secondary" className="text-xs">
									Updated: Feb 8, Apr 13, Aug 8, 2025
								</Badge>
							</div>
						</CardHeader>
						<CardContent
							ref={contentRef}
							className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
							style={{
								scrollBehavior: "smooth",
							}}
						>
							<style jsx global>{`
								.prose {
									font-family: var(--font-sans);
								}
								.prose h2 {
									margin-top: 2rem;
									margin-bottom: 1rem;
									font-weight: 700;
									font-size: 1.5rem;
									line-height: 1.35;
									letter-spacing: -0.01em;
									padding-bottom: 0.35rem;
									border-bottom: 2px solid var(--border);
									scroll-margin-top: 6rem;
								}
								.prose h3 {
									margin-top: 1.5rem;
									margin-bottom: 0.75rem;
									font-size: 1.25rem;
									font-weight: 600;
									line-height: 1.4;
									color: var(--primary);
								}
								.prose p {
									margin-top: 0.75rem;
									margin-bottom: 0.75rem;
									line-height: 1.75;
									text-align: justify;
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
									line-height: 1.6;
								}
								.prose strong {
									font-weight: 600;
								}
								.prose em {
									font-style: italic;
								}
								.prose table {
									width: 100%;
									border-collapse: collapse;
									margin-top: 1.5rem;
									margin-bottom: 1.5rem;
									border: 1px solid var(--border);
								}
								.prose thead {
									/* stronger header background so text remains readable in dark mode */
									background-color: var(--secondary);
								}
								.prose th {
									padding: 0.85rem 0.9rem;
									text-align: left;
									font-weight: 700;
									border: 1px solid var(--border);
									color: var(--foreground);
									background-color: var(--secondary);
									position: sticky;
									top: 0;
									z-index: 30;
									backdrop-filter: blur(4px);
									-webkit-backdrop-filter: blur(4px);
									box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.08);
								}
								.prose td {
									padding: 0.75rem;
									border: 1px solid var(--border);
									vertical-align: top;
								}
								.prose tr:hover {
									background-color: var(--muted);
								}
								.prose .overflow-x-auto {
									margin-top: 1rem;
									margin-bottom: 1rem;
								}
							`}</style>
							{children}
						</CardContent>
					</Card>
				</div>
				<aside className="lg:col-span-3 hidden lg:block">
					<Card className="card-theme sticky top-6">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
								On this page
							</CardTitle>
							<div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
								<div
									className="h-full rounded-full transition-[width] duration-300 ease-out bg-primary"
									style={{
										width: `${Math.min(100, Math.max(0, progress))}%`,
									}}
								/>
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="max-h-[70vh] overflow-y-auto pr-2 pb-2">
								<nav className="relative flex flex-col gap-3 pl-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-px before:bg-muted/40">
									{headings.map((h) => {
										const parentActive =
											activeId === h.id ||
											(h.sub || []).some((s) => activeId === s.id);
										return (
											<div key={h.id} className="flex flex-col gap-2">
												<a
													href={`#${h.id}`}
													className={`text-xs font-semibold pl-1 transition-colors duration-150 ${
														parentActive
															? "text-primary"
															: "text-muted-foreground hover:text-foreground"
													}`}
												>
													{h.title}
												</a>
												<div className="flex flex-col gap-2 pl-4">
													{(h.sub.length > 0 ? h.sub : []).map((s) => {
														const isActive = activeId === s.id;
														return (
															<a
																key={s.id}
																href={`#${s.id}`}
																className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors duration-150 ${
																	isActive
																		? "bg-primary/10 text-primary font-medium border border-primary/20"
																		: "bg-transparent text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground"
																}`}
																style={{
																	paddingLeft: 8,
																	paddingRight: 8,
																}}
															>
																<span
																	className="h-2 w-2 rounded-sm bg-current opacity-80"
																	aria-hidden
																/>
																{s.title}
															</a>
														);
													})}
												</div>
											</div>
										);
									})}
								</nav>
							</div>
						</CardContent>
					</Card>
				</aside>
			</div>
		</div>
	);
}
