# AgentHarbor contributor instructions

- Read PRODUCT.md and docs/architecture.md before changing runtime contracts.
- The current slice is a local TypeScript runtime/CLI. Desktop preview images are proposals; no image is approved until recorded as such. Never ship image text as functioning UI.
- Keep agentBridge and its mobile code in their existing repository.
- Use `npm run check` and `npm test` for runtime changes. Tests must exercise behaviour across Git worktrees, state persistence and real child processes, not only mocks.
- Never infer task completion from an agent claiming success. Require registered verification commands and a structured independent review bound to the verified source fingerprint.
- Preserve argv arrays, stdin prompts, process deadlines and output limits. Do not introduce shell interpolation.
- Installed binary, successful version probe and authenticated model access are different states.
- Never commit runtime snapshots, model credentials, local paths from live runs or harness transcripts.
- Keep Looper behind src/looper.ts. Record upstream versions and actual integration coverage; do not silently change a user's ~/.looper configuration or daemon.
- Branch names use `codex/`. Commit messages use semantic prefixes.
