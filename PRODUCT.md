# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Electron + React + TypeScript is the proposed shared desktop stack for Windows, Linux and macOS. The user requested design previews before UI implementation and selected a desktop chat interaction: assistant meetings in the center, tasks and results in the side pane. The first implementation slice is a Node.js local runtime and CLI; renderer development waits for design approval.

## Users
Individual developers managing several installed AI coding assistants and repositories on their own computer.

## Product Purpose
AgentHarbor discovers coding assistants, assembles a task team and advances a project through execution, verification and independent model review. A user supplies the objective and acceptance criteria; routine rework should continue without repeated human supervision.

## Positioning
One local control surface for existing harnesses, with persistent task state, independent review and visible completion evidence. Upstream Looper is the proposed autonomous GitHub workflow engine, integrated through an adapter rather than copied wholesale.

## Operating Context
Users work in local Git repositories with Codex, Claude Code or OpenCode. A mission assigns builder and reviewer roles. A rejected review returns actionable findings to the builder. Interrupted tasks can be inspected and resumed. A local desktop process requires the computer to remain awake.

## Capabilities and Constraints
- Windows, Linux and macOS are target desktop platforms, not yet certified releases.
- Public repository destination: otterview-labs/agentharbor.
- Keep the existing agentBridge phone application in its separate repository.
- Prefer bounded unattended execution within the registered project and configured commands.
- Review is not proof of correctness; require verification evidence before completion.
- Jev is an optional future review integration; no live Jev credentials or validation are available.
- Desktop interface implementation requires approval of a complete design preview first.
- Automatic discovery must distinguish an installed binary from working authentication.

## Brand Commitments
Name: AgentHarbor. Meaning: a place where multiple coding agents gather and collaborate. Chinese product communication should be clear and readable.

## Evidence on Hand
Primary references: nexu-io/looper, MIT, upstream commit 6abd8ffd3a66762aeb8b583aab1411124fb58e0b. No customer, performance or reliability claims are established. Design preview task records must be explicitly marked illustrative.

## Product Principles
- Completion needs verifiable evidence, not an agent's assertion.
- Give each assistant a clear role and preserve review findings.
- Persist progress across interruptions and make failure actionable.
- Keep adapters replaceable and task policy explicit.
