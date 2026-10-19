# Desktop alpha — 0.2.0-alpha.1

This first desktop version implements the approved pure-black, three-pane meeting workspace. The center is an assistant conversation, the left selects local projects/meetings and the right shows the current task, next action and blocker. Acceptance, evidence and history are collapsed by default.

## Run locally

```bash
npm ci
npm run desktop
```

The desktop app needs Electron's runtime download on the first install. The CLI still works with `npm ci --ignore-scripts && npm run build`. `npm run preview:desktop` after `npm run build:desktop` serves a **browser design demo with synthetic data**; it cannot execute tools or access local projects.

1. Add a local Git repository with the folder button or first-run action.
2. Create a meeting with a goal and explicit acceptance criteria. The repository must be clean. The form detects `npm test` where present, otherwise proposes `node --test`; expand verification settings to choose your actual project check.
3. Choose Codex or Claude Code as the executor; the other becomes the independent reviewer. Model credentials stay in those tools' existing local configuration.
4. Start the task. The engine creates an isolated Git worktree, executes changes, runs registered checks, asks the reviewer and automatically returns rejected work within the five-round budget.
5. Inspect changes, test output and review findings in the right pane. Pause/resume uses the same task record. Closing the app pauses active tasks; reopening restores projects, meetings and evidence.

Verification commands run in the isolated worktree. Ignored dependencies such as node_modules are not copied there. Configure commands that prepare/use the worktree correctly; do not treat the original checkout's dependencies as automatically available. Windows native `.exe` harnesses are supported by discovery; npm `.cmd` harness launchers remain outside the alpha execution adapter.

## Conversation behaviour

The host is a deterministic coordinator. Codex and Claude Code produce actual implementation/review messages; the app records task transitions and handoffs. This alpha is execution plus independent review, not an unrestricted parallel group chat. Extra user messages and text attachments become context for the next builder/reviewer invocation. They do not interrupt a model request already in progress. Full @mention routing and free-form multi-agent meetings remain roadmap items.

Text attachments are limited to 12 KB. They are sent to the configured tools when the user sends the message. Task records, messages and raw test outputs stay in the chosen private state directory, by default `~/.agentharbor`. Electron profile/cache files live under its `electron/` subdirectory.

## Platform and testing scope

The same Electron/React/TypeScript source builds on Windows, Linux and macOS. The native smoke test uses real Electron windows, IPC, a real utility process and Git worktrees, with clearly labeled mock agents in unpackaged automation only. It checks creation, execution, verification, independent review, persistence and pause/resume. The packaged application ignores the mock-agent test switch.

A separate live desktop smoke on macOS arm64 used actual Codex and Claude Code. The task completed in one round, verification returned 0, independent review approved the same source fingerprint, and the original checkout remained unchanged. See `live-desktop-smoke-20261019.json`.

Model authentication and live native harnesses on Windows/Linux are separate from the cross-platform fixture smoke. OpenCode execution, Jev, background scheduling, automatic commits/push/merge, automatic dependency installation and arbitrary external actions are not included.

First alpha packages are unsigned. Native application signing, stable icons and production distribution remain release work.
