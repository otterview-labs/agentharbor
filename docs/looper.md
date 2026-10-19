# Optional external Looper engine

Upstream: https://github.com/nexu-io/looper (MIT).

This adapter calls the public `looper` CLI with an explicit configuration path and `--json`. The configuration must already point to a configured daemon. AgentHarbor does not install a global daemon, change `~/.looper`, register repositories implicitly, or enable automatic merge.

Contract reference: upstream main commit `6abd8ffd3a66762aeb8b583aab1411124fb58e0b`. At implementation time the latest release observed was v0.16.1. Inspect the official installation/configuration guide for the release you choose; do not assume main and release configuration are interchangeable.

```bash
node dist/src/cli.js looper-status --config /absolute/path/to/looper.toml
node dist/src/cli.js looper-projects --config /absolute/path/to/looper.toml
node dist/src/cli.js looper-loops --config /absolute/path/to/looper.toml
node dist/src/cli.js looper-work --config /absolute/path/to/looper.toml --project project_1 --issue 42
node dist/src/cli.js looper-review --config /absolute/path/to/looper.toml --project project_1 --pr owner/repository#42
```

The last two commands enqueue real upstream work and continuous review when the daemon is available. They do not constitute a complete Issue → PR → review → merge pipeline in this repository. Review, merge and external-action policies are configured and enforced by the upstream daemon. No live GitHub issue or PR was changed by the offline adapter tests.

See docs/verification.md for the exact tested scope. Tests verify argv and JSON contracts with a fixture executable. Missing engine, non-zero exit status and invalid JSON must fail explicitly.
