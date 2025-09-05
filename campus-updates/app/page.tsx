import Layout from "@/components/Layout";
import NoticesClient from "@/components/NoticesClient";

export default function HomePage() {
	return (
		<Layout>
			<main className="card" role="main">
				<h1>Service unavailable Permanently</h1>
				<p>This site will not be accessible.</p>
				<p className="muted">
					If you believe this is an error, please try again later.
				</p>
			</main>
			{/* <NoticesClient /> */}
		</Layout>
	);
}
