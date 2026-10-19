# AgentHarbor contributor instructions

- Read PRODUCT.md and docs/architecture.md before changing runtime contracts.
- The current slice includes the TypeScript runtime/CLI and Electron + React desktop alpha. The pure-black desktop-chat comp is approved; the user accepted the two evidence-link font/icon differences for first delivery. Never ship image text as functioning UI.
- Keep agentBridge and its mobile code in their existing repository.
- Use `npm run check` and `npm test` for runtime changes. Tests must exercise behaviour across Git worktrees, state persistence and real child processes, not only mocks.
- Never infer task completion from an agent claiming success. Require registered verification commands and a structured independent review bound to the verified source fingerprint.
- Preserve argv arrays, stdin prompts, process deadlines and output limits. Do not introduce shell interpolation.
- Installed binary, successful version probe and authenticated model access are different states.
- Never commit runtime snapshots, model credentials, local paths from live runs or harness transcripts.
- Keep Looper behind src/looper.ts. Record upstream versions and actual integration coverage; do not silently change a user's ~/.looper configuration or daemon.
- Branch names use `codex/`. Commit messages use semantic prefixes.
