/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORCE_SPLASH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv & {
    readonly PROD: boolean;
  };
}
