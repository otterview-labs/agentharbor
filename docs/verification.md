# Verification record — 2026-10-19

## Local checks

Environment: macOS arm64, Node.js v25.5.0, TypeScript 5.9.3.

- `npm run check`: strict TypeScript passes.
- `npm test`: 14 behaviour tests pass. They use real temporary Git repositories, actual child processes and isolated worktrees, with deterministic in-process agent fixtures.
- `doctor`: detected Codex 0.159.2, Claude Code 2.1.287, Git and GitHub CLI on the development machine. OpenCode and Looper were absent from PATH. Tool presence does not establish authentication.

The regression suite exercises automatic rework after rejected review, failed verification without reviewer invocation, exact structured review decisions, source changes during verification/review, snapshot reload after pause, exclusive locks, untracked source drift, process timeout/abort, literal shell metacharacters, executable discovery, and the Looper CLI argument contract.

## Cross-platform CI

[Runtime CI 39239974653](https://github.com/otterview-labs/agentharbor/actions/runs/39239974653), commit `e373c5e`: six jobs passed, Node.js 22/24 on Windows, Linux and macOS.

[Desktop CI 39239974488](https://github.com/otterview-labs/agentharbor/actions/runs/39239974488), same commit: native Electron fixture creation/execution/review/restart test and ZIP packaging passed on all three platforms. The later local pause/resume scenario is additional coverage; its subsequent CI result is recorded in the release.

## Desktop verification

- `npm run check:desktop` and `npm run build:desktop` pass.
- Two local native Electron tests pass: project/meeting creation through UI and IPC, real worker process, host verification, structured fixture review, diff inspection, context persistence across restart, and pause/resume without losing the worktree.
- Renderer preferences assert context isolation, sandbox and disabled Node integration.
- Responsive browser captures exercise desktop and narrow layouts; browser preview uses synthetic data and is separate from native execution.
- A real native desktop smoke passed: actual Codex → host Node test → actual Claude Code → completed in round 1. Source fingerprints matched; the original repository remained unchanged and test mode was disabled. See [sanitized desktop report](live-desktop-smoke-20261019.json).

## Live model smoke

A dedicated temporary Git repository contained a deliberately broken two-argument addition function and one regression test covering two inputs. The original checkout was not used as the model workspace.

1. Actual Codex CLI changed the isolated worktree implementation.
2. The host ran the registered Node.js test command: exit 0, one passing test.
3. Actual Claude Code CLI read the source and returned a structured approval.
4. Source fingerprint matched verification and review. Mission ended `completed` in round 1.
5. The original fixture checkout remained unchanged.

The live path took approximately 85 seconds. See [sanitised machine-readable report](live-smoke-20261019.json). It contains no credentials, local filesystem paths or raw model transcript. The offline fixture tests separately validate rejection → rework → approval; this live smoke did not force the model to reject a review.

## Explicitly unverified / pending

- Windows and Linux real harness authentication and model execution. Native fixture tests and packaging are verified separately. Windows npm `.cmd` harness execution remains unsupported.
- Signed/notarized installers and a custom app icon; current packages are unsigned ZIP alphas.
- Full live Looper daemon / Issue / PR / merge lifecycle. Adapter arguments are tested through a fixture executable.
- Live OpenCode execution, Jev, long-running supervision, token/spend budgets, task decomposition and free-form multi-agent meeting routing.

The user approved the current black desktop first viewport for first delivery, accepting the two evidence links' font/icon differences. Numeric comp comparison still flags those controls; this is not recorded as an exact pixel match.

No claim of arbitrary-project unattended completion follows from these bounded tests.

## First-version visual review

Fresh finish review initially returned `fix`: narrow drawers lacked an independent close action, and formal visual-state metadata remained open. The drawer issue is addressed with local close controls and Escape handling. The user explicitly approved delivery of the current viewport: “接受这两处小差异，先交付当前首版”. The numeric hero comparison scored 0.9382, but the CLI still flags link and control differences and refused recording that exception; the hero phase remains open. This is an accepted first-version delivery, not a claim that the formal pixel comparison gate passed. No approval receipt or gate closure was fabricated.

The same fresh reviewer re-read the updated captures and returned `ship` for the scored fixes: drawer dismissal and truthful delivery records resolved; no visible regressions. The disposition covers those fixes and does not close the formal hero gate.

## Ordinary-folder regression — alpha.2

The local suite now contains 22 runtime tests and 3 native Electron tests. Folder coverage runs with an empty PATH, real Node checks, independent fixture review/rework, restored manifests, source-drift rejection, copy limits, dependency/build exclusions and source preservation. Legacy Git snapshots without the new optional workspace kind remain covered. Native UI coverage adds selecting a non-Git folder, creating and completing a task through a real utility worker, inspecting changed files and confirming no `.git` was created.

A live macOS folder smoke also completed in one round using actual Codex and Claude Code: real check exit 0, structured approval bound to the verified fingerprint, unchanged original directory and no Git metadata. See [sanitized report](live-directory-smoke-20261019.json). This was a runtime/CLI smoke; native desktop folder execution is separately covered with deterministic agents.
