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
	return (
		<div>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center">
					<UsersIcon className="w-5 h-5 mr-2" />
					<span className="font-semibold">
						{students.length} Students Shortlisted
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onToggle}
						className="hover-theme"
					>
						{expanded ? "Hide List" : "View List"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
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
									r
										.map((c) => '"' + String(c).replace(/"/g, '""') + '"')
										.join(",")
								)
								.join("\n");
							const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
							const url = URL.createObjectURL(blob);
							const a = document.createElement("a");
							a.href = url;
							a.download = "shortlist.csv";
							a.click();
							URL.revokeObjectURL(url);
						}}
						className="text-sm font-medium hover-theme"
					>
						<DownloadIcon className="w-4 h-4 mr-2" /> Export CSV
					</Button>
				</div>
			</div>

			{expanded && (
				<div className="overflow-x-auto max-h-80 overflow-y-auto border rounded-lg">
					<table className="w-full text-sm">
						<thead className="sticky top-0 border-b">
							<tr>
								<th className="text-left py-3 px-4 font-semibold">Name</th>
								<th className="text-left py-3 px-4 font-semibold">
									Enrollment
								</th>
								<th className="text-left py-3 px-4 font-semibold">Email</th>
								<th className="text-left py-3 px-4 font-semibold">Venue</th>
							</tr>
						</thead>
						<tbody>
							{students.map((student, idx) => (
								<tr key={idx} className="border-b last:border-b-0 hover-theme">
									<td className="py-3 px-4 font-medium">{student.name}</td>
									<td className="py-3 px-4 font-mono text-sm">
										{student.enrollment_number}
									</td>
									<td className="py-3 px-4 text-sm">{student.email ?? "-"}</td>
									<td className="py-3 px-4 text-sm">{student.venue ?? "-"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
