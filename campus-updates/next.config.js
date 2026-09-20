/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
	dest: "public",
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === "development",
});

const isProd = process.env.NODE_ENV === "production";

// NOTE: script-src keeps 'unsafe-inline' because Next.js injects inline
// bootstrap scripts unless a nonce pipeline is wired through middleware.
// The CSP below still blocks external script hosts, frames, objects and
// form/base-uri abuse; the stored-XSS surface is additionally fixed at the
// source via server-side HTML sanitization.
const scriptSources = [
	"'self'",
	"'unsafe-inline'",
	...(isProd ? [] : ["'unsafe-eval'"]),
].join(" ");

const contentSecurityPolicy = [
	"default-src 'self'",
	`script-src ${scriptSources}`,
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: https:",
	"font-src 'self' data:",
	"connect-src 'self'",
	"manifest-src 'self'",
	"worker-src 'self'",
	"object-src 'none'",
	"frame-ancestors 'none'",
	"base-uri 'self'",
	"form-action 'self'",
].join("; ");

const securityHeaders = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
	},
	{ key: "Content-Security-Policy", value: contentSecurityPolicy },
];

if (isProd) {
	securityHeaders.push({
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	});
}

const nextConfig = {
	// output: 'export',
	images: { unoptimized: true },
	async headers() {
		return [
			{
				source: "/:path*",
				headers: securityHeaders,
			},
		];
	},
	async rewrites() {
		return [
			{
				source: "/ph/static/:path*",
				destination: "https://eu-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/ph/:path*",
				destination: "https://eu.i.posthog.com/:path*",
			},
		];
	},
};

module.exports = withPWA(nextConfig);
