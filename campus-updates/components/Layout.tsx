"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import ThemeSwitcher from "./ThemeSwitcher";

import FloatingNav from "./FloatingNav";

const navigation = [
	{ name: "Updates", href: "/", icon: "/icons/home.png" },
	{ name: "Policy", href: "/policy", icon: "/icons/book.png" },
	{ name: "Jobs", href: "/jobs", icon: "/icons/briefcase.png" },
	{ name: "Stats", href: "/stats", icon: "/icons/diagram.png" },
	// { name: "Campus", href: "/campus", icon: CalendarIcon },
];

/* Tools removed */

export default function Layout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// const [toolsOpen, setToolsOpen] = useState(false);

	return (
		<div
			className="min-h-screen lg:min-h-0 lg:h-screen lg:overflow-hidden"
			style={{ backgroundColor: "var(--bg-color)" }}
		>
			{/* Mobile Header */}
			<div className="lg:hidden border-b border-border bg-card">
				<div className="flex items-center justify-between px-4 py-3">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 relative rounded-full overflow-hidden flex-shrink-0">
							<Image
								src="/logo.png"
								alt="JIIT Logo"
								fill
								style={{ objectFit: "cover" }}
							/>
						</div>
						<h1 className="text-lg font-semibold text-foreground">
							Placement Updates
						</h1>
					</div>
					<div className="flex items-center gap-2">
						<ThemeSwitcher compact />
						<Link href="/policy" className="pr-2">
							<div
								className="p-2 rounded-full transition-colors hover:bg-primary hover:text-accent-foreground text-foreground"
								aria-label="Policy"
							>
								<img
									src="/icons/book.png"
									alt="Policy"
									className="w-4 h-5 object-contain dark:invert"
								/>
							</div>
						</Link>

						<Link
							href="https://t.me/SupersetNotificationBot"
							target="_blank"
							rel="noopener noreferrer"
							className="px-3 py-1 rounded-2xl text-sm font-medium hover-theme bg-accent text-card"
						>
							<img
								src="/icons/bell.png"
								alt="Notifications"
								className="w-5 h-5 object-contain dark:invert"
							/>
						</Link>
					</div>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<div className="border-t border-border bg-card">
						<nav className="px-4 py-2 space-y-1">
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
												"flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
												isActive
													? "border-theme bg-primary text-accent-foreground border-accent"
													: "border-transparent hover-theme text-foreground hover:bg-accent",
											)}
										>
											{typeof item.icon === "string" ? (
												<img
													src={item.icon}
													alt={item.name}
													className={cn(
														"w-4 h-4 mr-3 object-contain dark:invert",
														isActive ? "invert-0 dark:invert-0" : "",
													)}
												/>
											) : (
												(() => {
													const Icon = item.icon as any;
													return <Icon className="w-4 h-4 mr-3" />;
												})()
											)}
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
					<div className="flex flex-col w-64 border-r border-border bg-card h-full overflow-hidden">
						<div className="px-6 py-6 border-b border-border text-center">
							<div className="w-20 h-20 mx-auto relative rounded-full overflow-hidden">
								<Image
									src="/logo.png"
									alt="JIIT Logo"
									fill
									style={{ objectFit: "cover" }}
								/>
							</div>
							<h1 className="text-xl font-bold mt-3 text-foreground">
								Placement Updates
							</h1>
							<p className="text-sm mt-1 text-muted-foreground">
								Placement Portal
							</p>
							<Link
								href="https://t.me/SupersetNotificationBot"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-block mt-3 px-3 py-1 rounded-md text-sm font-medium hover-theme bg-accent text-accent-foreground"
							>
								Get notifications
							</Link>
						</div>

						<nav className="flex-1 px-4 py-6 space-y-2 overflow-auto min-h-0">
							{navigation.map((item) => {
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.name}
										href={item.href}
										className={cn(
											"flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
											isActive
												? "border-theme bg-primary text-primary-foreground border-accent"
												: "border-transparent hover-theme text-foreground",
										)}
									>
										{typeof item.icon === "string" ? (
											<img
												src={item.icon}
												alt={item.name}
												className={cn(
													"w-5 h-5 mr-3 object-contain dark:invert",

													isActive ? "invert-0 dark:invert-0" : "",
												)}
											/>
										) : (
											(() => {
												const Icon = item.icon as any;
												return <Icon className="w-5 h-5 mr-3" />;
											})()
										)}
										{item.name}
									</Link>
								);
							})}
						</nav>
						{/* Bottom area for desktop: theme switcher */}
						<div className="px-4 py-4 border-t border-border mt-auto">
							<ThemeSwitcher />
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex-1 min-w-0 flex flex-col lg:overflow-hidden">
					<main className="p-4 lg:p-8 lg:h-full lg:overflow-auto">
						{children}
					</main>
				</div>
			</div>

			{/* Mobile Floating Navigation (uses theme variables from ThemeProvider) */}
			<FloatingNav
				items={navigation.map((n, idx) => {
					return {
						id: idx,
						href: n.href,
						icon:
							typeof n.icon === "string" ? (
								<img
									src={n.icon}
									alt={n.name}
									className="w-5 h-5 mb-1 object-contain dark:invert"
								/>
							) : (
								(() => {
									const Icon = n.icon as any;
									return <Icon className="w-5 h-5 mb-1" />;
								})()
							),
						label: n.name,
					};
				})}
			/>

			{/* Mobile Tools Menu (Removed) */}

			{/* Bottom padding for mobile nav to avoid content overlap */}
			<div className="lg:hidden h-24"></div>
		</div>
	);
}
