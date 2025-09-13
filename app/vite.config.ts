import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages the site is served from /<repo-name>/.
// We detect build vs dev: dev (vite serve) should use '/', production build uses the repo base unless overridden.
// Still allow manual override via VITE_BASE_PATH.
const repoBase = '/ai-diagram-imp/';

export default defineConfig(({ command }) => {
  // Use standard Vite env loading. If user wants to override they can define VITE_BASE_PATH.
  // During config evaluation we don't have import.meta.env, but Vite injects env vars onto process.env.
  // To avoid needing Node types, access via (globalThis as any).process?.env.
  // Fallback to undefined if not present.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const explicit = (globalThis as any).process?.env?.VITE_BASE_PATH as string | undefined;
  const base = explicit || (command === 'serve' ? '/' : repoBase);
  return {
    base,
    plugins: [react()],
    build: { sourcemap: true }
  };
});

