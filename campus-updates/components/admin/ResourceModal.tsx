"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	mode: "create" | "update";
	resourceType: "notices" | "placement-offers";
	initialData?: any;
	onSuccess?: () => void;
};

export default function ResourceModal({
	isOpen,
	onClose,
	mode,
	resourceType,
	initialData,
	onSuccess,
}: Props) {
	const [formData, setFormData] = useState<any>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen && initialData) {
			setFormData(initialData);
		} else if (isOpen) {
			setFormData({});
		}
	}, [isOpen, initialData]);

	const handleChange = (field: string, value: string) => {
		setFormData((prev: any) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const url =
				mode === "create"
					? `/api/admin/${resourceType}`
					: `/api/admin/${resourceType}/${initialData.id || initialData._id}`;

			const method = mode === "create" ? "POST" : "PUT";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const json = await res.json();
			if (!json.ok) throw new Error(json.error || "Operation failed");

			onSuccess?.();
			onClose();
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Create" : "Edit"}{" "}
						{resourceType === "notices" ? "Notice" : "Placement Offer"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="p-3 bg-red-100 text-red-700 rounded text-sm">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							value={formData.title || ""}
							onChange={(e) => handleChange("title", e.target.value)}
							placeholder="Notice Title"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="category">Category</Label>
						<Input
							id="category"
							value={formData.category || ""}
							onChange={(e) => handleChange("category", e.target.value)}
							placeholder="e.g. job posting, update, placement offer"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="formatted_message">Message (Markdown/Text)</Label>
						<Textarea
							id="formatted_message"
							value={formData.formatted_message || ""}
							onChange={(e) =>
								handleChange("formatted_message", e.target.value)
							}
							placeholder="Main content here..."
							className="min-h-[200px]"
						/>
					</div>

					{/* Additional fields based on resource type could go here */}
					{resourceType === "placement-offers" && (
						<div className="space-y-2">
							<Label htmlFor="company">Company</Label>
							<Input
								id="company"
								value={formData.company || ""}
								onChange={(e) => handleChange("company", e.target.value)}
							/>
						</div>
					)}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
