import { ArrowRightLeft, Building2, GraduationCap } from "lucide-react";

import type { CampusRoute } from "@/lib/stats";
import { cn } from "@/lib/utils";

const ROUTE_META: Record<
	CampusRoute,
	{ label: string; color: string; Icon: typeof GraduationCap; hint: string }
> = {
	on: {
		label: "On campus",
		color: "var(--campus-on)",
		Icon: GraduationCap,
		hint: "Matched to a campus drive posted on SuperSet",
	},
	ppo: {
		label: "PPO",
		color: "var(--campus-ppo)",
		Icon: ArrowRightLeft,
		hint: "Pre-placement or internship conversion offer",
	},
	off: {
		label: "Off campus",
		color: "var(--campus-off)",
		Icon: Building2,
		hint: "No campus drive matched this offer",
	},
};

export const CAMPUS_ROUTE_LABELS: Record<CampusRoute, string> = {
	on: ROUTE_META.on.label,
	ppo: ROUTE_META.ppo.label,
	off: ROUTE_META.off.label,
};

export function campusRouteColor(route: CampusRoute): string {
	return ROUTE_META[route].color;
}

function confidenceTier(confidence: number): { label: string; filled: number } {
	if (confidence >= 0.9) return { label: "high", filled: 4 };
	if (confidence >= 0.8) return { label: "good", filled: 3 };
	if (confidence >= 0.65) return { label: "fair", filled: 2 };
	return { label: "low", filled: 1 };
}

type Props = {
	route: CampusRoute;
	/** Judge confidence, 0..1. Only drawn for on-campus offers. */
	confidence?: number | null;
	size?: "sm" | "md";
	className?: string;
};

/**
 * Pill naming how an offer was won. On-campus pills carry a four-step meter
 * for the judge's confidence, so a 70% match reads weaker than a 95% one
 * without the reader parsing a number.
 */
export default function CampusBadge({ route, confidence, size = "sm", className }: Props) {
	const meta = ROUTE_META[route];
	const showMeter = route === "on" && confidence != null;
	const tier = showMeter ? confidenceTier(confidence) : null;
	const percent = showMeter ? Math.round(confidence * 100) : null;
	const description = showMeter
		? `${meta.label}, ${percent}% confidence (${tier!.label}). ${meta.hint}.`
		: `${meta.label}. ${meta.hint}.`;

	return (
		<span
			title={description}
			aria-label={description}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border font-medium text-foreground whitespace-nowrap",
				size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
				className,
			)}
			style={{
				borderColor: `color-mix(in srgb, ${meta.color} 45%, transparent)`,
				backgroundColor: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
			}}
		>
			<meta.Icon
				aria-hidden
				className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"}
				style={{ color: meta.color }}
			/>
			{meta.label}
			{showMeter ? (
				<span aria-hidden className="flex items-center gap-1 pl-1 ml-0.5 border-l border-border">
					<span className="flex items-end gap-[2px] h-2.5">
						{[1, 2, 3, 4].map((step) => (
							<span
								key={step}
								className="w-[3px] rounded-[1px]"
								style={{
									height: `${25 * step}%`,
									backgroundColor:
										step <= tier!.filled
											? meta.color
											: `color-mix(in srgb, ${meta.color} 22%, transparent)`,
								}}
							/>
						))}
					</span>
					<span className="tabular-nums text-muted-foreground">{percent}%</span>
				</span>
			) : null}
		</span>
	);
}
