# Runtime architecture

The desktop alpha hosts the existing runtime through Electron main, a narrow preload bridge and per-meeting utility workers. The CLI shares the same task engine.

```text
CLI / Electron main-process IPC
  ├─ discovery: executable discovery + bounded version probes
  ├─ workspace: validate repository → create isolated Git worktree
  ├─ store: per-mission atomic snapshots and exclusive execution lock
  ├─ engine: build → verify → review → rework / complete / pause / block
  │    ├─ CliAgent: Codex or Claude Code
  │    └─ registered verification commands
  └─ LooperEngine: explicit-config JSON CLI bridge to external Looper
```

## Authority and completion

The user's mission specifies the objective, acceptance criteria and host-run verification commands. A builder edits the task worktree. A different harness independently reviews the actual source and test evidence. Its structured decision is the review authority; real command exit codes are the verification authority. Both are required. Neither guarantees all product requirements were correctly specified.

A source fingerprint covers HEAD, tracked and untracked non-ignored files, file modes and symlink targets. Tests that modify source invalidate their evidence. Review-time changes invalidate approval. Fingerprints detect drift; they do not prove semantic correctness or create a security boundary. Ignored generated files are outside this fingerprint, so registered checks must not treat mutable ignored files as authoritative source.

A review is exactly `{verdict, summary, findings}`. Approval with findings and rework without findings are rejected. Arbitrary prose is never parsed as approval. Failure and budget exhaustion preserve an incomplete task.

## Persistence and concurrency

A mission snapshot includes input, current phase, round count, bounded evidence output, review and transition history. Writes use a unique temporary file and atomic rename in a private state directory. This is deliberately a small single-host store, not a database or distributed queue. There is no transactional crash guarantee across the Git worktree creation and the first snapshot save; an interrupted creation may leave a recoverable orphan worktree.

One exclusive lock per mission prevents two executors from editing that task concurrently. Different tasks use different worktrees. Normal pauses release the lock. Hard crashes preserve it; a dead-owner message tells the user to confirm the old process is gone and remove that specific lock before resuming. Locks are never silently stolen. A resumed run starts its next round, preserving edits and previous findings; interrupted rounds consume the original round budget. Timeout is per invocation, not a cumulative lifetime or token budget.

## Adapter boundaries

Codex uses `exec`, workspace-write for the builder, read-only for the reviewer, and an output-last-message file. Claude uses print mode, acceptEdits and file-edit tools for the builder; the reviewer only receives Read/Glob/Grep tools in dontAsk mode. Verification runs in the host, so the Claude builder does not need arbitrary shell permissions. This alpha does not disable all harness safeguards or grant blanket network/publishing authority. A harness that cannot execute within those policies blocks the task with evidence.

A Git worktree separates edits from the user's checkout; it is not an operating-system sandbox. Claude file tools and host verification commands run as the current user. The mission and checks are trusted local input. Do not run untrusted projects as though this were a hardened container.

OpenCode is discovered but is not a local execution adapter yet. Jev is a planned optional ReviewProvider, not a fake working integration. Different harnesses can still use the same underlying model; the runtime does not claim model-vendor independence.

Looper's PR lifecycle, role policies and daemon remain in upstream. AgentHarbor calls the public CLI with explicit configuration and JSON, not Go internals or a copied daemon. The upstream MIT implementation is a credited reference and optional engine dependency; the new repository is not a renamed fork. The bridge currently exposes status, projects, loops, issue execution and continuous PR review. Its completion semantics remain upstream's; enqueueing work does not mark an AgentHarbor local mission complete. No automatic merge is implemented locally.

## Desktop boundary

React renders local state through a typed preload API. Electron uses contextIsolation, a sandboxed renderer and disabled nodeIntegration. A local `harbor://app` protocol serves the bundled renderer with path validation and a restrictive CSP. IPC handlers validate the sender and expose only defined actions; navigation, popups and permission requests are denied.

Filesystem access, project selection, attachments and diffs stay in main. A utility process runs the engine for each active meeting. The engine streams builder/reviewer messages through `onAgentMessage`; the main process serializes registry mutations so concurrent worker events cannot overwrite user messages. User context is reloaded before the next model invocation. Text attachments are bounded to 12 KB.

The private state directory contains `desktop.json`, mission snapshots and an isolated Electron profile. Closing the app requests pause, bounds the shutdown wait and flushes registry writes. Restart restores meetings; it does not silently resume model calls. A separate state directory also has a separate single-instance lock.

The unpackaged native E2E runner can opt into deterministic agents through `AGENTHARBOR_E2E=1`; it displays an explicit test-mode badge. Packaged builds ignore that flag. Browser-only preview uses labeled synthetic state and cannot execute native tasks.

ZIP packaging and native fixture workflows run on Windows, Linux and macOS. Live model validation currently covers macOS. Windows npm shim execution and native model authentication on Windows/Linux remain separate pending work.
