import Layout from "@/components/Layout";
import NoticesClient from "@/components/NoticesClient";

export default function HomePage() {
	return (
		<Layout>
			<>
				<style>{`
		  :root { color-scheme: light dark; }
		  html, body { height: 100%; margin: 0; }
		  body {
			display: grid;
			place-items: center;
			font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
			line-height: 1.5;
		  }
		  .card {
			padding: 2rem 2.5rem;
			border-radius: 14px;
			border: 1px solid rgba(0,0,0,0.1);
			box-shadow: 0 2px 24px rgba(0,0,0,0.06);
		  }
		  h1 { margin: 0 0 0.5rem; font-size: 1.75rem; }
		  p { margin: 0.25rem 0; opacity: 0.8; }
		  .muted { font-size: 0.9rem; opacity: 0.65; }
		`}</style>

				<main className="card" role="main">
					<h1>Service unavailable Permanently</h1>
					<p>This site will not be accessible.</p>
					<p className="muted">
						As per the instructions of the JIIT Administration.
					</p>
				</main>
			</>
			{/* <NoticesClient /> */}
		</Layout>
	);
}
