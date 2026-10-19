import { realpath, lstat, readFile, readlink, mkdir } from 'node:fs/promises';
import { join, resolve, isAbsolute } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { Command, HarnessId, Mission, Runner } from './types.js';
import { runProcess } from './process.js';
import { Store } from './store.js';

export async function git(args: string[], cwd: string, runner: Runner = runProcess): Promise<string> {
  const result = await runner({ file: 'git', args }, { cwd, timeoutMs: 30_000 });
  if (result.code !== 0) throw new Error(`Git failed: ${result.stderr.trim()}`);
  return result.stdout.trimEnd();
}
export async function fingerprint(workspace: string): Promise<string> {
  const files = (await git(['ls-files', '-c', '-o', '--exclude-standard', '-z'], workspace)).split('\0').filter(Boolean);
  const hash = createHash('sha256');
  hash.update(await git(['rev-parse', 'HEAD'], workspace));
  for (const file of [...new Set(files)].sort()) {
    hash.update('\0' + file + '\0');
    try {
      const path = join(workspace, file), stat = await lstat(path);
      hash.update(String(stat.mode & 0o777));
      if (stat.isSymbolicLink()) hash.update('symlink:' + await readlink(path));
      else if (stat.isFile()) hash.update(await readFile(path));
      else throw new Error('Submodules and special files are not supported in this alpha');
    } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') hash.update('deleted'); else throw error; }
  }
  return hash.digest('hex');
}
export interface MissionInput {
  repository: string; goal: string; acceptance: string[]; builder: HarnessId; reviewer: HarnessId;
  checks: Command[]; maxRounds?: number; timeoutMs?: number;
}
export function validateInput(input: MissionInput) {
  if (!input || typeof input !== 'object') throw new Error('Mission must be an object');
  if (typeof input.goal !== 'string' || !input.goal.trim() || input.goal.length > 16000) throw new Error('Provide a goal of 1–16000 characters');
  if (typeof input.repository !== 'string' || !isAbsolute(input.repository)) throw new Error('Repository must be an absolute path');
  if (!Array.isArray(input.acceptance) || !input.acceptance.length || input.acceptance.some(x => typeof x !== 'string' || !x.trim())) throw new Error('Provide explicit acceptance criteria');
  if (!['codex', 'claude'].includes(input.builder) || !['codex', 'claude'].includes(input.reviewer) || input.builder === input.reviewer) throw new Error('Choose different supported builder and reviewer harnesses (codex / claude)');
  if (!Array.isArray(input.checks) || !input.checks.length || input.checks.some(x => !x || typeof x.file !== 'string' || !x.file || x.file.startsWith('-') || !Array.isArray(x.args) || x.args.some(a => typeof a !== 'string' || a.includes('\0')))) throw new Error('Provide at least one verification command as file + args');
  const rounds = input.maxRounds ?? 3, timeout = input.timeoutMs ?? 1_800_000;
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 20) throw new Error('maxRounds must be 1–20');
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 86_400_000) throw new Error('timeoutMs must be 1000–86400000');
}
export async function createMission(input: MissionInput, store: Store): Promise<Mission> {
  validateInput(input);
  const repository = await realpath(resolve(input.repository));
  const top = await realpath(await git(['rev-parse', '--show-toplevel'], repository));
  if (repository !== top) throw new Error('Register the Git repository root');
  if ((await git(['status', '--porcelain'], repository)).trim()) throw new Error('Commit or stash repository changes before creating a mission');
  const baseCommit = await git(['rev-parse', 'HEAD'], repository);
  const id = randomUUID();
  await store.init();
  const workspace = join(store.root, 'workspaces', id);
  await mkdir(join(store.root, 'workspaces'), { recursive: true, mode: 0o700 });
  await git(['worktree', 'add', '-b', 'codex/harbor-' + id, workspace, baseCommit], repository);
  const now = new Date().toISOString();
  const mission: Mission = { schemaVersion: 1, id, goal: input.goal, acceptance: input.acceptance,
    builder: input.builder, reviewer: input.reviewer, repository, workspace, baseCommit, checks: input.checks,
    maxRounds: input.maxRounds ?? 3, timeoutMs: input.timeoutMs ?? 1_800_000,
    phase: 'ready', round: 0, createdAt: now, updatedAt: now, events: [], evidence: [], feedback: '' };
  await store.save(mission);
  return mission;
}
