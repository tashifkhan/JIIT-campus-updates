"use client";

import { useState } from "react";

import JobsClient from "@/components/jobs/JobsClient";
import { useSecretAccess } from "@/components/SecretAccessProvider";

export default function JobsPage() {
	const { unlocked, unlock } = useSecretAccess();
	const [secretClicks, setSecretClicks] = useState(0);

	const handleSecretClick = () => {
		setSecretClicks((current) => {
			const next = current + 1;
			if (next >= 7) unlock();
			return next;
		});
	};

	if (!unlocked) {
		return (
			<main
				role="main"
				className="min-h-screen flex items-center justify-center font-sans"
			>
				<div className="p-8 md:p-10 rounded-[14px] border border-border shadow-lg bg-card text-card-foreground">
					<h1 className="m-0 mb-2 text-2xl md:text-3xl font-bold">
						Service unavailable Permanently
					</h1>
					<p className="m-0 mb-1 text-base text-muted-foreground">
						This site will not be accessible.
					</p>
					<p className="m-0 text-sm text-muted-foreground/80">
						As per the instructions of the{" "}
						<button
							type="button"
							onClick={handleSecretClick}
							className="cursor-pointer hover:text-primary transition-colors"
						>
							JIIT
						</button>{" "}
						Administration.
					</p>
				</div>
			</main>
		);
	}

	return <JobsClient />;
}
