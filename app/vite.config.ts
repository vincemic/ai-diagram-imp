import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Allow overriding base (useful for GitHub Pages). Fallback '/' for local dev.
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    sourcemap: true
  }
});

