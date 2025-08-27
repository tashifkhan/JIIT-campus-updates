"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import ThemeSwitcher from "./ThemeSwitcher";
import {
	BriefcaseIcon,
	HomeIcon,
	TrendingUpIcon,
	CalendarIcon,
	BellIcon,
	MenuIcon,
	XIcon,
	WrenchIcon,
	MessageSquareIcon,
	CoffeeIcon,
	WifiIcon,
	BookOpenIcon,
} from "lucide-react";

const navigation = [
	{ name: "Updates", href: "/", icon: HomeIcon },
	{ name: "Jobs", href: "/jobs", icon: BriefcaseIcon },
	{ name: "Stats", href: "/stats", icon: TrendingUpIcon },
	// { name: "Campus", href: "/campus", icon: CalendarIcon },
];

const tools = [
	// {
	//  name: "Placement Updates PWA",
	//  href: "https://jiit-placement-updates.tashif.codes",
	// },
	{
		name: "Placement Bot",
		href: "https://t.me/SupersetNotificationBot",
		icon: MessageSquareIcon,
	},
	{
		name: "Timetable",
		href: "https://jiit-timetable.tashif.codes",
		icon: CalendarIcon,
	},
	{
		name: "Mess Menu",
		href: "https://jiit-timetable.tashif.codes/mess-menu",
		icon: CoffeeIcon,
	},
	{
		name: "Wifi Auto Login",
		href: "https://sophos-autologin.tashif.codes",
		icon: WifiIcon,
	},
	{
		name: "JPortal",
		href: "https://yashmalik.tech/jportal/",
		icon: BookOpenIcon,
	},
];

