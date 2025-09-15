"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import React from "react";

type Props = { onClick: () => void };

export default function ExportCsvButton({ onClick }: Props) {
	return (
		<div className="fixed bottom-24 md:bottom-6 right-20 z-50 mr-1">
			<Button
				onClick={onClick}
				className="rounded-2xl w-14 h-14 shadow-lg"
				style={{ backgroundColor: "var(--accent-color)", color: "white" }}
				aria-label="Export CSV"
			>
				<Download className="w-5 h-5" />
			</Button>
		</div>
	);
}
