import { isAbsolute } from 'node:path';
import type { Runner } from './types.js';
import { runProcess } from './process.js';
import { findExecutable } from './discovery.js';

/** Looper stays an external MIT engine. No changes to ~/.looper or its daemon. */
export class LooperEngine {
  constructor(readonly configPath: string, private readonly runner: Runner = runProcess) {
    if (!isAbsolute(configPath)) throw new Error('Provide an explicit absolute Looper config path');
  }
  private async call(args: string[], cwd: string): Promise<unknown> {
    const binary = await findExecutable('looper');
    if (!binary) throw new Error('Looper is not installed. See docs/looper.md');
    const result = await this.runner({ file: binary, args: ['--config', this.configPath, '--json', ...args] }, { cwd, timeoutMs: 30000 });
    if (result.code !== 0) throw new Error(`Looper failed (${result.code}): ${result.stderr.slice(-2000)}`);
    try { return JSON.parse(result.stdout); } catch { throw new Error('Looper returned an invalid JSON response'); }
  }
  status(cwd: string) { return this.call(['status'], cwd); }
  projects(cwd: string) { return this.call(['project', 'list'], cwd); }
  loops(cwd: string) { return this.call(['loop', 'list'], cwd); }
  work(project: string, issue: number, cwd: string) {
    if (!project || project.startsWith('-') || !Number.isSafeInteger(issue) || issue <= 0) throw new Error('Provide a project ID and positive issue number');
    return this.call(['work', '--project', project, '--issue', String(issue)], cwd);
  }
  review(pr: string, project: string, cwd: string) {
    if (!/^[\w.-]+\/[\w.-]+#[1-9]\d*$/.test(pr) || !project || project.startsWith('-')) throw new Error('Provide owner/repository#number and a project ID');
    return this.call(['review', pr, '--project', project, '--loop'], cwd);
  }
}
