# Verification record — 2026-10-19

## Local checks

Environment: macOS arm64, Node.js v25.5.0, TypeScript 5.9.3.

- `npm run check`: strict TypeScript passes.
- `npm test`: 13 behaviour tests pass. They use real temporary Git repositories, actual child processes and isolated worktrees, with deterministic in-process agent fixtures.
- `doctor`: detected Codex 0.159.2, Claude Code 2.1.287, Git and GitHub CLI on the development machine. OpenCode and Looper were absent from PATH. Tool presence does not establish authentication.

The regression suite exercises automatic rework after rejected review, failed verification without reviewer invocation, exact structured review decisions, source changes during verification/review, snapshot reload after pause, exclusive locks, untracked source drift, process timeout/abort, literal shell metacharacters, executable discovery, and the Looper CLI argument contract.

## Live model smoke

A dedicated temporary Git repository contained a deliberately broken two-argument addition function and one regression test covering two inputs. The original checkout was not used as the model workspace.

1. Actual Codex CLI changed the isolated worktree implementation.
2. The host ran the registered Node.js test command: exit 0, one passing test.
3. Actual Claude Code CLI read the source and returned a structured approval.
4. Source fingerprint matched verification and review. Mission ended `completed` in round 1.
5. The original fixture checkout remained unchanged.

The live path took approximately 85 seconds. See [sanitised machine-readable report](live-smoke-20261019.json). It contains no credentials, local filesystem paths or raw model transcript. The offline fixture tests separately validate rejection → rework → approval; this live smoke did not force the model to reject a review.

## Explicitly unverified

- Windows and Linux native CLI execution, npm shims, packaging and OS cancellation. A CI matrix for Node 22/24 on all three OSes is configured; its remote result must be checked after the first push.
- A complete live Looper daemon / Issue / PR / automatic-merge workflow. Adapter flags were checked against upstream source and exercised through a fixture executable. Official engine release downloads were too slow for this session; no global installation was performed.
- Live OpenCode execution, Jev service access, long-running supervisor recovery, token/spend budgets and task decomposition.
- Desktop usability and executable interface: mockups are proposals, not an implementation or visual regression pass. The user rejected the first dashboard-like layouts and selected a desktop chat/meeting interaction; updated comps are pending approval.

No claim of arbitrary-project unattended completion follows from this bounded smoke test.
