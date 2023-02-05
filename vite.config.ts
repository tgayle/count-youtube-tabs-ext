import manifest from "./src/manifest";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
});
