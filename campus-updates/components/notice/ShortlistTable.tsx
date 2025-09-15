"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { UsersIcon } from "lucide-react";

type Student = {
	name: string;
	enrollment_number: string;
	email?: string;
	venue?: string;
};

type Props = {
	students: Student[];
	expanded: boolean;
	onToggle: () => void;
};

export default function ShortlistTable({
	students,
	expanded,
	onToggle,
}: Props) {
	const exportCsv = () => {
		const rows = [
			["Name", "Enrollment Number", "Email", "Venue"],
			...students.map((s) => [
				s.name,
				s.enrollment_number,
				s.email || "",
				s.venue || "",
			]),
		];
		const csv = rows
			.map((r) =>
				r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")
			)
			.join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "shortlist.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div>
			{/* Summary panel: rounded, bordered, with left count and right controls */}
			<div
				className="rounded-lg p-4 mb-3 border"
				style={{
					backgroundColor: "var(--primary-color)",
					borderColor: "var(--border-color)",
				}}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						<UsersIcon
							className="w-5 h-5 mr-3"
							style={{ color: "var(--accent-color)" }}
						/>
						<div>
							<div
								className="text-sm font-medium"
								style={{ color: "var(--text-color)" }}
							>
								{students.length} Students
							</div>
							<div className="text-xs" style={{ color: "var(--label-color)" }}>
								Shortlisted
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={onToggle}
							className="hover-theme"
							style={{
								backgroundColor: "var(--card-bg)",
								borderColor: "var(--border-color)",
								color: "var(--accent-color)",
							}}
						>
							{expanded ? "Hide List" : "View List"}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={exportCsv}
							className="text-sm font-medium hover-theme hidden md:inline-flex"
							style={{
								backgroundColor: "var(--card-bg)",
								borderColor: "var(--border-color)",
								color: "var(--accent-color)",
							}}
						>
							<DownloadIcon className="w-4 h-4 mr-2" /> Export CSV
						</Button>
					</div>
				</div>
			</div>

			{expanded && (
				<>
					{/* Mobile-only action row: show export on small screens when expanded */}
					<div className="md:hidden px-4 pb-3">
						<div className="flex items-center justify-end">
							<Button
								variant="outline"
								size="sm"
								onClick={exportCsv}
								className="text-sm font-medium hover-theme inline-flex"
								style={{
									backgroundColor: "var(--card-bg)",
									borderColor: "var(--border-color)",
									color: "var(--accent-color)",
								}}
							>
								<DownloadIcon className="w-4 h-4 mr-2" /> Export CSV
							</Button>
						</div>
					</div>

					<div
						className="overflow-x-auto max-h-80 overflow-y-auto border rounded-lg"
						style={{
							borderColor: "var(--border-color)",
							backgroundColor: "var(--card-bg)",
						}}
					>
						<table className="w-full text-sm">
							<thead
								className="sticky top-0 border-b"
								style={{
									backgroundColor: "var(--primary-color)",
									borderColor: "var(--border-color)",
								}}
							>
								<tr>
									<th
										className="text-left py-3 px-4 font-semibold"
										style={{ color: "var(--accent-color)" }}
									>
										Name
									</th>
									<th
										className="text-left py-3 px-4 font-semibold"
										style={{ color: "var(--accent-color)" }}
									>
										Enrollment
									</th>
									<th
										className="text-left py-3 px-4 font-semibold"
										style={{ color: "var(--accent-color)" }}
									>
										Email
									</th>
									<th
										className="text-left py-3 px-4 font-semibold"
										style={{ color: "var(--accent-color)" }}
									>
										Venue
									</th>
								</tr>
							</thead>
							<tbody>
								{students.map((student, idx) => (
									<tr
										key={idx}
										className="border-b last:border-b-0 hover-theme"
										style={{
											borderColor: "var(--border-color)",
											backgroundColor:
												idx % 2 ? "var(--card-bg)" : "var(--primary-color)",
										}}
									>
										<td
											className="py-3 px-4 font-medium"
											style={{ color: "var(--text-color)" }}
										>
											{student.name}
										</td>
										<td
											className="py-3 px-4 font-mono text-sm"
											style={{ color: "var(--label-color)" }}
										>
											{student.enrollment_number}
										</td>
										<td
											className="py-3 px-4 text-sm"
											style={{ color: "var(--label-color)" }}
										>
											{student.email ?? "-"}
										</td>
										<td
											className="py-3 px-4 text-sm"
											style={{ color: "var(--label-color)" }}
										>
											{student.venue ?? "-"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</>
			)}
		</div>
	);
}
