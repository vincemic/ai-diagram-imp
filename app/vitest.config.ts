import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  include: ['tests/unit/**/*.spec.ts', 'src/tests/unit/**/*.spec.ts'],
    coverage: {
      enabled: false
    }
  }
});
