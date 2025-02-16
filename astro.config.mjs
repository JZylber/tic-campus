// @ts-check
import { defineConfig } from "astro/config";

import alpinejs from "@astrojs/alpinejs";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [alpinejs()],
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
  site: "https://jzylber.github.io",
  build: {
    assets: "astro",
  },
  base: "/tic-campus/",
});
