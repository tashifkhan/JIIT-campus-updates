"use client";

import React, { useEffect, useState } from "react";

export default function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		function handleBeforeInstallPrompt(e: any) {
			e.preventDefault();
			setDeferredPrompt(e);
			setVisible(true);
		}

		function handleAppInstalled() {
			setDeferredPrompt(null);
			setVisible(false);
		}

		window.addEventListener(
			"beforeinstallprompt",
			handleBeforeInstallPrompt as any
		);
		window.addEventListener("appinstalled", handleAppInstalled as any);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt as any
			);
			window.removeEventListener("appinstalled", handleAppInstalled as any);
		};
	}, []);

	if (!visible || !deferredPrompt) return null;

	return (
		<div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
			<div className="bg-white shadow-lg rounded-lg p-4 flex items-center gap-4">
				<div className="flex-1">
					<div className="font-semibold">Install app</div>
					<div className="text-sm text-gray-600">
						Add JIIT Placement Updates to your device
					</div>
				</div>
				<div className="flex gap-2">
					<button
						className="px-3 py-1 rounded bg-teal-500 text-white"
						onClick={async () => {
							try {
								await deferredPrompt.prompt();
								const choice = await deferredPrompt.userChoice;
								setDeferredPrompt(null);
								setVisible(false);
							} catch (e) {
								console.error(e);
							}
						}}
					>
						Install
					</button>
					<button
						className="px-3 py-1 rounded border"
						onClick={() => {
							setVisible(false);
						}}
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	);
}
