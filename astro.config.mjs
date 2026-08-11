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
  // The dashboard nav used to nest routes under a role (/dashboard/teacher,
  // /dashboard/tutor, /dashboard/admin) — see dashboardSections.ts for why
  // that was dropped. These keep old bookmarks/links alive by forwarding to
  // the flat routes. Astro applies `base` to the source keys automatically
  // (matched against the real request path) but NOT to the destination —
  // verified against the emitted dist/ redirect pages, where the "to" target
  // came out as literal, unprefixed "/dashboard/notas" and would 404 on
  // GitHub Pages. Destinations must spell out the base themselves.
  redirects: {
    "/dashboard/teacher": "/tic-campus/dashboard/notas",
    "/dashboard/teacher/revision": "/tic-campus/dashboard/revisiones",
    "/dashboard/teacher/horarios": "/tic-campus/dashboard/grillas-estudiantes",
    "/dashboard/teacher/listados": "/tic-campus/dashboard/listados",
    "/dashboard/tutor": "/tic-campus/dashboard/grillas-estudiantes",
    "/dashboard/tutor/listados": "/tic-campus/dashboard/listados",
    "/dashboard/admin": "/tic-campus/dashboard/estudiantes",
    "/dashboard/admin/materias": "/tic-campus/dashboard/materias",
    "/dashboard/admin/avanzados": "/tic-campus/dashboard/avanzados",
    "/dashboard/admin/horarios": "/tic-campus/dashboard/horarios-materias",
  },
});
