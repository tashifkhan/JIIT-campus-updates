"use client";
import Layout from "@/components/Layout";
import NoticesClient from "@/components/NoticesClient";
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
					<style>{`
		  :root { color-scheme: light dark; }
		  html, body { height: 100%; margin: 0; }
		  body {
			display: grid;
			place-items: center;
			font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
			line-height: 1.5;
		  }
		  .card {
			padding: 2rem 2.5rem;
			border-radius: 14px;
			border: 1px solid rgba(0,0,0,0.1);
			box-shadow: 0 2px 24px rgba(0,0,0,0.06);
		  }
		  h1 { margin: 0 0 0.5rem; font-size: 1.75rem; }
		  p { margin: 0.25rem 0; opacity: 0.8; }
		  .muted { font-size: 0.9rem; opacity: 0.65; }
		  .linklike { background: transparent; border: none; padding: 0; margin: 0; color: inherit; font: inherit; cursor: pointer; text-decoration: none; }
		`}</style>

					<main className="card" role="main">
						<h1>Service unavailable Permanently</h1>
						<p>This site will not be accessible.</p>
						<p className="muted">
							As per the instructions of the{" "}
							<span onClick={handleSecretClick}>JIIT</span> Administration.
						</p>
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
