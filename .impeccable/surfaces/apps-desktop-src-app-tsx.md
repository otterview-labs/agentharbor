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

OWN-WORLD: User-pinned pure-black (#000000) desktop tool. Flat black conversation, sidebar, task inspector and title bar; readable off-white Chinese sans-serif text, muted blue selection and Send, amber only for incomplete work. Separate panes through fine dark dividers; confine slightly raised values to small controls. No neon, decorative glow or large colored panels. Standard desktop title bar, split panes and fixed composer.

STORY: Choose a project meeting, describe the goal, read assistant handoffs, and see the current task and blocker in the right inspector. Inspect acceptance criteria, changed files, tests or history only when needed.

FIRST VIEWPORT: Single native desktop title bar; one 220px project/meeting sidebar with three recent meetings; broad center discussion with four concise named-agent messages and small inline evidence links; a 280px right inspector showing current task, executor, next step and blocker. Membership is one header control. Three detail sections remain collapsed. Fixed composer has attachment and Send; Pause is a quiet inspector action.

FORM: User-pinned desktop chat interaction. Seed 92ca0942 records earlier exploration and does not override the user's direction or simplification feedback. Signature interaction: follow an assistant handoff from the message into its task and evidence without leaving the meeting.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Approval state

The user approved `.impeccable/mocks/desktop-chat-black.png` for implementation on 2026-10-19. The light comp and A/B/C remain unapproved alternatives. Preview records are labeled synthetic; native state starts empty.

After viewing the actual running first viewport, the user explicitly replied: “接受这两处小差异，先交付当前首版”. This accepts the evidence links' font/icon differences and authorizes delivery of the current version. Numeric visual-gate comparisons still flag those controls; two attempts to record the exception through the CLI were refused. The gate remains transparently unresolved; no fake user-review receipt was created, and this metadata must not be described as a pixel-perfect pass. The pinned black ground and three-pane design continue to apply.
