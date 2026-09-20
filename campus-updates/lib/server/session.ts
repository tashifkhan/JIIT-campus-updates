/**
 * Stateless, HMAC-signed session tokens.
 *
 * Token format: `<scope>.<expiryUnixSeconds>.<hmacHex>` where the HMAC covers
 * `<scope>.<expiry>`. Verification is constant-time and checks scope + expiry.
 *
 * Uses Web Crypto only, so it works in both the Node.js route handlers and the
 * Edge runtime (middleware). Imported by middleware, so this file must NOT be
 * marked "server-only" and must not use Node.js APIs.
 */

const encoder = new TextEncoder();

async function hmacHex(secret: string, data: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
	return Array.from(new Uint8Array(signature))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function safeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

export async function createSessionToken(
	scope: string,
	secret: string,
	maxAgeSeconds: number,
): Promise<string> {
	const expiry = Math.floor(Date.now() / 1000) + maxAgeSeconds;
	const body = `${scope}.${expiry}`;
	const signature = await hmacHex(secret, body);
	return `${body}.${signature}`;
}

export async function verifySessionToken(
	token: string | undefined | null,
	scope: string,
	secret: string,
): Promise<boolean> {
	if (!token || !secret) return false;
	const parts = token.split(".");
	if (parts.length !== 3) return false;
	const [tokenScope, expiryText, signature] = parts;
	if (tokenScope !== scope) return false;

	const expiry = Number(expiryText);
	if (!Number.isInteger(expiry)) return false;
	if (expiry < Math.floor(Date.now() / 1000)) return false;

	const expected = await hmacHex(secret, `${tokenScope}.${expiryText}`);
	return safeEqual(signature, expected);
}
