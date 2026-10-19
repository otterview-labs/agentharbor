export type HarnessId = 'codex' | 'claude';
export interface Command { file: string; args: string[] }
export interface ProcessResult { code: number; stdout: string; stderr: string }
export interface RunOptions { cwd: string; timeoutMs: number; input?: string; signal?: AbortSignal }
export type Runner = (command: Command, options: RunOptions) => Promise<ProcessResult>;
export type WorkspaceKind = 'git-worktree' | 'directory-copy';
export interface AgentRequest { workspaceKind?: WorkspaceKind; role: 'builder' | 'reviewer'; workspace: string; prompt: string; timeoutMs: number; signal?: AbortSignal }
export interface Agent { id: HarnessId; run(request: AgentRequest): Promise<string> }
export type Phase = 'ready' | 'executing' | 'verifying' | 'reviewing' | 'rework' | 'completed' | 'paused' | 'blocked';
export interface Event { at: string; phase: Phase; message: string }
export interface Evidence { round: number; command: Command; code: number; output: string; fingerprint: string }
export interface Review { verdict: 'approve' | 'rework'; summary: string; findings: string[]; fingerprint: string }
export interface Mission {
  schemaVersion: 1; id: string; goal: string; acceptance: string[];
  repository: string; workspace: string; baseCommit: string; workspaceKind?: WorkspaceKind;
  builder: HarnessId; reviewer: HarnessId; checks: Command[];
  maxRounds: number; timeoutMs: number; phase: Phase; round: number;
  createdAt: string; updatedAt: string; events: Event[];
  evidence: Evidence[]; review?: Review; feedback: string;
}
