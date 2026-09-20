"use client";

import { useEffect } from "react";

/** Remove production PWA state that can otherwise intercept localhost dev pages. */
export default function DevelopmentServiceWorkerCleanup() {
	useEffect(() => {
		if (process.env.NODE_ENV !== "development") return;

		async function clearDevelopmentPwaState() {
			if ("serviceWorker" in navigator) {
				const registrations = await navigator.serviceWorker.getRegistrations();
				await Promise.all(
					registrations.map((registration) => registration.unregister()),
				);
			}

			if ("caches" in window) {
				const cacheNames = await caches.keys();
				await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
			}
		}

		void clearDevelopmentPwaState();
	}, []);

	return null;
}
