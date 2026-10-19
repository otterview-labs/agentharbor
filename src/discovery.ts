import { access, realpath } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, join } from 'node:path';
import { homedir } from 'node:os';
import { runProcess } from './process.js';
import type { Runner } from './types.js';

export const toolIds = ['codex', 'claude', 'opencode', 'looper', 'looperd', 'git', 'gh'] as const;
export interface DiscoveredTool { id: typeof toolIds[number]; installed: boolean; path?: string; version?: string; authentication: 'not-checked'; runnable: boolean; note?: string }
export async function findExecutable(name: string, searchPath = process.env.PATH ?? '', platform = process.platform): Promise<string | undefined> {
  const suffixes = platform === 'win32' ? ['', '.exe', '.com', '.cmd', '.bat'] : [''];
  const dirs = searchPath.split(delimiter).filter(Boolean);
  if (platform !== 'win32') dirs.push(join(homedir(), '.local', 'bin'), join(homedir(), 'bin'), '/opt/homebrew/bin', '/usr/local/bin');
  for (const dir of [...new Set(dirs)]) for (const suffix of suffixes) {
    const path = join(dir, name + suffix);
    try { await access(path, platform === 'win32' ? constants.F_OK : constants.X_OK); return await realpath(path); } catch { /* next candidate */ }
  }
  return undefined;
}
export async function discover(runner: Runner = runProcess): Promise<DiscoveredTool[]> {
  return await Promise.all(toolIds.map(async id => {
    const path = await findExecutable(id);
    if (!path) return { id, installed: false, runnable: false, authentication: 'not-checked' as const };
    if (/\.(cmd|bat)$/i.test(path)) return { id, installed: true, path, runnable: false, authentication: 'not-checked' as const,
      note: 'Windows command shim found. Native executable adapter is required in this alpha.' };
    try {
      const result = await runner({ file: path, args: ['--version'] }, { cwd: homedir(), timeoutMs: 8000 });
      return { id, installed: true, path, runnable: result.code === 0, authentication: 'not-checked' as const,
        version: (result.stdout || result.stderr).trim().split('\n')[0]?.slice(0, 200) ?? '' };
    } catch {
      return { id, installed: true, path, runnable: false, authentication: 'not-checked' as const, note: 'Version probe failed or timed out' };
    }
  }));
}
