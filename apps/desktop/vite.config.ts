import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ root: resolve('apps/desktop'), base: './', build: { outDir: resolve('dist-desktop'), emptyOutDir: true }, server: { host: '127.0.0.1', port: 5178 }, preview: { host: '127.0.0.1', port: 5178 } });
