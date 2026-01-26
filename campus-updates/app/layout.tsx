import "./globals.css";
import type { Metadata } from "next";
import { Antic, JetBrains_Mono } from "next/font/google";
import { PostHogProvider } from "@/components/providor";
import { Analytics } from "@vercel/analytics/next";
import ReactQueryProvider from "@/components/ReactQueryProvider";

import Layout from "@/components/Layout";

const antic = Antic({
	weight: "400",
	subsets: ["latin"],
	variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

export const metadata: Metadata = {
	manifest: "/manifest.json",
	title: {
		default: "JIIT Placements",
		template: "%s - JIIT Placements",
	},
	description: "JIIT placement portal",
	applicationName: "JIIT Placements",
	metadataBase: new URL("https://jiit-placement-updates.netlify.app"),
	openGraph: {
		title: "JIIT Placements",
		description: "JIIT placement portal",
		url: "https://jiit-placement-updates.netlify.app",
		siteName: "JIIT Placements",
		images: [
			{
				url: "https://jiit-placement-updates.netlify.app/logo.png",
				height: 800,
				width: 1200,
			},
		],
		type: "website",
	},
	twitter: {
		title: "JIIT Placements",
		description: "JIIT placement portal",
		card: "summary_large_image",
		site: "",
	},
	icons: {
		icon: "/logo.png",
		apple: "/icon.png",
	},
	robots: {
		index: true,
		follow: true,
		noarchive: false,
		googleBot: {
			index: true,
			follow: true,
		},
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head />
			<body
				className={`${antic.variable} ${jetbrainsMono.variable} font-sans bg-background text-foreground`}
			>
				<PostHogProvider
					apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
					options={{ api_host: "/ph" }}
				>
					<ReactQueryProvider>
						<Layout>{children}</Layout>
					</ReactQueryProvider>
					<Analytics />
					{/* JSON-LD structured data for site */}
					<script
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify({
								"@context": "https://schema.org",
								"@type": "WebSite",
								name: "JIIT Placements",
								url: "https://jiit-placement-updates.netlify.app",
								potentialAction: {
									"@type": "SearchAction",
									target:
										"https://jiit-placement-updates.netlify.app/search?q={search_term_string}",
									"query-input": "required name=search_term_string",
								},
							}),
						}}
					/>
				</PostHogProvider>
			</body>
		</html>
	);
}
