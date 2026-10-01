import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { target: 'es2022', rollupOptions: { input: {
    dashboard: fileURLToPath(new URL('./index.html', import.meta.url)),
    explorer: fileURLToPath(new URL('./kit.html', import.meta.url)),
    takeover: fileURLToPath(new URL('./takeover.html', import.meta.url)),
  } } }
});
