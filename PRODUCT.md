# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Electron + React + TypeScript is the implemented shared desktop stack for Windows, Linux and macOS. The user requested design previews before UI implementation and selected a desktop chat interaction: assistant meetings in the center, tasks and results in the side pane. The user approved the pure-black complete desktop comp for implementation on 2026-10-19. Build the Electron + React desktop host on the existing Node.js runtime and CLI.

## Users
Individual developers managing several installed AI coding assistants and repositories on their own computer.

## Product Purpose
AgentHarbor discovers coding assistants, assembles a task team and advances a project through execution, verification and independent model review. A user supplies the objective and acceptance criteria; routine rework should continue without repeated human supervision.

## Positioning
One local control surface for existing harnesses, with persistent task state, independent review and visible completion evidence. Upstream Looper is the proposed autonomous GitHub workflow engine, integrated through an adapter rather than copied wholesale.

## Operating Context
Users work in ordinary local folders or Git repositories with Codex, Claude Code or OpenCode. A mission assigns builder and reviewer roles. A rejected review returns actionable findings to the builder. Interrupted tasks can be inspected and resumed. A local desktop process requires the computer to remain awake.

## Capabilities and Constraints
- Windows, Linux and macOS have native fixture tests and ZIP builds; alpha packages are unsigned, with real harness access currently verified on macOS only.
- Public repository destination: otterview-labs/agentharbor.
- Keep the existing agentBridge phone application in its separate repository.
- Ordinary-folder project files have no fixed count or size ceiling; task rounds and execution budgets remain independently configurable.
- Normal desktop creation needs only a folder and goal; advanced acceptance/checks/roles are optional and resolved before strict runtime validation.
- Prefer bounded unattended execution within the registered project and configured commands.
- Review is not proof of correctness; require verification evidence before completion.
- Jev is an optional future review integration; no live Jev credentials or validation are available.
- The pure-black complete desktop comp and current first viewport are approved for first-version delivery; the user accepted minor evidence-link font/icon differences.
- Automatic discovery must distinguish an installed binary from working authentication.

## Brand Commitments
Name: AgentHarbor. Meaning: a place where multiple coding agents gather and collaborate. Chinese product communication should be clear and readable. The user explicitly requested a pure black (#000000) desktop tool, correcting an earlier charcoal interpretation. Retain the simplified conversation-first layout and readable text.

## Evidence on Hand
Primary references: nexu-io/looper, MIT, upstream commit 6abd8ffd3a66762aeb8b583aab1411124fb58e0b. No customer, performance or reliability claims are established. Design preview task records must be explicitly marked illustrative.

## Product Principles
- Completion needs verifiable evidence, not an agent's assertion.
- Give each assistant a clear role and preserve review findings.
- Persist progress across interruptions and make failure actionable.
- Keep adapters replaceable and task policy explicit.
