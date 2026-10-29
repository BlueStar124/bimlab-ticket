import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Libraries that rarely change get their own long-cached chunks, so an app update only re-downloads app code.
function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  if (/node_modules[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'vendor-react';
  if (/node_modules[\/](react-router|react-router-dom)[\/]/.test(id)) return 'vendor-router';
  if (/node_modules[\/]react-icons[\/]/.test(id)) return 'vendor-icons';
  // Loaded on demand by LineFigure, never on first paint.
  if (/node_modules[\/]@lucasmarkes[\/]hairline[\/]/.test(id)) return 'vendor-hairline';
  // Lottie player: fetched on idle or first use, never on first paint.
  if (/node_modules[\/]lottie-web[\/]/.test(id)) return 'vendor-lottie';
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5180,
    proxy: { '/api': 'http://localhost:8086', '/actuator': 'http://localhost:8086' },
  },
  build: {
    rollupOptions: { output: { manualChunks: vendorChunk } },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
