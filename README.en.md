# AgentHarbor

A local desktop workspace where coding assistants implement a goal, run real checks and independently review the result.

**Desktop alpha: 0.2.0-alpha.3.** Electron + React shares one desktop codebase across Windows, Linux and macOS. Projects and meetings sit on the left, assistant handoffs in the center, and task status and evidence on the right.

[中文](README.md) · [Downloads](https://github.com/otterview-labs/agentharbor/releases) · [Desktop guide](docs/desktop-alpha.md) · [Verification](docs/verification.md) · [Architecture](docs/architecture.md) · [Roadmap](docs/ROADMAP.md)

![Actual browser design preview with explicitly synthetic meeting data](docs/screenshots/desktop-preview.png)

The screenshot is a running browser preview with labeled sample data. The native desktop starts empty and uses your own local projects.

## Working slice

- Discover installed Codex, Claude Code, OpenCode, Looper, Git and GitHub CLI. Installation and version probes do not establish authenticated access.
- Add an ordinary folder or a clean local Git project; specify a goal, acceptance criteria and verification commands.
- Run Codex and Claude Code as separate builder and reviewer roles inside an isolated task workspace (a folder copy or Git worktree).
- Persist execution → host verification → independent structured review → bounded rework, with source fingerprints binding approval to verified code.
- Inspect assistant messages, diffs, checks and history; attach small text files and send context for the next agent invocation.
- Pause and resume tasks and restore meetings after restart.

The host follows a defined workflow. Free-form multi-agent discussions, mention routing, automatic project decomposition, OpenCode execution and Jev are pending. This is a bounded mission runner rather than a permanently unattended project supervisor. Changes remain in the worktree; there is no automatic commit, push or merge.

## Run

Download and unzip the package for your OS. Alpha packages are unsigned and not notarized, with the default Electron application icon. Configure authenticated Codex and Claude Code CLIs first. Ordinary folders need no Git installation or initialization; Git repositories still require Git. **Windows desktop fixture tests and packaging pass; the adapter still cannot execute Windows npm `.cmd` harness shims. Real Windows harness access remains unverified.**

From source, use Node.js 22.13+:

```bash
npm ci
npm run desktop
```

Add a local repository, create a meeting with real checks, assign separate tools and start it. Prepare project dependencies inside the task worktree when necessary: existing `node_modules` directories are not copied. Inspect checks and review before using the resulting changes.

No self-hosted cloud service is required for local use; model calls use each harness's configured provider. Keep the computer running. Private state defaults to `~/.agentharbor`, overridable through `AGENTHARBOR_HOME`. A worktree separates edits; harnesses and registered checks still run as your user. Use trusted repositories and commands.

```bash
npm run build:desktop
npm run preview:desktop   # Sample browser UI; no native execution
npm run package:desktop
```

The separate mobile project remains in its existing repository.

## Validation

Strict TypeScript checks and 24 runtime tests pass. Native Electron tests cover project/meeting creation, workers, verification, independent fixture review, persistence and pause/resume. A live macOS desktop smoke passed with actual Codex, real Node tests and actual Claude Code; the original checkout was unchanged. Windows, Linux and macOS native fixture tests and ZIP builds passed CI. See [verification](docs/verification.md) for evidence and limits.

## CLI and upstream

```bash
npm run build
node dist/src/cli.js doctor
node dist/src/cli.js create --file /absolute/path/mission.json
node dist/src/cli.js run --id <mission-id>
```

Use [examples/mission.json](examples/mission.json). Exit 0 means complete, 2 incomplete, 1 command failure. A hard crash can leave a lock; confirm its owner has exited before removing the reported lock.

[Looper](https://github.com/nexu-io/looper), MIT, is a credited architectural reference and optional external engine called through an explicit CLI adapter. This repository is an independent implementation. A full live Looper Issue → PR → merge lifecycle remains unverified. See [integration scope](docs/looper.md) and [notices](THIRD_PARTY_NOTICES.md).

```bash
npm run check
npm run check:desktop
npm test
npm run build:desktop
npm run test:desktop
```

MIT License.

## Ordinary folders

Ordinary folders run in an isolated copy without creating Git metadata or changing the source folder. Open the task workspace to retrieve results. File changes are listed against the initial manifest; Git projects retain their diff view. Verification and review bind to the same source-file hashes. Existing snapshots without a workspace kind remain Git worktrees.

Dependency/cache/build directories (`node_modules`, virtual environments, `dist`, `build`, `coverage`, `.next`, `.nuxt`, `.cache`, `target`, `.gradle`, etc.) are excluded from copying and fingerprints. Custom `.gitignore` rules are not parsed in folder mode. Prepare dependencies and register real checks for the copy. Folder mode has no application-imposed file-count, entry-count, individual-size or total-size cap. Directory entries and file contents are streamed; copying requests reflinks when supported and otherwise falls back to normal copying. Actual capacity depends on the local system. Symlinks and special files remain unsupported.
