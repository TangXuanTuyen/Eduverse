import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Kiểm thử chạy với Supabase thật (project dev). Cần .env.local và đã chạy `npm run seed`.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./', import.meta.url)) } },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
