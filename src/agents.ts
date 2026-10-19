import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findExecutable } from './discovery.js';
import { runProcess } from './process.js';
import type { Agent, AgentRequest, HarnessId, Runner } from './types.js';

export class CliAgent implements Agent {
  constructor(readonly id: HarnessId, private readonly runner: Runner = runProcess) {}
  async run(request: AgentRequest): Promise<string> {
    const binary = await findExecutable(this.id);
    if (!binary) throw new Error(`${this.id} is not installed; install and authenticate the harness first`);
    if (/\.(cmd|bat)$/i.test(binary)) throw new Error('Windows npm shims need the future Windows adapter; use a native executable');
    const folder = await mkdtemp(join(tmpdir(), 'agentharbor-message-'));
    const message = join(folder, 'last-message.txt');
    try {
      const args = this.id === 'codex'
        ? ['exec', ...(request.workspaceKind === 'directory-copy' ? ['--skip-git-repo-check'] : []), '--sandbox', request.role === 'builder' ? 'workspace-write' : 'read-only', '-C', request.workspace, '--output-last-message', message, '-']
        : ['--print', '--output-format', 'text', '--no-session-persistence', '--permission-mode', request.role === 'builder' ? 'acceptEdits' : 'dontAsk',
          '--tools', request.role === 'builder' ? 'Read,Glob,Grep,Edit,Write' : 'Read,Glob,Grep'];
      const result = await this.runner({ file: binary, args }, { cwd: request.workspace, timeoutMs: request.timeoutMs, input: request.prompt,
        ...(request.signal ? { signal: request.signal } : {}) });
      if (result.code !== 0) throw new Error(`${this.id} failed (${result.code}): ${result.stderr.slice(-2000)}`);
      const output = this.id === 'codex' ? await readFile(message, 'utf8') : result.stdout;
      if (!output.trim()) throw new Error(`${this.id} returned no final response`);
      return output.trim();
    } finally { await rm(folder, { recursive: true, force: true }); }
  }
}
