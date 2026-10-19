import { build } from 'esbuild';
import { build as buildVite } from 'vite';
await buildVite({ configFile: 'apps/desktop/vite.config.ts' });
await build({ entryPoints: { main: 'apps/desktop/electron/main.ts', preload: 'apps/desktop/electron/preload.ts', worker: 'apps/desktop/electron/worker.ts' },
  bundle: true, platform: 'node', format: 'cjs', target: 'node22', outdir: 'dist-electron', outExtension: { '.js': '.cjs' }, external: ['electron'], sourcemap: true });