export default function Layout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [toolsOpen, setToolsOpen] = useState(false);

	return (
		<div
			className="min-h-screen lg:h-screen lg:overflow-hidden"
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
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 relative rounded-full overflow-hidden flex-shrink-0">
							<Image
								src="/logo.png"
								alt="JIIT Logo"
								fill
								style={{ objectFit: "cover" }}
							/>
						</div>
						<h1
							className="text-lg font-semibold"
							style={{ color: "var(--text-color)" }}
						>
							Placement Updates
						</h1>
					</div>
					<div className="flex items-center gap-2">
						<Link
							href="https://t.me/SupersetNotificationBot"
							target="_blank"
							rel="noopener noreferrer"
							className="px-3 py-1 rounded-2xl text-sm font-medium hover-theme"
							style={{
								backgroundColor: "var(--accent-color)",
								color: "var(--card-bg)",
							}}
						>
							<BellIcon className="w-5 h-5" />
						</Link>
						<ThemeSwitcher compact />
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

			<div className="lg:flex lg:h-full">
				{/* Desktop Sidebar */}
				<div className="hidden lg:flex lg:flex-shrink-0">
					<div
						className="flex flex-col w-64 border-r border-theme h-full overflow-hidden"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
					>
						<div
							className="px-6 py-6 border-b border-theme text-center"
							style={{ borderColor: "var(--border-color)" }}
						>
							<div className="w-20 h-20 mx-auto relative rounded-full overflow-hidden">
								<Image
									src="/logo.png"
									alt="JIIT Logo"
									fill
									style={{ objectFit: "cover" }}
								/>
							</div>
							<h1
								className="text-xl font-bold mt-3"
								style={{ color: "var(--text-color)" }}
							>
								Placement Updates
							</h1>
							<p
								className="text-sm mt-1"
								style={{ color: "var(--label-color)" }}
							>
								Placement Portal
							</p>
							<Link
								href="https://t.me/SupersetNotificationBot"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-block mt-3 px-3 py-1 rounded-md text-sm font-medium hover-theme"
								style={{
									backgroundColor: "var(--accent-color)",
									color: "var(--card-bg)",
								}}
							>
								Get notifications
							</Link>
						</div>

						<nav className="flex-1 px-4 py-6 space-y-2 overflow-auto">
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

							{/* Tools button (desktop) */}
							<div className="">
								<button
									onClick={() => setToolsOpen(!toolsOpen)}
									className={cn(
										"w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors border hover-theme",
										toolsOpen ? "border-theme" : "border-transparent"
									)}
									style={{
										color: toolsOpen
											? "var(--accent-color)"
											: "var(--text-color)",
										backgroundColor: toolsOpen
											? "var(--primary-color)"
											: "transparent",
										borderColor: toolsOpen
											? "var(--accent-color)"
											: "transparent",
									}}
								>
									<WrenchIcon className="w-5 h-5 mr-3" />
									Tools
								</button>
							</div>

							{/* Tools popup panel inside sidebar (desktop only) */}
							{toolsOpen && (
								<div className="mt-3">
									<div
										className="rounded-lg border p-3"
										style={{
											backgroundColor: "var(--card-bg)",
											borderColor: "var(--border-color)",
										}}
									>
										{/* <div className="flex items-center justify-between mb-2">
											<button
												onClick={() => setToolsOpen(false)}
												className="p-1 rounded hover-theme"
												style={{ color: "var(--label-color)" }}
											>
												<XIcon className="w-4 h-4" />
											</button>
										</div> */}
										<div className="space-y-1">
											{tools.map((t) => {
												const ToolIcon = t.icon;
												return (
													<Link
														key={t.href}
														href={t.href}
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center px-3 py-2 rounded hover-theme text-sm"
														style={{ color: "var(--text-color)" }}
													>
														{ToolIcon && <ToolIcon className="w-4 h-4 mr-3" />}
														<span className="truncate">{t.name}</span>
													</Link>
												);
											})}
										</div>
									</div>
								</div>
							)}
						</nav>
						{/* Bottom area for desktop: theme switcher */}
						<div
							className="px-4 py-4 border-t border-theme mt-auto"
							style={{ borderColor: "var(--border-color)" }}
						>
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

					{/* Tools button for mobile */}
					<button
						onClick={() => setToolsOpen(true)}
						className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-0 active:scale-95"
						style={{ color: "var(--label-color)" }}
					>
						<WrenchIcon className="w-5 h-5 mb-1" />
						<span className="text-xs font-medium truncate">Tools</span>
					</button>
				</nav>
			</div>

			{/* Bottom padding for mobile nav */}
			<div className="lg:hidden h-16"></div>

			{/* Mobile Tools Overlay - Redesigned */}
			{toolsOpen && (
				<div className="fixed inset-0 z-50 flex items-end justify-end lg:hidden">
					{/* Overlay background */}
					<div
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						onClick={() => setToolsOpen(false)}
						aria-label="Close tools modal"
						tabIndex={0}
					/>
					{/* Modal card */}
					<div
						className="relative max-w-md ml-auto mr-0 bg-card rounded-2xl shadow-xl p-5 border border-theme mb-20"
						style={{
							backgroundColor: "var(--card-bg)",
							borderColor: "var(--border-color)",
						}}
						role="dialog"
						aria-modal="true"
					>
						<button
							className="absolute top-3 right-3 p-2 rounded-full hover-theme"
							onClick={() => setToolsOpen(false)}
							aria-label="Close"
							style={{ backgroundColor: "var(--primary-color-lite)" }}
						>
							<XIcon
								className="w-5 h-5"
								style={{ color: "var(--label-color)" }}
							/>
						</button>
						<div className="flex flex-col gap-3">
							{tools.map((t) => {
								const ToolIcon = t.icon;
								return (
									<Link
										key={t.href}
										href={t.href}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium hover-theme transition-all border border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
										style={{
											color: "var(--text-color)",
											backgroundColor: "var(--primary-color-lite)",
										}}
									>
										{ToolIcon && <ToolIcon className="w-6 h-6 flex-shrink-0" />}
										<span className="truncate">{t.name}</span>
									</Link>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
