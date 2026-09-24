import { AlertTriangle, ArrowRightLeft, Building2, GraduationCap } from "lucide-react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { CampusDetail } from "@/lib/stats-api";
import { formatPackage, type CampusRoute } from "@/lib/stats";
import { cn } from "@/lib/utils";

// On and off campus are the tagger's call, never certain, so both say "Likely".
// PPO comes from the mail subject, which states it outright.
const ROUTE_META: Record<
	CampusRoute,
	{ label: string; color: string; Icon: typeof GraduationCap; hint: string }
> = {
	on: {
		label: "Likely on campus",
		color: "var(--campus-on)",
		Icon: GraduationCap,
		hint: "Tagged on campus and backed by a drive posted on SuperSet",
	},
	ppo: {
		label: "PPO",
		color: "var(--campus-ppo)",
		Icon: ArrowRightLeft,
		hint: "The mail subject calls it a pre-placement or internship conversion offer",
	},
	off: {
		label: "Likely off campus",
		color: "var(--campus-off)",
		Icon: Building2,
		hint: "No posted campus drive backs this offer",
	},
};

export const CAMPUS_ROUTE_LABELS: Record<CampusRoute, string> = {
	on: ROUTE_META.on.label,
	ppo: ROUTE_META.ppo.label,
	off: ROUTE_META.off.label,
};

export const CAMPUS_REVIEW_TEXT: Record<NonNullable<CampusDetail["review"]>, string> = {
	"no-drive":
		"Tagged likely on campus, but no posted drive backs it, so it counts as likely off campus.",
	"drive-exists": "A drive for this company was posted, but the tagger judged this offer off campus.",
};

const DRIVE_VIA: Record<NonNullable<CampusDetail["drive"]>["via"], string> = {
	judge: "picked by the tagger",
	link: "stored job link",
	name: "company name match",
};

export function campusRouteColor(route: CampusRoute): string {
	return ROUTE_META[route].color;
}

function confidenceTier(confidence: number): { label: string; filled: number } {
	if (confidence >= 0.9) return { label: "high", filled: 4 };
	if (confidence >= 0.8) return { label: "good", filled: 3 };
	if (confidence >= 0.7) return { label: "fair", filled: 2 };
	return { label: "low", filled: 1 };
}

function Meter({ confidence, color }: { confidence: number; color: string }) {
	const { filled } = confidenceTier(confidence);
	return (
		<span className="flex items-end gap-[2px] h-2.5" aria-hidden>
			{[1, 2, 3, 4].map((step) => (
				<span
					key={step}
					className="w-[3px] rounded-[1px]"
					style={{
						height: `${25 * step}%`,
						backgroundColor:
							step <= filled ? color : `color-mix(in srgb, ${color} 22%, transparent)`,
					}}
				/>
			))}
		</span>
	);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="grid grid-cols-[6.5rem_1fr] gap-2">
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="text-foreground min-w-0 break-words">{children}</dd>
		</div>
	);
}

