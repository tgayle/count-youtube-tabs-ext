import manifest from "./src/manifest";
import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid(), crx({ manifest })],
  build: {
    minify: false,
    sourcemap: true,
  },
});
