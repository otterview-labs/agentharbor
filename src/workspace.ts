import { realpath, lstat, readFile, readlink, mkdir, rm } from 'node:fs/promises';
import { join, resolve, isAbsolute, dirname, relative } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { Command, HarnessId, Mission, Runner } from './types.js';
import { runProcess } from './process.js';
import { Store } from './store.js';
import { directoryManifest, manifestFingerprint, copyDirectory, saveDirectoryBaseline } from './directory.js';
import type { WorkspaceKind } from './types.js';

export async function git(args: string[], cwd: string, runner: Runner = runProcess): Promise<string> {
  const result = await runner({ file: 'git', args }, { cwd, timeoutMs: 30_000 });
  if (result.code !== 0) throw new Error(`Git failed: ${result.stderr.trim()}`);
  return result.stdout.trimEnd();
}
export async function fingerprint(workspace: string, kind: WorkspaceKind = 'git-worktree'): Promise<string> {
  if (kind === 'directory-copy') return manifestFingerprint(await directoryManifest(workspace));
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
  if (typeof input.repository !== 'string' || !isAbsolute(input.repository)) throw new Error('Project folder must be an absolute path');
  if (!Array.isArray(input.acceptance) || !input.acceptance.length || input.acceptance.some(x => typeof x !== 'string' || !x.trim())) throw new Error('Provide explicit acceptance criteria');
  if (!['codex', 'claude'].includes(input.builder) || !['codex', 'claude'].includes(input.reviewer) || input.builder === input.reviewer) throw new Error('Choose different supported builder and reviewer harnesses (codex / claude)');
  if (!Array.isArray(input.checks) || !input.checks.length || input.checks.some(x => !x || typeof x.file !== 'string' || !x.file || x.file.startsWith('-') || !Array.isArray(x.args) || x.args.some(a => typeof a !== 'string' || a.includes('\0')))) throw new Error('Provide at least one verification command as file + args');
  const rounds = input.maxRounds ?? 3, timeout = input.timeoutMs ?? 1_800_000;
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 20) throw new Error('maxRounds must be 1–20');
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 86_400_000) throw new Error('timeoutMs must be 1000–86400000');
}
/** Inspect metadata on disk first: ordinary folders never need to launch Git. */
export async function inspectProject(path: string): Promise<{ path: string; kind: 'git' | 'directory' }> {
  const root = await realpath(resolve(path));
  if (!(await lstat(root)).isDirectory()) throw new Error('请选择本地文件夹');
  for (let current = root; ; current = dirname(current)) {
    let metadata = false;
    try { await lstat(join(current, '.git')); metadata = true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    if (metadata) return { path: await realpath(await git(['rev-parse', '--show-toplevel'], root)), kind: 'git' };
    if (dirname(current) === current) break;
  }
  return { path: root, kind: 'directory' };
}
export async function createMission(input: MissionInput, store: Store): Promise<Mission> {
  validateInput(input);
  const project = await inspectProject(input.repository), repository = project.path;
  if (project.kind === 'git' && repository !== await realpath(resolve(input.repository))) throw new Error('Register the Git repository root');
  let baseCommit = '';
  if (project.kind === 'git') {
    if ((await git(['status', '--porcelain'], repository)).trim()) throw new Error('Commit or stash repository changes before creating a mission');
    baseCommit = await git(['rev-parse', 'HEAD'], repository);
  }
  const id = randomUUID();
  await store.init();
  const home = await realpath(store.root), stateRelative = relative(repository, home);
  if (project.kind === 'directory' && (!stateRelative || (!stateRelative.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')) && stateRelative !== '..' && !isAbsolute(stateRelative)))) throw new Error('请选择具体的工作文件夹，不要选择包含 AgentHarbor 数据目录的上级目录');
  const workspace = join(home, 'workspaces', id);
  await mkdir(join(home, 'workspaces'), { recursive: true, mode: 0o700 });
  const workspaceKind: WorkspaceKind = project.kind === 'git' ? 'git-worktree' : 'directory-copy';
  if (workspaceKind === 'git-worktree') {
    await git(['worktree', 'add', '-b', 'codex/harbor-' + id, workspace, baseCommit], repository);
  } else {
    try {
      const baseline = await directoryManifest(repository);
      await copyDirectory(repository, workspace, baseline);
      await saveDirectoryBaseline(home, id, baseline);
    } catch (error) { await rm(workspace, { recursive: true, force: true }); throw error; }
  }
  const now = new Date().toISOString();
  const mission: Mission = { schemaVersion: 1, id, goal: input.goal, acceptance: input.acceptance,
    builder: input.builder, reviewer: input.reviewer, repository, workspace, baseCommit, workspaceKind, checks: input.checks,
    maxRounds: input.maxRounds ?? 3, timeoutMs: input.timeoutMs ?? 1_800_000,
    phase: 'ready', round: 0, createdAt: now, updatedAt: now, events: [], evidence: [], feedback: '' };
  await store.save(mission);
  return mission;
}
