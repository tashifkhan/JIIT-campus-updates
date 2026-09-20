"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryState } from "nuqs";

import { secretAccessQueryParser } from "@/lib/query-params";

type SecretAccessContextValue = {
	unlocked: boolean | null;
	unlock: () => void;
};

const SecretAccessContext = createContext<SecretAccessContextValue | null>(null);

/**
 * Mint the httpOnly gate cookie required by the API middleware. Without this
 * cookie the data APIs return 401, so the client-side wall and the server-side
 * gate stay in sync.
 */
async function mintGateCookie(): Promise<void> {
	try {
		await fetch("/api/gate", { method: "POST" });
	} catch {
		// Best effort: a failed mint leaves the APIs locked, which fails closed.
	}
}

export function SecretAccessProvider({
	children,
	enabled,
}: {
	children: ReactNode;
	enabled: boolean;
}) {
	const [unlockParam, setUnlockParam] = useQueryState(
		"shh",
		secretAccessQueryParser,
	);
	const [gateUnlocked, setGateUnlocked] = useState<boolean | null>(null);
	const unlocked = enabled ? gateUnlocked : true;

	useEffect(() => {
		if (!enabled) return;

		let cancelled = false;

		(async () => {
			let flag = false;
			try {
				if (unlockParam !== null) localStorage.setItem("shh", "1");
				flag = Boolean(localStorage.getItem("shh"));
				// Ensure the server-side gate cookie exists before any data
				// queries fire (e.g. after cookie expiry with a stale flag).
				if (flag) await mintGateCookie();
			} catch {
				flag = false;
			}
			if (!cancelled) setGateUnlocked(flag);
			if (unlockParam !== null) void setUnlockParam(null);
		})();

		return () => {
			cancelled = true;
		};
	}, [enabled, setUnlockParam, unlockParam]);

	const unlock = () => {
		if (!enabled) return;

		try {
			localStorage.setItem("shh", "1");
		} catch {
			setGateUnlocked(false);
			return;
		}
		// Await the cookie mint before rendering children so their API calls
		// don't race ahead of the gate cookie and get 401s.
		void mintGateCookie().finally(() => setGateUnlocked(true));
	};

	return (
		<SecretAccessContext.Provider value={{ unlocked, unlock }}>
			{children}
		</SecretAccessContext.Provider>
	);
}

export function useSecretAccess(): SecretAccessContextValue {
	const context = useContext(SecretAccessContext);
	if (!context) {
		throw new Error("useSecretAccess must be used within SecretAccessProvider");
	}
	return context;
}
