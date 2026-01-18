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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";

type ResourceModalProps = {
	isOpen: boolean;
	onClose: () => void;
	mode: "create" | "update";
	resourceType: "notices" | "placement-offers";
	initialData?: any;
	onSuccess: () => void;
};

export default function ResourceModal({
	isOpen,
	onClose,
	mode,
	resourceType,
	initialData,
	onSuccess,
}: ResourceModalProps) {
	const [activeTab, setActiveTab] = useState("form");
	const [formData, setFormData] = useState<any>({});
	const [jsonString, setJsonString] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (isOpen) {
			if (mode === "update" && initialData) {
				setFormData({ ...initialData });
				setJsonString(JSON.stringify(initialData, null, 2));
			} else {
				setFormData({});
				setJsonString(JSON.stringify({}, null, 2));
			}
			setError("");
		}
	}, [isOpen, mode, initialData]);

	// Sync Form -> JSON when tab changes to JSON
	const handleTabChange = (value: string) => {
		setActiveTab(value);
		if (value === "json") {
			setJsonString(JSON.stringify(formData, null, 2));
		} else {
			try {
				const parsed = JSON.parse(jsonString);
				setFormData(parsed);
				setError("");
			} catch (e) {
				setError("Invalid JSON, cannot switch to form view.");
				// Prevent switch if invalid? Or just show error in form?
				// For now, let's just show error and keep previous formData or try best effort
			}
		}
	};

	const handleInputChange = (field: string, value: any) => {
		setFormData((prev: any) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		setLoading(true);
		setError("");

		try {
			let payload = formData;
			// If currently in JSON mode, parse that source of truth
			if (activeTab === "json") {
				try {
					payload = JSON.parse(jsonString);
				} catch (e) {
					throw new Error("Invalid JSON in editor");
				}
			}

			const resourceId =
				initialData?.id || initialData?._id || formData?.id || formData?._id;
			if (mode === "update" && !resourceId) {
				throw new Error("Missing ID for update. Please refresh and try again.");
			}

			const url =
				mode === "create"
					? `/api/admin/${resourceType}`
					: `/api/admin/${resourceType}/${resourceId}`;

			console.log("ResourceModal submit:", {
				resourceId,
				resourceType,
				url,
				mode,
				initialData,
			});

			const method = mode === "create" ? "POST" : "PUT";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			let json;
			const text = await res.text();
			try {
				json = JSON.parse(text);
			} catch (e) {
				// If response is not JSON, use the text as error if bad status, or generic error
				if (!res.ok) {
					throw new Error(
						`Server Error (${res.status}): ${text.substring(0, 100)}...`,
					);
				}
				throw new Error("Invalid response from server");
			}

			if (!json.ok) {
				throw new Error(json.error || "Failed to save");
			}

			onSuccess();
			onClose();
		} catch (err: any) {
			console.error("Save error:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Add" : "Edit"}{" "}
						{resourceType === "notices" ? "Notice" : "Placement Offer"}
					</DialogTitle>
				</DialogHeader>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
						{error}
					</div>
				)}

				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="form">Form View</TabsTrigger>
						<TabsTrigger value="json">Raw JSON</TabsTrigger>
					</TabsList>

					<TabsContent value="form" className="space-y-4 py-4">
						{/* Common Fields */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">
									Original Title (Title)
								</label>
								<Input
									value={formData.title || ""}
									onChange={(e) => handleInputChange("title", e.target.value)}
									placeholder="Official Title"
								/>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium">Category</label>
								<Input
									value={formData.category || ""}
									onChange={(e) =>
										handleInputChange("category", e.target.value)
									}
									placeholder="e.g. job posting, update"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">
									Time Sent / Saved At (Sort Order)
								</label>
								<div className="flex gap-2">
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant={"outline"}
												className={cn(
													"w-[240px] pl-3 text-left font-normal",
													!formData.saved_at &&
														!formData.time_sent &&
														"text-muted-foreground",
												)}
											>
												{formData.saved_at || formData.time_sent ? (
													format(
														new Date(formData.saved_at || formData.time_sent),
														"PPP",
													)
												) : (
													<span>Pick a date</span>
												)}
												<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={
													formData.saved_at || formData.time_sent
														? new Date(formData.saved_at || formData.time_sent)
														: undefined
												}
												onSelect={(date) => {
													if (!date) return;
													const current =
														formData.saved_at || formData.time_sent
															? new Date(
																	formData.saved_at || formData.time_sent,
																)
															: new Date();
													date.setHours(current.getHours());
													date.setMinutes(current.getMinutes());
													date.setSeconds(current.getSeconds());
													const iso = date.toISOString();
													handleInputChange("saved_at", iso);
													handleInputChange("time_sent", iso);
												}}
												disabled={(date) =>
													date > new Date("2100-01-01") ||
													date < new Date("1900-01-01")
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
									<div className="relative">
										<Input
											type="time"
											className="w-[120px]"
											value={(() => {
												const val = formData.saved_at || formData.time_sent;
												if (!val) return "";
												try {
													const d = new Date(val);
													return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
												} catch {
													return "";
												}
											})()}
											onChange={(e) => {
												const timeStr = e.target.value;
												if (!timeStr) return;
												const current =
													formData.saved_at || formData.time_sent
														? new Date(formData.saved_at || formData.time_sent)
														: new Date();
												const [hours, minutes] = timeStr.split(":").map(Number);
												current.setHours(hours);
												current.setMinutes(minutes);
												handleInputChange("saved_at", current.toISOString());
												handleInputChange("time_sent", current.toISOString());
											}}
										/>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									Modifying this changes the notice's position in the feed.
								</p>
							</div>
							{/* Removed redundant read-only field */}
						</div>

						{/* Resource Specific Fields */}
						{resourceType === "notices" && (
							<>
								<div className="space-y-2">
									<label className="text-sm font-medium">
										Formatted Message
									</label>
									<textarea
										className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										value={formData.formatted_message || ""}
										onChange={(e) =>
											handleInputChange("formatted_message", e.target.value)
										}
										placeholder="Markdown content..."
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Content (Raw)</label>
									<textarea
										className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										value={formData.content || ""}
										onChange={(e) =>
											handleInputChange("content", e.target.value)
										}
									/>
								</div>
							</>
						)}

						{resourceType === "placement-offers" && (
							<>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<label className="text-sm font-medium">Company</label>
										<Input
											value={formData.company || ""}
											onChange={(e) =>
												handleInputChange("company", e.target.value)
											}
										/>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium">Joining Date</label>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant={"outline"}
													className={cn(
														"w-full pl-3 text-left font-normal",
														!formData.joining_date && "text-muted-foreground",
													)}
												>
													{formData.joining_date ? (
														format(new Date(formData.joining_date), "PPP")
													) : (
														<span>Pick a date</span>
													)}
													<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={
														formData.joining_date
															? new Date(formData.joining_date)
															: undefined
													}
													onSelect={(date) => {
														if (date) {
															// For joining date, we just need YYYY-MM-DD usually, but storing ISO is fine
															handleInputChange(
																"joining_date",
																date.toISOString(),
															);
														}
													}}
													disabled={(date) =>
														date > new Date("2100-01-01") ||
														date < new Date("1900-01-01")
													}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium">
											Number of Offers
										</label>
										<Input
											type="number"
											value={formData.number_of_offers || ""}
											onChange={(e) =>
												handleInputChange(
													"number_of_offers",
													Number(e.target.value),
												)
											}
										/>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium">
											Locations (comma separated)
										</label>
										<Input
											value={
												Array.isArray(formData.job_location)
													? formData.job_location.join(", ")
													: formData.job_location || ""
											}
											onChange={(e) => {
												const val = e.target.value;
												handleInputChange(
													"job_location",
													val
														.split(",")
														.map((s: string) => s.trim())
														.filter(Boolean),
												);
											}}
											placeholder="e.g. Bangalore, Mumbai"
										/>
									</div>
								</div>

								{/* Roles Editor */}
								<div className="space-y-2 border p-3 rounded-md">
									<label className="text-sm font-medium mb-2 block">
										Roles & Packages
									</label>
									{Array.isArray(formData.roles) &&
										formData.roles.map((role: any, idx: number) => (
											<div key={idx} className="flex gap-2 mb-2 items-center">
												<Input
													placeholder="Role Title"
													className="flex-1"
													value={role.role || ""}
													onChange={(e) => {
														const newRoles = [...formData.roles];
														newRoles[idx] = {
															...newRoles[idx],
															role: e.target.value,
														};
														handleInputChange("roles", newRoles);
													}}
												/>
												<Input
													placeholder="Package (LPA)"
													type="number"
													className="w-32"
													value={role.package || ""}
													onChange={(e) => {
														const newRoles = [...formData.roles];
														newRoles[idx] = {
															...newRoles[idx],
															package: Number(e.target.value),
														};
														handleInputChange("roles", newRoles);
													}}
												/>
												<Button
													variant="destructive"
													size="icon"
													onClick={() => {
														const newRoles = formData.roles.filter(
															(_: any, i: number) => i !== idx,
														);
														handleInputChange("roles", newRoles);
													}}
												>
													X
												</Button>
											</div>
										))}
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											const newRoles = [
												...(formData.roles || []),
												{ role: "", package: 0 },
											];
											handleInputChange("roles", newRoles);
										}}
									>
										+ Add Role
									</Button>
								</div>

								{/* Students Selected Editor */}
								<div className="space-y-2 border p-3 rounded-md bg-muted/20">
									<label className="text-sm font-medium mb-2 block">
										Students Selected
									</label>
									<div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
										{Array.isArray(formData.students_selected) &&
											formData.students_selected.map(
												(student: any, idx: number) => (
													<div
														key={idx}
														className="flex gap-2 mb-2 items-center text-sm"
													>
														<span className="w-6 text-muted-foreground">
															{idx + 1}.
														</span>
														<Input
															placeholder="Name"
															className="flex-1 min-w-[120px]"
															value={student.name || ""}
															onChange={(e) => {
																const newStudents = [
																	...formData.students_selected,
																];
																newStudents[idx] = {
																	...newStudents[idx],
																	name: e.target.value,
																};
																handleInputChange(
																	"students_selected",
																	newStudents,
																);
															}}
														/>
														<Input
															placeholder="Enrollment No."
															className="w-32"
															value={
																student.enrollment_number ||
																student.enroll ||
																""
															}
															onChange={(e) => {
																const newStudents = [
																	...formData.students_selected,
																];
																// Normalizing to enrollment_number
																newStudents[idx] = {
																	...newStudents[idx],
																	enrollment_number: e.target.value,
																};
																handleInputChange(
																	"students_selected",
																	newStudents,
																);
															}}
														/>
														<Input
															placeholder="Pkg"
															type="number"
															className="w-20"
															value={student.package || ""}
															onChange={(e) => {
																const newStudents = [
																	...formData.students_selected,
																];
																newStudents[idx] = {
																	...newStudents[idx],
																	package: Number(e.target.value),
																};
																handleInputChange(
																	"students_selected",
																	newStudents,
																);
															}}
														/>
														<Button
															variant="destructive"
															size="icon"
															className="h-9 w-9"
															onClick={() => {
																const newStudents =
																	formData.students_selected.filter(
																		(_: any, i: number) => i !== idx,
																	);
																handleInputChange(
																	"students_selected",
																	newStudents,
																);
															}}
														>
															X
														</Button>
													</div>
												),
											)}
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											const newStudents = [
												...(formData.students_selected || []),
												{ name: "", enrollment_number: "", package: 0 },
											];
											handleInputChange("students_selected", newStudents);
										}}
									>
										+ Add Student
									</Button>
								</div>

								<div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm text-yellow-800">
									<p>
										<strong>Note:</strong> advanced fields like
										`students_selected` are best edited in the{" "}
										<strong>Raw JSON</strong> tab.
									</p>
								</div>
							</>
						)}
					</TabsContent>

					<TabsContent value="json" className="py-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">JSON Data</label>
							<textarea
								className="font-mono text-xs flex min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								value={jsonString}
								onChange={(e) => setJsonString(e.target.value)}
								placeholder="{ ... }"
							/>
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={loading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={loading}>
						{loading ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
