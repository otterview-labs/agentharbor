import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const files = (await readdir('dist/test', { recursive: true }))
  .filter(path => path.endsWith('.test.js')).sort().map(path => join('dist/test', path));
if (!files.length) throw new Error('No compiled tests found');
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit', shell: false });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
