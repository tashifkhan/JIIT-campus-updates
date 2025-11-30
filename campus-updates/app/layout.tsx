import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PostHogProvider } from "@/components/providor";
import { Analytics } from "@vercel/analytics/next";
import ReactQueryProvider from "@/components/ReactQueryProvider";

import Layout from "@/components/Layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: {
		default: "JIIT Placement Updates",
		template: "%s - JIIT Placement Updates",
	},
	description: "Campus placement and updates portal",
	applicationName: "JIIT Placement Updates",
	metadataBase: new URL("https://jiit-placement-updates.tashif.codes"),
	openGraph: {
		title: "JIIT Placement Updates",
		description: "Campus placement and updates portal",
		url: "https://jiit-placement-updates.tashif.codes",
		siteName: "JIIT Placement Updates",
		images: [
			{
				url: "https://jiit-placement-updates.tashif.codes/logo.png",
				height: 800,
				width: 1200,
			},
		],
		type: "website",
	},
	twitter: {
		title: "JIIT Placement Updates",
		description: "Campus placement and updates portal",
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
			<body className={inter.className}>
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
								name: "JIIT Placement Updates",
								url: "https://jiit-placement-updates.tashif.codes",
								potentialAction: {
									"@type": "SearchAction",
									target:
										"https://jiit-placement-updates.tashif.codes/search?q={search_term_string}",
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
