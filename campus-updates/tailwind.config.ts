import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
				"gradient-conic":
					"conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
			},
			// Tailwind only gained the numeric min-width/min-height scale in 3.4.
			// Components here were written against it (min-w-40, min-w-5), so map
			// the spacing scale in rather than rewriting every call site.
			minWidth: ({ theme }) => ({ ...theme("spacing") }),
			minHeight: ({ theme }) => ({ ...theme("spacing") }),
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
				card: {
					DEFAULT: "var(--card)",
					foreground: "var(--card-foreground)",
				},
				popover: {
					DEFAULT: "var(--popover)",
					foreground: "var(--popover-foreground)",
				},
				primary: {
					DEFAULT: "var(--primary)",
					foreground: "var(--primary-foreground)",
				},
				secondary: {
					DEFAULT: "var(--secondary)",
					foreground: "var(--secondary-foreground)",
				},
				muted: {
					DEFAULT: "var(--muted)",
					foreground: "var(--muted-foreground)",
				},
				accent: {
					DEFAULT: "var(--accent)",
					foreground: "var(--accent-foreground)",
				},
				destructive: {
					DEFAULT: "var(--destructive)",
					foreground: "var(--destructive-foreground)",
				},
				border: "var(--border)",
				input: "var(--input)",
				ring: "var(--ring)",
				chart: {
					"1": "var(--chart-1)",
					"2": "var(--chart-2)",
					"3": "var(--chart-3)",
					"4": "var(--chart-4)",
					"5": "var(--chart-5)",
				},
				sidebar: {
					DEFAULT: "var(--sidebar)",
					foreground: "var(--sidebar-foreground)",
					primary: "var(--sidebar-primary)",
					"primary-foreground": "var(--sidebar-primary-foreground)",
					accent: "var(--sidebar-accent)",
					"accent-foreground": "var(--sidebar-accent-foreground)",
					border: "var(--sidebar-border)",
					ring: "var(--sidebar-ring)",
				},
			},
			// The typography plugin ships light-mode grays for bold text, bullets,
			// links and table borders, which turn near-invisible on the dark
			// background. Point them at the theme tokens instead, since those
			// already flip under `.dark`.
			typography: {
				DEFAULT: {
					css: {
						"--tw-prose-body": "var(--muted-foreground)",
						"--tw-prose-headings": "var(--foreground)",
						"--tw-prose-lead": "var(--muted-foreground)",
						"--tw-prose-links": "var(--primary)",
						"--tw-prose-bold": "var(--foreground)",
						"--tw-prose-counters": "var(--muted-foreground)",
						"--tw-prose-bullets": "var(--primary)",
						"--tw-prose-hr": "var(--border)",
						"--tw-prose-quotes": "var(--foreground)",
						"--tw-prose-quote-borders": "var(--border)",
						"--tw-prose-captions": "var(--muted-foreground)",
						"--tw-prose-kbd": "var(--foreground)",
						"--tw-prose-code": "var(--foreground)",
						"--tw-prose-pre-code": "var(--foreground)",
						"--tw-prose-pre-bg": "var(--muted)",
						"--tw-prose-th-borders": "var(--border)",
						"--tw-prose-td-borders": "var(--border)",
					},
				},
			},
			fontFamily: {
				sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
				serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
				mono: ["var(--font-mono)", "ui-monospace", "monospace"],
			},
			boxShadow: {
				"2xs": "var(--shadow-2xs)",
				xs: "var(--shadow-xs)",
				sm: "var(--shadow-sm)",
				DEFAULT: "var(--shadow)",
				md: "var(--shadow-md)",
				lg: "var(--shadow-lg)",
				xl: "var(--shadow-xl)",
				"2xl": "var(--shadow-2xl)",
			},
			keyframes: {
				"accordion-down": {
					from: {
						height: "0",
					},
					to: {
						height: "var(--radix-accordion-content-height)",
					},
				},
				"accordion-up": {
					from: {
						height: "var(--radix-accordion-content-height)",
					},
					to: {
						height: "0",
					},
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
