# AgentHarbor

A local workspace where coding agents collaborate on a goal, verify their changes and independently review the result.

**Status: 0.1.0-alpha.1.** This repository currently ships a TypeScript runtime and CLI, not an Electron desktop release. Desktop mockups are under review. Windows, Linux and macOS are target platforms; native validation and installers are still pending.

[中文说明](README.md) · [Desktop mockups](docs/desktop-preview.md) · [Architecture](docs/architecture.md) · [Roadmap](docs/ROADMAP.md) · [Verification](docs/verification.md)

## Working slice

- Discover installed Codex, Claude Code, OpenCode, Looper, Git and GitHub CLI. Installation/version checks do not imply authenticated model access.
- Create a mission with a goal, explicit acceptance criteria and verification commands in an isolated Git worktree.
- Assign Codex and Claude Code to separate builder/reviewer roles.
- Run implementation → host verification → structured independent review. Failed tests and review findings return to the builder within a bounded round budget.
- Persist phases, verification evidence and review. Detect source changes during verification/review. Pause with Ctrl+C and resume with the same mission ID.
- Call an external Looper engine through an explicit-config JSON CLI bridge. This is separate from the local mission lifecycle.

OpenCode local execution, Jev, structured team meetings, task decomposition, background supervision and opt-in merge/publish are roadmap items. Different harnesses do not guarantee different underlying model vendors. A bounded local mission is not a fully unattended project supervisor.

## Run

Requires Node.js 22.13+, Git, and configured Codex and Claude Code CLIs. macOS has live model smoke coverage. The runtime CI suite passed all six Windows/Linux/macOS jobs on Node 22/24; native harness authentication and desktop installers remain unverified. Windows npm `.cmd` shims are detected but not executable through this alpha adapter.

```bash
npm ci --ignore-scripts
npm run build
node dist/src/cli.js doctor
```

Edit `examples/mission.json`: use your clean Git repository's absolute path, acceptance criteria and real test command. Commit or stash existing changes first.

```bash
node dist/src/cli.js create --file /absolute/path/mission.json
node dist/src/cli.js run --id <mission-id>
node dist/src/cli.js show --id <mission-id>
node dist/src/cli.js list
```

State defaults to `~/.agentharbor`; override with `--home` or `AGENTHARBOR_HOME`. Outputs may include private project material; keep snapshots out of public repositories. Exit 0 means complete, 2 means the mission remains incomplete, 1 means command failure. Edits stay in the worktree; there is no automatic commit/push/merge.

A resumed invocation starts its next round; interrupted rounds consume the same total round budget. Timeout applies per invocation. A hard crash leaves a lock: confirm the owner process has exited, remove the exact lock reported, then resume. A worktree is edit isolation, not a security container. Host verification commands run as the current user. Only register trusted projects and commands.

## Upstream

[Looper](https://github.com/nexu-io/looper), MIT, inspired the persistent role loop and provides an optional external GitHub workflow engine. This is an independent implementation with a CLI adapter, not a renamed fork. Contract reference: upstream commit `6abd8ffd3a66762aeb8b583aab1411124fb58e0b`. See [notices](THIRD_PARTY_NOTICES.md) and [integration scope](docs/looper.md).

```bash
npm run check
npm test
```

MIT License.
