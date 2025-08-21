"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import ThemeSwitcher from "./ThemeSwitcher";
import {
	BriefcaseIcon,
	HomeIcon,
	TrendingUpIcon,
	CalendarIcon,
	MenuIcon,
	XIcon,
} from "lucide-react";

const navigation = [
	{ name: "Updates", href: "/", icon: HomeIcon },
	{ name: "Jobs", href: "/jobs", icon: BriefcaseIcon },
	{ name: "Stats", href: "/stats", icon: TrendingUpIcon },
	{ name: "Campus", href: "/campus", icon: CalendarIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<div
			className="min-h-screen"
			style={{ backgroundColor: "var(--bg-color)" }}
		>
			{/* Mobile Header */}
			<div
				className="lg:hidden border-b border-theme"
				style={{
					backgroundColor: "var(--card-bg)",
					borderColor: "var(--border-color)",
				}}
			>
				<div className="flex items-center justify-between px-4 py-3">
					<h1
						className="text-lg font-semibold"
						style={{ color: "var(--text-color)" }}
					>
						Campus Updates
					</h1>
					<div className="flex items-center gap-2">
						<ThemeSwitcher />
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="p-2 rounded-md hover-theme"
							style={{ color: "var(--label-color)" }}
						>
							{mobileMenuOpen ? (
								<XIcon className="w-5 h-5" />
							) : (
								<MenuIcon className="w-5 h-5" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<div
						className="border-t border-theme"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<nav className="px-4 py-2 space-y-1">
							{navigation.map((item) => {
								const Icon = item.icon;
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.name}
										href={item.href}
										onClick={() => setMobileMenuOpen(false)}
										className={cn(
											"flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
											isActive
												? "border-theme"
												: "border-transparent hover-theme"
										)}
										style={{
											color: isActive
												? "var(--accent-color)"
												: "var(--text-color)",
											backgroundColor: isActive
												? "var(--primary-color)"
												: "transparent",
											borderColor: isActive
												? "var(--accent-color)"
												: "transparent",
										}}
									>
										<Icon className="w-4 h-4 mr-3" />
										{item.name}
									</Link>
								);
							})}
						</nav>
					</div>
				)}
			</div>

			<div className="lg:flex lg:min-h-screen">
				{/* Desktop Sidebar */}
				<div className="hidden lg:flex lg:flex-shrink-0">
					<div
						className="flex flex-col w-64 border-r border-theme"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<div
							className="px-6 py-6 border-b border-theme"
							style={{ borderColor: "var(--border-color)" }}
						>
							<div className="flex items-center justify-between">
								<div>
									<h1
										className="text-xl font-bold"
										style={{ color: "var(--text-color)" }}
									>
										Campus Updates
									</h1>
									<p
										className="text-sm mt-1"
										style={{ color: "var(--label-color)" }}
									>
										Placement Portal
									</p>
								</div>
								<ThemeSwitcher />
							</div>
						</div>

						<nav className="flex-1 px-4 py-6 space-y-2">
							{navigation.map((item) => {
								const Icon = item.icon;
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.name}
										href={item.href}
										className={cn(
											"flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
											isActive
												? "border-theme"
												: "border-transparent hover-theme"
										)}
										style={{
											color: isActive
												? "var(--accent-color)"
												: "var(--text-color)",
											backgroundColor: isActive
												? "var(--primary-color)"
												: "transparent",
											borderColor: isActive
												? "var(--accent-color)"
												: "transparent",
										}}
									>
										<Icon className="w-5 h-5 mr-3" />
										{item.name}
									</Link>
								);
							})}
						</nav>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex-1 min-w-0">
					<main className="p-4 lg:p-8">{children}</main>
				</div>
			</div>

			{/* Mobile Bottom Navigation */}
			<div
				className="lg:hidden fixed bottom-0 inset-x-0 border-t border-theme"
				style={{
					backgroundColor: "var(--card-bg)",
					borderColor: "var(--border-color)",
				}}
			>
				<nav className="flex justify-around py-2">
					{navigation.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.name}
								href={item.href}
								className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-0"
								style={{
									color: isActive
										? "var(--accent-color)"
										: "var(--label-color)",
								}}
							>
								<Icon className="w-5 h-5 mb-1" />
								<span className="text-xs font-medium truncate">
									{item.name}
								</span>
							</Link>
						);
					})}
				</nav>
			</div>

			{/* Bottom padding for mobile nav */}
			<div className="lg:hidden h-16"></div>
		</div>
	);
}