/** The full trace behind one classification, shown on hover. */
export function CampusDetailCard({ detail }: { detail: CampusDetail }) {
	const meta = ROUTE_META[detail.route];
	const drive = detail.drive;
	return (
		<div className="space-y-3 text-xs">
			<div className="flex items-center gap-2">
				<meta.Icon className="h-4 w-4 shrink-0" style={{ color: meta.color }} aria-hidden />
				<p className="text-sm font-semibold text-foreground">
					{meta.label}
					{detail.campusIntern ? (detail.route === "ppo" ? " · campus intern" : " · PPO") : ""}
				</p>
			</div>
			<p className="text-muted-foreground">{meta.hint}.</p>

			{detail.review ? (
				<p className="flex gap-1.5 rounded-md border border-border bg-muted/50 p-2 text-foreground">
					<AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden />
					{CAMPUS_REVIEW_TEXT[detail.review]}
				</p>
			) : null}

			<dl className="space-y-1.5">
				<Row label="Tagger's call">
					{!detail.judged
						? "Not run: no posted drive resembled this company"
						: detail.taggedOnCampus
							? "Likely on campus"
							: "Likely off campus"}
				</Row>
				{detail.confidence != null ? (
					<Row label="On-campus odds">
						<span className="inline-flex items-center gap-2">
							<Meter confidence={detail.confidence} color={meta.color} />
							<span className="tabular-nums">{Math.round(detail.confidence * 100)}%</span>
							<span className="text-muted-foreground">
								({confidenceTier(detail.confidence).label}; 70% needed)
							</span>
						</span>
					</Row>
				) : null}
				<Row label="Posted drive">
					{drive ? (
						<>
							{drive.company}
							{drive.profile ? ` · ${drive.profile}` : ""}
							<span className="block text-muted-foreground">
								{[drive.category, drive.lpa ? formatPackage(drive.lpa) : null, DRIVE_VIA[drive.via]]
									.filter(Boolean)
									.join(" · ")}
							</span>
						</>
					) : (
						<span className="text-muted-foreground">None found</span>
					)}
				</Row>
				{detail.model ? <Row label="Classified by">{detail.model.replace(/^go\//, "")}</Row> : null}
			</dl>

			{detail.reason ? (
				<div>
					<p className="mb-1 text-muted-foreground">Reasoning</p>
					<p className="border-l-2 pl-2 text-foreground" style={{ borderColor: meta.color }}>
						{detail.reason}
					</p>
				</div>
			) : null}

			{detail.signals.length ? (
				<div>
					<p className="mb-1 text-muted-foreground">Evidence</p>
					<div className="flex flex-wrap gap-1">
						{detail.signals.map((signal) => (
							<span
								key={signal}
								className="rounded-full border border-border px-2 py-0.5 text-foreground"
							>
								{signal}
							</span>
						))}
					</div>
				</div>
			) : null}

			{detail.emailSubject ? (
				<p className="border-t border-border pt-2 text-muted-foreground">
					Mail: <span className="text-foreground">{detail.emailSubject.replace(/\s+/g, " ")}</span>
				</p>
			) : null}
		</div>
	);
}

type Props = {
	route: CampusRoute;
	/** Judge confidence, 0..1. Only drawn for on-campus offers. */
	confidence?: number | null;
	/** PPO whose internship came through a campus drive. */
	campusIntern?: boolean;
	/** When given, hovering or focusing the badge shows the full trace. */
	detail?: CampusDetail;
	size?: "sm" | "md";
	className?: string;
};

/**
 * Pill naming how an offer was likely won. On-campus pills carry a four-step
 * meter for the tagger's confidence, so a 72% match reads weaker than a 95% one.
 */
export default function CampusBadge({
	route,
	confidence,
	campusIntern = false,
	detail,
	size = "sm",
	className,
}: Props) {
	const meta = ROUTE_META[route];
	const showMeter = route === "on" && confidence != null;
	const percent = showMeter ? Math.round(confidence * 100) : null;
	const internNote = campusIntern ? (route === "ppo" ? "campus intern" : "PPO") : null;
	const label = internNote ? `${meta.label} · ${internNote}` : meta.label;
	const description = showMeter
		? `${label}, ${percent}% confidence. ${meta.hint}.`
		: `${label}. ${meta.hint}.`;

	const pill = (
		<span
			aria-label={description}
			tabIndex={detail ? 0 : undefined}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border font-medium text-foreground whitespace-nowrap",
				detail && "cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
			{label}
			{showMeter ? (
				<span aria-hidden className="flex items-center gap-1 pl-1 ml-0.5 border-l border-border">
					<Meter confidence={confidence} color={meta.color} />
					<span className="tabular-nums text-muted-foreground">{percent}%</span>
				</span>
			) : null}
		</span>
	);

	if (!detail) return pill;
	return (
		<HoverCard openDelay={120} closeDelay={80}>
			<HoverCardTrigger asChild>{pill}</HoverCardTrigger>
			<HoverCardContent align="start" className="w-80" onClick={(event) => event.preventDefault()}>
				<CampusDetailCard detail={detail} />
			</HoverCardContent>
		</HoverCard>
	);
}
