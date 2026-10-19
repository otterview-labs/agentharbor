---
version: 1
slug: "apps-desktop-src-app-tsx"
primary_target: "apps/desktop/src/App.tsx"
related_targets: []
---

# Desktop assistant meeting workspace

Mode: Operate. Audience: individual developers coordinating local coding assistants.

The user explicitly chose a chat application: assistants meet in the center; tasks and results remain beside it. The earlier dashboard layouts were rejected as insufficiently desktop-like. The first desktop-chat proposals were then judged cluttered. Keep discussion primary and use progressive disclosure for evidence.

## Direction contract

THESIS: One meeting that advances a goal, with one clearly visible next action. The main view should not require reading multiple duplicated status panels.

OWN-WORLD: Cool white work areas, a pale blue-gray meeting sidebar, dark readable Chinese sans-serif text, blue selection and Send, amber only for incomplete work. Standard desktop title bar, split panes and a fixed composer.

STORY: Choose a project meeting, describe the goal, read assistant handoffs, and see the current task and blocker in the right inspector. Inspect acceptance criteria, changed files, tests or history only when needed.

FIRST VIEWPORT: Single native desktop title bar; one 220px project/meeting sidebar with three recent meetings; broad center discussion with four concise named-agent messages and small inline evidence links; a 280px right inspector showing current task, executor, next step and blocker. Membership is one header control. Three detail sections remain collapsed. Fixed composer has attachment and Send; Pause is a quiet inspector action.

FORM: User-pinned desktop chat interaction. Seed 92ca0942 records earlier exploration and does not override the user's direction or simplification feedback. Signature interaction: follow an assistant handoff from the message into its task and evidence without leaving the meeting.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Approval state

No complete mockup is approved. The latest refinement is `.impeccable/mocks/desktop-chat-simple.png`; A/B/C remain unapproved comparison material. No renderer code before the user approves a complete comp. Preview conversation, task records and status are synthetic and visibly labeled.
