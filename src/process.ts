import { spawn } from 'node:child_process';
import type { Runner } from './types.js';

/** Arguments never cross a shell. Prompts travel over stdin, not command strings. */
export const runProcess: Runner = async (command, options) => {
  if (!command.file || command.file.includes('\0') || command.args.some(x => x.includes('\0'))) throw new Error('Invalid command');
  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) throw new Error('Command timeout must be positive');
  options.signal?.throwIfAborted();
  return await new Promise((resolve, reject) => {
    const child = spawn(command.file, command.args, { cwd: options.cwd, shell: false,
      stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, detached: process.platform !== 'win32' });
    let stdout = '', stderr = '', bytes = 0, failure: Error | undefined;
    let killTimer: NodeJS.Timeout | undefined;
    const kill = (hard: boolean) => {
      try { if (process.platform === 'win32') child.kill(hard ? 'SIGKILL' : 'SIGTERM');
      else if (child.pid) process.kill(-child.pid, hard ? 'SIGKILL' : 'SIGTERM'); } catch { /* process already exited */ }
    };
    const stop = (error: Error) => { if (failure) return; failure = error; kill(false); killTimer = setTimeout(() => kill(true), 1000); killTimer.unref(); };
    const timer = setTimeout(() => stop(new Error('Command timed out')), options.timeoutMs);
    const abort = () => stop(new Error('Task paused by user'));
    options.signal?.addEventListener('abort', abort, { once: true });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    const collect = (stream: 'stdout' | 'stderr', data: string) => {
      bytes += Buffer.byteLength(data, 'utf8');
      if (bytes > 4 * 1024 * 1024) return stop(new Error('Command output exceeded 4 MiB; inspect the harness directly'));
      if (stream === 'stdout') stdout += data; else stderr += data;
    };
    child.stdout.on('data', data => collect('stdout', data));
    child.stderr.on('data', data => collect('stderr', data));
    const cleanup = () => { clearTimeout(timer); if (killTimer) clearTimeout(killTimer); options.signal?.removeEventListener('abort', abort); };
    child.on('error', error => { cleanup(); reject(error); });
    child.on('close', code => { cleanup(); if (failure) reject(failure); else resolve({ code: code ?? 1, stdout, stderr }); });
    child.stdin.on('error', () => { /* EPIPE is reported by the process result */ });
    child.stdin.end(options.input ?? '');
    if (options.signal?.aborted) abort();
  });
};
