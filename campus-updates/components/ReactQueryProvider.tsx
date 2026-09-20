"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PlacementYearProvider } from "@/components/PlacementYearProvider";

export default function ReactQueryProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	// Create the client once on the client-side
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60 * 60, // 1 hour
						retry: 1,
					},
				},
			})
	);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<PlacementYearProvider>{children}</PlacementYearProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
