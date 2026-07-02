import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  site: "https://tools.complyeaze.com",
  integrations: [react()],
  vite: {
    server: {
      fs: {
        allow: ["../.."],
      },
    },
  },
});
