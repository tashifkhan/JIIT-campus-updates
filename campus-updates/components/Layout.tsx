"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import ThemeSwitcher from "./ThemeSwitcher";
import YearSelector from "./YearSelector";

import { Bell, ArrowRight } from "lucide-react";

import { MenuBar } from "./animated-menu-bar";

export default function Layout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const navigation = [
		{ name: "Home", href: "/", icon: "/icons/home.png" },
		{ name: "Policy", href: "/policy", icon: "/icons/book.png" },
		{ name: "Jobs", href: "/jobs", icon: "/icons/briefcase.png" },
		{ name: "Stats", href: "/stats", icon: "/icons/diagram.png" },
	];
	const isNavigationItemActive = (href: string) =>
		pathname === href ||
		(href !== "/" && pathname.startsWith(`${href}/`));

	// Check if we are on a detail page (job details, branch stats, company stats)
	// These pages handle their own layout/containers and have sticky headers that need to be full width
	const isDetailPage =
		(pathname.startsWith("/jobs/") && pathname !== "/jobs") ||
		pathname.startsWith("/stats/branch/") ||
		pathname.startsWith("/stats/company/");

	return (
		<div className="min-h-screen lg:min-h-0 lg:h-screen lg:overflow-hidden bg-background">
			{/* Mobile Header */}
			<div className="lg:hidden border-b border-sidebar-border bg-sidebar sticky top-0 z-50">
				<div className="flex items-center justify-between px-4 py-3">
					<div className="flex items-center gap-3">
						<div className="relative w-8 h-8 rounded-lg overflow-hidden">
							<Image
								src="/logo.png"
								alt="JIIT Placements"
								fill
								className="object-cover"
							/>
						</div>
						<h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
							JIIT Placements
						</h1>
					</div>

					<div className="flex items-center gap-2">
						<YearSelector compact />
						<ThemeSwitcher compact />
						<Link
							href="https://t.me/SupersetNotificationBot"
							target="_blank"
							rel="noopener noreferrer"
							className="relative p-2 rounded-full hover:bg-sidebar-accent text-sidebar-foreground/70 transition-colors"
						>
							<Bell className="w-5 h-5" />
							<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-sidebar"></span>
						</Link>
					</div>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<div className="border-t border-sidebar-border bg-sidebar p-2">
						<nav className="space-y-1">
							{navigation
								.filter((item) => item.href !== "/policy")
								.map((item) => {
									const isActive = isNavigationItemActive(item.href);
									return (
										<Link
											key={item.name}
											href={item.href}
											onClick={() => setMobileMenuOpen(false)}
											className={cn(
												"flex items-center px-4 py-3 rounded-md text-sm font-medium transition-all duration-200",
												isActive
													? "bg-sidebar-accent text-sidebar-accent-foreground"
													: "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
											)}
										>
											<img
												src={item.icon}
												alt={item.name}
												className={cn(
													"w-5 h-5 mr-3 object-contain transition-opacity",
													isActive
														? "opacity-100 dark:invert-0"
														: "opacity-70 dark:invert-[0.8]",
												)}
											/>
											{item.name}
										</Link>
									);
								})}
						</nav>
					</div>
				)}
			</div>

			<div className="lg:flex lg:h-full">
				{/* Desktop Sidebar */}
				<div className="hidden lg:flex lg:flex-shrink-0 lg:h-full">
					<div className="flex flex-col w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-full">
						{/* Sidebar Header */}
						<div className="px-5 py-6">
							<div className="flex items-center px-2">
								<div className="flex items-center gap-3">
									<div className="relative w-8 h-8 rounded-lg overflow-hidden">
										<Image
											src="/logo.png"
											alt="JIIT Placements"
											fill
											className="object-cover"
										/>
									</div>
									<span className="font-bold tracking-tight text-lg">
										JIIT Placements
									</span>
								</div>
							</div>
						</div>

						{/* Navigation */}
						<nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
							<div className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">
								Platform
							</div>
							{navigation.map((item) => {
								const isActive = isNavigationItemActive(item.href);
								return (
									<Link
										key={item.name}
										href={item.href}
										className={cn(
											"group flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
											isActive
												? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
												: "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
										)}
									>
										<img
											src={item.icon}
											alt={item.name}
											className={cn(
												"w-5 h-5 object-contain transition-all",
												isActive
													? "opacity-100 scale-105"
													: "opacity-70 grayscale group-hover:grayscale-0 group-hover:opacity-100",
												// Inverting logic for dark mode adaptability
												"dark:invert",
											)}
										/>
										{item.name}
									</Link>
								);
							})}
						</nav>

						{/* Sidebar Footer / CTA */}
						<div className="mt-auto px-4 pb-4 pt-3">
							<div className="h-px bg-sidebar-border" />

							<Link
								href="https://t.me/SupersetNotificationBot"
								target="_blank"
								rel="noopener noreferrer"
								className="group my-3 flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
							>
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
									<Bell className="h-4 w-4" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-semibold leading-tight text-foreground">
										Notifications
									</span>
									<span className="block text-[11px] leading-tight text-muted-foreground">
										Instant Telegram updates
									</span>
								</span>
								<ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
							</Link>

							<div className="h-px bg-sidebar-border" />

							<div className="py-3">
								<YearSelector />
							</div>

							<div className="h-px bg-sidebar-border" />

							<div className="flex items-center gap-2 pt-2">
								<ThemeSwitcher />
								<span className="shrink-0 pr-1 text-[10px] font-semibold tabular-nums text-sidebar-foreground/35">
									v2.3.0
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex-1 min-w-0 flex flex-col overflow-x-hidden lg:overflow-hidden bg-background">
					<main
						className={cn(
							"flex-1 lg:h-full lg:overflow-y-auto custom-scrollbar",
							isDetailPage ? "p-0" : "p-4 lg:p-8",
						)}
					>
						<div
							className={cn("w-full", isDetailPage ? "" : "max-w-6xl mx-auto")}
						>
							{children}
						</div>
					</main>
				</div>
			</div>

			{/* Mobile Floating Navigation */}
			<MenuBar
				className="lg:hidden"
				items={navigation.map((n, idx) => ({
					id: idx,
					href: n.href,
					icon: (
						<img
							src={n.icon}
							alt={n.name}
							className="w-5 h-5 object-contain dark:invert"
						/>
					),
					label: n.name,
				}))}
			/>

			<div className="lg:hidden h-24"></div>
		</div>
	);
}
