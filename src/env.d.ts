/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_EXT_PUB_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
