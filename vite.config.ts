import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	server: {
		host: "::",
		port: 8080,
		hmr: true,
	},
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.ico", "robots.txt", "/icons/*.png"],
			manifest: {
				name: "Voxa",
				short_name: "Voxa",
				description:
					"Empowering communication with simplicity, speed, and style.",
				start_url: "/",
				display: "standalone",
				background_color: "#121212", // Deep blue-black background to match Voxa's style
				theme_color: "#9b4dca", // Purple accent color to complement Voxa's design
				icons: [
					{
						src: "/icons/icon-192x192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any maskable",
					},
					{
						src: "/icons/icon-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
}));
