"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import ThemeSwitcher from "./ThemeSwitcher";

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
									const isActive = pathname === item.href;
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
							<div className="flex items-center gap-3 px-2">
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

						{/* Navigation */}
						<nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
							<div className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">
								Platform
							</div>
							{navigation.map((item) => {
								const isActive = pathname === item.href;
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
						<div className="p-4 mt-auto space-y-4">
							<div className="rounded-xl bg-card border border-border p-4 shadow-sm relative overflow-hidden">
								<div className="relative z-10">
									<h3 className="font-semibold text-foreground text-sm mb-1">
										Notifications
									</h3>
									<p className="text-xs text-muted-foreground mb-3 leading-relaxed">
										Get instant updates via Telegram.
									</p>
									<Link
										href="https://t.me/SupersetNotificationBot"
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-all duration-200"
									>
										Connect Bot
										<ArrowRight className="w-3 h-3 ml-2" />
									</Link>
								</div>
							</div>

							<div className="px-2 pt-2 border-t border-sidebar-border flex items-center justify-between">
								<ThemeSwitcher />
								<span className="text-[10px] text-sidebar-foreground/40 font-medium">
									v2.3.0
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex-1 min-w-0 flex flex-col lg:overflow-hidden bg-background">
					<main className="flex-1 lg:h-full lg:overflow-y-auto custom-scrollbar p-4 lg:p-8">
						<div className="max-w-6xl mx-auto w-full">{children}</div>
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
