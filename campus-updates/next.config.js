/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
	dest: "public",
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
	// output: 'export',
	images: { unoptimized: true },
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
