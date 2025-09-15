"use client";
import Layout from "@/components/Layout";
import NoticesClient from "@/components/notice/NoticesClient";
import { useEffect, useState } from "react";

export default function HomePage() {
	// Secret unlock gate using localStorage key "shh"
	const [unlocked, setUnlocked] = useState<boolean>(() => {
		try {
			return typeof window !== "undefined" && !!localStorage.getItem("shh");
		} catch {
			return false;
		}
	});
	const [secretClicks, setSecretClicks] = useState(0);

	useEffect(() => {
		// Support unlocking via ?shh query parameter and then clean it from the URL
		try {
			if (typeof window === "undefined") return;
			const params = new URLSearchParams(window.location.search);
			if (params.has("shh")) {
				try {
					localStorage.setItem("shh", "1");
				} catch {
					/* ignore */
				}
				setUnlocked(true);
				params.delete("shh");
				const newUrl = `${window.location.pathname}${
					params.toString() ? `?${params.toString()}` : ""
				}${window.location.hash || ""}`;
				window.history.replaceState({}, "", newUrl);
			}
		} catch {
			// ignore
		}
	}, []);

	const handleSecretClick = () => {
		setSecretClicks((c) => {
			const next = c + 1;
			if (next >= 7) {
				try {
					localStorage.setItem("shh", "1");
				} catch {
					/* ignore */
				}
				if (typeof window !== "undefined") window.location.reload();
			}
			return next;
		});
	};

	if (!unlocked) {
		return (
			<Layout>
				<>
					<main
						role="main"
						className="min-h-screen flex items-center justify-center font-sans"
					>
						<div className="p-8 md:p-10 rounded-[14px] border border-black/10 dark:border-white/10 shadow-[0_2px_24px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900">
							<h1 className="m-0 mb-2 text-2xl md:text-3xl">
								Service unavailable Permanently
							</h1>
							<p className="m-0 mb-1 text-base opacity-80">
								This site will not be accessible.
							</p>
							<p className="m-0 text-sm opacity-70">
								As per the instructions of the{" "}
								<span onClick={handleSecretClick}>JIIT</span> Administration.
							</p>
						</div>
					</main>
				</>
			</Layout>
		);
	}

	return (
		<Layout>
			<NoticesClient />
		</Layout>
	);
}
