# Implementation roadmap

## First runtime slice

- [x] Independent repository and MIT licensing.
- [x] Discover Codex, Claude Code, OpenCode and Looper binaries.
- [x] Local missions: Git worktree, persisted phases, real verification, independent review and bounded automatic rework.
- [x] Pause/resume, failure evidence, source drift detection and concurrent execution lock.
- [x] External Looper CLI adapter using explicit configuration.
- [x] Full desktop design proposals for user selection.
- [ ] User selects desktop design.

## Desktop alpha

- [ ] Electron main/preload/React renderer; project picker, mission form, live task timeline, source/test/review inspector.
- [ ] Multiple assistant discussion sessions whose agreed actions become tracked mission steps.
- [ ] Explicit plan records and subtask queue; dependency scheduling and independent acceptance of each subtask.
- [ ] Source-native Windows harness adapters, npm shims, PowerShell and process-tree cancellation.
- [ ] macOS, Windows and Linux installation packages and native smoke tests.
- [ ] OpenCode execution adapter and domestic harness capability probes.

## Continuous project progression

- [ ] Background supervisor, app restart recovery and daemon lifecycle.
- [ ] Cumulative time/token/spend budgets, retry/backoff, stall/loop detection and provider switching.
- [ ] Structured ReviewProvider interface and optional Jev integration tested with real credentials.
- [ ] Looper end-to-end Issue → plan → implementation → PR → checks → review → permitted merge on a dedicated test repository.
- [ ] Opt-in merge/publish policies, protected branches and repository-scoped external action permissions.
- [ ] Optional connection to agentBridge mobile supervision without requiring a public cloud server for local use.

A multi-round local mission is not yet a permanently running project supervisor. Do not describe this alpha as fully autonomous for arbitrary projects or as a released desktop application.
