import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  name: "Count Youtube Tab Length",
  version: "1.0.0",
  manifest_version: 3,
  permissions: ["tabs", "identity"],
  action: {
    default_popup: "src/popup.html",
  },
  background: {
    type: "module",
    service_worker: "src/background.ts",
  },
  oauth2: {
    client_id: process.env.GOOGLE_CLIENT_ID!,
    scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
  },
  key: process.env.EXT_PUB_KEY,
});
