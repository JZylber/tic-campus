// @ts-check
import { defineConfig } from "astro/config";

import alpinejs from "@astrojs/alpinejs";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [alpinejs({ entrypoint: "/src/entrypoint" })],
  output: "static",
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Mermaid lazy-loads each diagram type via dynamic import(). Pre-bundle it
      // eagerly so Vite doesn't re-optimize mid-session when a new diagram type
      // is first rendered — that re-optimization changes the deps hash and makes
      // the in-flight dynamic import fail ("Failed to fetch dynamically imported
      // module"). Only affects dev; production bundles these chunks via Rollup.
      include: ["mermaid"],
    },
  },
  site: "https://jzylber.github.io",
  build: {
    assets: "astro",
  },
  base: "/tic-campus/",
});
