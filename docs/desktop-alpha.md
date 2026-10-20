# Desktop alpha — 0.2.0-alpha.4

This first desktop version implements the approved pure-black, three-pane meeting workspace. The center is an assistant conversation, the left selects local projects/meetings and the right shows the current task, next action and blocker. Acceptance, evidence and history are collapsed by default.

## Run locally

```bash
npm ci
npm run desktop
```

The desktop app needs Electron's runtime download on the first install. The CLI still works with `npm ci --ignore-scripts && npm run build`. `npm run preview:desktop` after `npm run build:desktop` serves a **browser design demo with synthetic data**; it cannot execute tools or access local projects.

1. Choose a folder or Git project, or type the goal first and choose the folder when starting. Git repositories still need a clean checkout.
2. Type the goal in the main composer and click Start task. The desktop host fills the acceptance criterion from the goal itself, keeps the project's registered checks, and defaults to Codex execution with Claude Code review. Creation starts the task without a second start button.
3. Use Task settings → Advanced settings only for custom acceptance, roles or verification commands. The underlying mission engine still requires real verification and structured independent review; no success is inferred from an agent's claim.
4. Inspect source changes, checks and findings in the task inspector. Opening New task preserves a separate goal draft, while messages continue to belong to the selected existing task.
5. Cancelling the folder picker leaves the draft intact. If creation succeeds but startup fails, the task is selected and retained with a retry action. File changes remain in the isolated copy/worktree.

Verification commands run in the isolated worktree. Ignored dependencies such as node_modules are not copied there. Configure commands that prepare/use the worktree correctly; do not treat the original checkout's dependencies as automatically available. Windows native `.exe` harnesses are supported by discovery; npm `.cmd` harness launchers remain outside the alpha execution adapter.

## Conversation behaviour

The host is a deterministic coordinator. Codex and Claude Code produce actual implementation/review messages; the app records task transitions and handoffs. This alpha is execution plus independent review, not an unrestricted parallel group chat. Extra user messages and text attachments become context for the next builder/reviewer invocation. They do not interrupt a model request already in progress. Full @mention routing and free-form multi-agent meetings remain roadmap items.

Text attachments are limited to 12 KB. They are sent to the configured tools when the user sends the message. Task records, messages and raw test outputs stay in the chosen private state directory, by default `~/.agentharbor`. Electron profile/cache files live under its `electron/` subdirectory.

## Platform and testing scope

The same Electron/React/TypeScript source builds on Windows, Linux and macOS. The native smoke test uses real Electron windows, IPC, a real utility process and Git worktrees, with clearly labeled mock agents in unpackaged automation only. It checks creation, execution, verification, independent review, persistence and pause/resume. The packaged application ignores the mock-agent test switch.

A separate live desktop smoke on macOS arm64 used actual Codex and Claude Code. The task completed in one round, verification returned 0, independent review approved the same source fingerprint, and the original checkout remained unchanged. See `live-desktop-smoke-20261019.json`.

Model authentication and live native harnesses on Windows/Linux are separate from the cross-platform fixture smoke. OpenCode execution, Jev, background scheduling, automatic commits/push/merge, automatic dependency installation and arbitrary external actions are not included.

First alpha packages are unsigned. Native application signing, stable icons and production distribution remain release work.

## Folder support in alpha.2

Ordinary folders are detected from filesystem metadata, with no Git subprocess needed. The copy and its baseline manifest are private local state. Codex receives `--skip-git-repo-check` only for directory-copy tasks; verification/review use directory fingerprints. No source `.git` is created and no result is applied automatically. Open the workspace to retrieve completed files. File changes are shown as additions/modifications/deletions, not a Git patch.

Excluded directory names and symlink restrictions are documented in README. There is no fixed application cap on file counts or sizes; directory entries and file contents are streamed. Empty directories are not copied; file content and permission bits are preserved. Old mission snapshots without `workspaceKind` continue using Git fingerprints.

## Quick creation — alpha.4

The desktop-only create input can omit acceptance, checks and role IDs. Defaults are resolved in DesktopService before calling the strict runtime createMission API: acceptance is the literal user goal, checks come from the registered project, builder is Codex and reviewer is Claude Code. This does not generate detailed acceptance rules or infer arbitrary commands from project content. The default fallback remains `node --test` when no npm test script was detected; a folder without tests has no claim of regression-test coverage. Use Task settings for task-specific checks. CLI mission files still require explicit acceptance and checks.
