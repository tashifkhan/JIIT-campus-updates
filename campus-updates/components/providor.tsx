"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

type ProviderProps = {
	children: React.ReactNode;
	apiKey?: string;
	options?: Record<string, any>;
};

export function PostHogProvider({ children, apiKey, options }: ProviderProps) {
	useEffect(() => {
		const key = apiKey || (process.env.NEXT_PUBLIC_POSTHOG_KEY as string);
		const host =
			options?.api_host ||
			process.env.NEXT_PUBLIC_POSTHOG_HOST ||
			"https://eu.i.posthog.com";

		// Merge options but ensure api_host is used from provided options when present
		const initOptions = {
			...(options || {}),
			api_host: host,
			person_profiles: "identified_only",
		};

		if (key) {
			posthog.init(key, initOptions as any);
		} else {
			// If no key is available, avoid initializing and let calls be no-ops.
			// This is helpful for environments like preview or tests where the key isn't set.
			// eslint-disable-next-line no-console
			console.warn("PostHog API key not provided; PostHog not initialized.");
		}
	}, [apiKey, options]);

	return <PHProvider client={posthog}>{children}</PHProvider>;
}
