"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ResourceModal from "./ResourceModal";
export default function AdminDashboard() {
	const [activeTab, setActiveTab] = useState<"notices" | "placement-offers">(
		"notices",
	);
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	// Modal State
	const [modalOpen, setModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "update">("create");
	const [selectedItem, setSelectedItem] = useState<any>(null);
	const [sortConfig, setSortConfig] = useState<{
		key: string;
		direction: "asc" | "desc";
	}>({
		key: "saved_at",
		direction: "desc",
	});
	// Auth State
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [authChecking, setAuthChecking] = useState(true);
	const [password, setPassword] = useState("");
	const [loginError, setLoginError] = useState("");
	const checkAuth = async () => {
		try {
			const res = await fetch("/api/admin/check-auth");
			const json = await res.json();
			if (json.authenticated) {
				setIsAuthenticated(true);
			}
		} catch (e) {
			console.error("Auth check failed", e);
		} finally {
			setAuthChecking(false);
		}
	};
	useEffect(() => {
		checkAuth();
	}, []);
	const fetchData = async () => {
		setLoading(true);
		try {
			// Use admin endpoint which has date extraction processing
			const res = await fetch(`/api/admin/${activeTab}`);
			const json = await res.json();
			if (json.ok) {
				setData(json.data || []);
			}
		} catch (error) {
			console.error("Failed to fetch data", error);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		if (isAuthenticated) {
			fetchData();
		}
	}, [activeTab, isAuthenticated]);
	const handleSort = (key: string) => {
		setSortConfig((current) => ({
			key,
			direction:
				current.key === key && current.direction === "asc" ? "desc" : "asc",
		}));
	};
	const filteredData = data
		.filter((item) => {
			const s = search.toLowerCase();
			const title = (item.title || "").toLowerCase();
			const content = (
				item.formatted_message ||
				item.content ||
				""
			).toLowerCase();
			const company = (
				item.company ||
				item.matched_job?.company ||
				""
			).toLowerCase();
			return title.includes(s) || content.includes(s) || company.includes(s);
		})
		.sort((a, b) => {
			const { key, direction } = sortConfig;
			let valA = a[key];
			let valB = b[key];
			// Handle nested or specific keys if needed, defaulting to direct property access
			if (key === "title") {
				valA =
					a.title || a.company || (a.content ? a.content.substring(0, 50) : "");
				valB =
					b.title || b.company || (b.content ? b.content.substring(0, 50) : "");
			}
			if (valA == null) valA = "";
			if (valB == null) valB = "";
			if (valA < valB) return direction === "asc" ? -1 : 1;
			if (valA > valB) return direction === "asc" ? 1 : -1;
			return 0;
		});
	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setLoginError("");
		try {
			const res = await fetch("/api/admin/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});
			const json = await res.json();
			if (json.ok) {
				setIsAuthenticated(true);
			} else {
				setLoginError(json.error || "Login failed");
			}
		} catch (err) {
			setLoginError("Something went wrong");
		} finally {
			setLoading(false);
		}
	};
	if (authChecking) {
		return (
			<div className="flex justify-center py-20">Checking authorization...</div>
		);
	}
	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
				<h1 className="text-2xl font-bold">Admin Login</h1>
				<form
					onSubmit={handleLogin}
					className="w-full max-w-sm space-y-4 border p-6 rounded-md shadow-sm"
				>
					<div className="space-y-2">
						<label className="text-sm font-medium">Password</label>
						<Input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter admin password"
						/>
					</div>
					{loginError && <p className="text-red-500 text-sm">{loginError}</p>}
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Logging in..." : "Login"}
					</Button>
				</form>
			</div>
		);
	}
	const handleAdd = () => {
		setModalMode("create");
		setSelectedItem(null);
		setModalOpen(true);
	};
	const handleEdit = (item: any) => {
		setModalMode("update");
		setSelectedItem(item);
		setModalOpen(true);
	};
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
				<Button onClick={handleAdd}>Add New</Button>
			</div>
			<div className="flex items-center space-x-2">
				<Input
					placeholder="Search..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-sm"
				/>
			</div>
			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as any)}
				className="w-full"
			>
				<TabsList>
					<TabsTrigger value="notices" className="gap-2">
						Notices
						{activeTab === "notices" && (
							<Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
								{data.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="placement-offers" className="gap-2">
						Placement Offers
						{activeTab === "placement-offers" && (
							<Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
								{data.length}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>
				<div className="border rounded-md mt-4">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => handleSort("title")}
								>
									Title / Company{" "}
									{sortConfig.key === "title" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</TableHead>
								<TableHead
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => handleSort("category")}
								>
									Category{" "}
									{sortConfig.key === "category" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</TableHead>
								<TableHead
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => handleSort("time_sent")}
								>
									Time Sent{" "}
									{sortConfig.key === "time_sent" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</TableHead>
								<TableHead
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => handleSort("saved_at")}
								>
									Saved At{" "}
									{sortConfig.key === "saved_at" &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										Loading...
									</TableCell>
								</TableRow>
							) : filteredData.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										No results found.
									</TableCell>
								</TableRow>
							) : (
								filteredData.map((item) => {
									const displayTitle =
										item.title ||
										item.company ||
										(item.content
											? item.content.substring(0, 50) + "..."
											: "Untitled");
									return (
										<TableRow key={item.id || item._id}>
											<TableCell className="font-medium">
												{displayTitle}
												{item.author && (
													<div className="text-xs text-muted-foreground">
														By {item.author}
													</div>
												)}
											</TableCell>
											<TableCell>
												<Badge variant="secondary">
													{item.category || "Unknown"}
												</Badge>
											</TableCell>
											<TableCell>
												{item.time_sent ? (
													<span className="text-green-600 font-mono text-xs">
														{item.time_sent}
													</span>
												) : (
													<span className="text-muted-foreground text-xs italic">
														Missing
													</span>
												)}
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{item.saved_at
													? new Date(item.saved_at).toLocaleString()
													: "-"}
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleEdit(item)}
												>
													Edit
												</Button>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</Tabs>
			<ResourceModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				mode={modalMode}
				resourceType={activeTab}
				initialData={selectedItem}
				onSuccess={() => {
					fetchData();
				}}
			/>
		</div>
	);
}
