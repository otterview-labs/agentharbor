---
name: AgentHarbor
description: A pure-black desktop meeting workspace for local coding assistants.
colors:
  ground: "#000"
  text: "#f2f2f2"
  line: "#25272b"
  muted: "#aebacb"
  blue: "#75baff"
  amber: "#efb955"
  primary-action: "#1769f1"
  primary-border: "#327cf6"
  primary-hover: "#2b79f3"
  on-primary: "white"
  hover: "#141820"
  selected-surface: "#0c192b"
  selected-text: "#8ec7ff"
  field-surface: "#090a0c"
  field-border: "#30343b"
  control-border: "#444b57"
  meeting-border: "#2876bf"
  bubble-surface: "#090909"
  bubble-border: "#242424"
  composer-surface: "#080808"
  reviewer-surface: "#231705"
  reviewer-border: "#47300d"
  pending-surface: "#281a06"
  pending-dot: "#f4b143"
  idle-dot: "#9cacc5"
  success-dot: "#70be97"
  success-surface: "#10251a"
  success-text: "#9fdbba"
  blocker-surface: "#201504"
  blocker-border: "#62400a"
  blocker-text: "#efbd6b"
  avatar-surface: "#353d4c"
  avatar-text: "#eef0f4"
  user-avatar-surface: "#152c46"
  dialog-surface: "#070707"
  dialog-border: "#333b48"
  selection-surface: "#173c68"
typography:
  body:
    fontFamily: "'Noto Sans SC','Segoe UI','PingFang SC','Microsoft YaHei',sans-serif"
    fontSize: "clamp(16px,1.31vw,20px)"
  message-desktop:
    fontFamily: "'Noto Sans SC','Segoe UI','PingFang SC','Microsoft YaHei',sans-serif"
    fontSize: "1rem"
    fontWeight: 350
    lineHeight: 1.55
  room-title:
    fontFamily: "'Noto Sans SC','Segoe UI','PingFang SC','Microsoft YaHei',sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-.015em"
  inspector-heading:
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
  task-title:
    fontSize: "29px"
    fontWeight: 600
    lineHeight: 1.35
  author:
    fontSize: ".96rem"
    fontWeight: 500
  label:
    fontSize: ".87rem"
  evidence-link-desktop:
    fontSize: "20px"
    fontWeight: 350
    lineHeight: "25px"
rounded:
  link: "4px"
  small: "6px"
  control: "7px"
  standard: "8px"
  composer: "9px"
  dialog: "13px"
  circle: "50%"
spacing:
  gap-6: "6px"
  gap-8: "8px"
  gap-10: "10px"
  gap-12: "12px"
  gap-14: "14px"
  gap-16: "16px"
  gap-18: "18px"
  gap-20: "20px"
  gap-24: "24px"
  inset-26: "26px"
  gap-32: "32px"
  gap-40: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary-action}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.standard}"
    padding: "11px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-new-meeting:
    textColor: "{colors.blue}"
    rounded: "{rounded.standard}"
    height: "47px"
  button-icon:
    rounded: "{rounded.control}"
    width: "38px"
    height: "38px"
  field:
    backgroundColor: "{colors.field-surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  navigation-selected:
    backgroundColor: "{colors.selected-surface}"
    textColor: "{colors.selected-text}"
    rounded: "{rounded.standard}"
  status-pending:
    backgroundColor: "{colors.pending-surface}"
    textColor: "{colors.amber}"
    rounded: "{rounded.control}"
    padding: "7px 13px"
  status-success:
    backgroundColor: "{colors.success-surface}"
    textColor: "{colors.success-text}"
    rounded: "{rounded.control}"
  message-bubble:
    backgroundColor: "{colors.bubble-surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.standard}"
    padding: "12px 18px"
  message-reviewer:
    backgroundColor: "{colors.reviewer-surface}"
    rounded: "{rounded.standard}"
  composer:
    backgroundColor: "{colors.composer-surface}"
    rounded: "{rounded.composer}"
    height: "140px"
    padding: "13px 17px"
  evidence-link-desktop:
    textColor: "{colors.blue}"
    typography: "{typography.evidence-link-desktop}"
    rounded: "{rounded.link}"
    padding: "0"
---

# Design System: AgentHarbor

## Overview

**Creative North Star: "Pure-black desktop meeting workspace"**

AgentHarbor gives local coding assistants a readable place to meet. Its established visual character is a black ground, off-white Chinese sans-serif text, quiet dividers and compact controls. Conversation carries the work; task state and evidence stay close enough to inspect without taking over the discussion.

This document records the implemented desktop alpha. Its authority is the user's pure-black direction, the approved `.impeccable/mocks/desktop-chat-black.png`, and the actual styles and components. The user accepted the current evidence-link font and arrow differences for first delivery. That acceptance does not constitute a numeric visual-gate pass; the formal comparison remains unresolved. The surface brief retains that approval history.

**Key Characteristics:**

- Pure-black pane backgrounds with fine dark separators.
- Readable, self-hosted Chinese typography with restrained weight changes.
- Blue navigation, evidence actions and Send; amber for incomplete work and review context.
- Flat everyday surfaces, with shadows reserved for floating drawers and dialogs.
- Evidence revealed through inline actions and expandable inspector sections.

## Colors

The palette uses a black neutral field, a blue interaction accent, and semantic amber and green state treatments. The frontmatter is the normative token inventory; names describe observed roles rather than introducing a new palette.

### Primary

- **Blue:** Links, evidence actions, the new-meeting outline label, caret and keyboard focus use the root blue token.
- **Primary Action:** Send and form confirmation use the stronger filled blue, its fine blue border and white text. The hover variant brightens that fill.
- **Selected Surface / Selected Text:** The current meeting uses a quiet blue-black fill and lighter blue text, with a stronger text weight.

### Secondary

- **Amber:** Incomplete task labels use amber on the pending surface. Pending dots, blocker text and reviewer bubbles have distinct existing warm values; preserve their separate roles.

### Tertiary

- **Success:** Completed task labels use the green success surface and text; completed dots use the success-dot token. Resolved blockers share the success surface with their own existing stroke and text colors in source.

### Neutral

- **Ground:** The title bar, sidebar, conversation and inspector all use the same pure black.
- **Text / Muted:** Off-white carries readable content; muted blue-grey carries supporting labels and metadata.
- **Line:** Fine pane, section and header separators.
- **Field / Composer / Bubble / Dialog Surfaces:** Slightly raised dark values distinguish controls and bounded content while leaving the pane ground black.
- **Control Border / Field Border / Bubble Border:** Different fine strokes define editable areas and message boundaries.
- **Avatar Surface:** Neutral assistant avatars are circular; the user avatar uses its own muted blue surface.

**The Black Ground Rule.** Keep the main pane backgrounds pure black. Do not replace them with charcoal, decorative glow or large colored panels.

## Typography

**Body and title font:** Noto Sans SC, followed by Segoe UI, PingFang SC, Microsoft YaHei and sans-serif. The font is self-hosted through `apps/desktop/public/fonts/fonts.css` and its variable WOFF2 files. Keep text as real text.

The interface uses one readable sans-serif family. Size, weight and spacing distinguish the room title, message authors, body copy and inspector labels. There is no separate display or decorative font. Diff and code blocks retain browser monospace behavior; no branded mono family is declared.

### Hierarchy

- **Body:** The root size scales with viewport width between its frontmatter bounds. At widths at or below the compact-desktop breakpoint, it becomes a fixed (16px).
- **Message desktop:** Above the compact breakpoint, bubbles and next-step paragraphs use the lighter (350) weight. Message line height uses the frontmatter message role; the next-step paragraph uses (1.6).
- **Room title:** A semibold single-line heading truncates with an ellipsis. Its size becomes (23px) at the compact breakpoint and (19px) on mobile.
- **Inspector heading / Task title:** Two semibold sizes establish section identity and the task's current objective. At compact desktop widths these become (21px) and (24px).
- **Author / Metadata:** Author names use the frontmatter author role; times are smaller and muted. On mobile, authors use (14px) and times use (12px).
- **Label:** Project and section labels remain muted. Evidence links use their recorded desktop role above the compact breakpoint and become (13px) on mobile.

**The Readable Chinese Rule.** Preserve self-hosted Noto Sans SC and the established fallback order. Do not ship screenshot lettering as functioning interface text.

## Layout

The implemented workspace is a full-height CSS grid (`100dvh`), with a spanning title bar (48px) and a second row that can shrink and scroll internally. Its desktop minimum height is (540px). The sidebar uses `clamp(222px,18.7vw,287px)` and the inspector uses `clamp(304px,26.6vw,408px)`; the conversation takes the remaining width through `minmax(0,1fr)`. These are the source dimensions; the earlier surface sketch's approximate pane widths are directional history.

The room header and composer share horizontal conversation insets. Message avatars and text form a row with a wide desktop gap (24px); messages, sidebar navigation and inspector sections each retain their own compact spacing rhythm. The thread and inspector scroll independently. The composer stays below the thread with a fixed height and bottom inset (40px), keeping writing within reach while messages scroll.

At or below (1100px), the sidebar and inspector become (210px) and (290px), the room header becomes (76px) high, conversation insets become (20px), avatars become (42px), and message gaps become (15px). At or below (900px), the inspector leaves the grid; its toggle opens a fixed right drawer (320px) below the title bar. At or below (600px), the sidebar also leaves the grid and opens as a fixed left drawer (260px). The conversation then occupies the full width, its header becomes (70px), avatars become (34px), and the composer becomes (126px) high with smaller margins.

Dialogs use `min(640px,calc(100vw - 32px))` and a maximum height of (88dvh). Avoid growing content past its available scroll region. Long message content, task goals and evidence wrap; meeting names and the room heading truncate in their constrained navigation contexts.

## Elevation & Depth

The resting workspace is flat. Fine borders and small surface-value changes separate panes, messages and fields. Shadows appear on dialogs and responsive drawers, where they communicate overlap rather than decorate content. The dialog also uses a dark backdrop.

### Shadow Vocabulary

- **Dialog:** `0 20px 70px #0009`.
- **Right drawer:** `-14px 0 30px #0009`.
- **Left drawer:** `14px 0 30px #0009`.
- **Dialog backdrop:** `#000b`.

**The Floating Surface Rule.** Keep the main workspace flat; reserve the existing shadows for drawers and dialogs.

## Shapes

Controls and message containers use small rounded corners, captured in the frontmatter radius roles. Inputs, secondary buttons and statuses share the control radius; primary actions, meeting navigation, bubbles and blockers share the standard radius. The composer is slightly softer and dialogs have the largest corner treatment. Avatars and status dots are circular. Pane boundaries remain straight, fine (1px) lines.

Avoid adding pill silhouettes to rectangular actions. The round avatar and small circular status markers already provide the recurring circular forms.

## Components

### Buttons

The filled primary action is compact and clearly visible. It has a fine border, a (10px) icon gap and medium (500) weight. The desktop Send variant is (55px) high with a minimum width of (120px); on mobile it becomes (42px) high with a minimum width of (90px). Secondary buttons use an outlined quiet treatment. New meeting is a blue outlined action (47px) high. Icon buttons are square controls with small rounded corners.

Enabled buttons use the dark hover surface unless a component supplies a more specific fill; primary buttons use their dedicated blue hover. Pressed buttons move down (1px). Most disabled buttons use opacity (.48), while the inspector run control uses (.75); the illustrative demo explicitly keeps that run control at full opacity. Preserve these distinctions when reproducing the current alpha.

Keyboard focus on buttons, selects, inputs, textareas and summaries uses a (2px) blue outline with a (3px) offset. The composer textarea is the explicit exception: its enclosing border turns blue on focus within.

### Inputs / Fields

Text inputs and project selectors have a raised near-black surface and a thin stroke. Selects are (46px) high; field padding and radius use the frontmatter. Form textareas support vertical resizing and line height (1.6). The message composer supports multiline input without resizing, wraps attachments above its actions and has a (16000) character limit in the implemented form. Control/Command + Enter submits a message.

### Navigation

Meeting rows use a full-width button with left-aligned text, a small status dot and truncation for long names. The current meeting is identified by blue text, its blue-black fill and `aria-current`. On wide desktop, each row is (52px) high with a (6px) bottom gap and (26px) line height. The sidebar's assistant and settings actions stay quiet at its bottom.

The narrow-layout drawer includes its own visible close button. Escape closes either drawer. Selecting a meeting also closes the left drawer.

### Status Chips

Task state is shown as a small inline badge with a circular dot, not a large panel. Pending and success use the separate semantic variants in the frontmatter. An amber blocker contains a warning icon and wrapping copy; a completed blocker switches to its green resolved variant. State must also be expressed in text or iconography.

### Messages / Containers

Messages use circular author avatars, a small author-and-time row and a bounded bubble. Bubbles are inline blocks, preserve line breaks and wrap long content. Reviewer messages use a warm dark fill and stroke. The general bubble uses the thin neutral boundary. Mobile bubbles use (15px) text with (10px 12px) padding.

### Composer

The composer is a persistent flex column with a quiet near-black surface, thin outline and a blue focus-within border. Its actions keep attachment on the left and Send on the right. The transparent textarea occupies the remaining area. Preserve visible placeholder contrast and the blue caret.

### Evidence Links and Inspector Details

Builder messages have small inline blue actions for changes and tests, each with a right chevron. The current desktop implementation intentionally retains the font and arrow differences accepted for the first release. Their expanded evidence belongs in the inspector. Acceptance criteria, changes/tests and execution history use native expandable details, with a chevron rotating (180deg) in the open state. The rotation transition lasts (.18s) with `ease-out`.

### Dialogs and Motion

New meeting, assistant management and settings use a native modal dialog with a header and local close action. Escape and clicking the backdrop close it; focus returns to the previously focused control. The busy spinner rotates over (1.1s) with linear timing. Threads request smooth scrolling. The reduced-motion media query disables animations, transitions and smooth CSS scrolling.

## Do's and Don'ts

### Do:

- **Do** keep the pane ground pure black and use fine dividers to establish structure.
- **Do** preserve readable Chinese text with the self-hosted Noto Sans SC family and established fallbacks.
- **Do** use blue for interaction, amber for incomplete work and review context, and green for completed state.
- **Do** keep focus visible and provide local close controls for drawers and dialogs.
- **Do** reveal detailed evidence through the implemented inline actions and inspector disclosures.
- **Do** label illustrative preview records and keep approval history separate from numeric visual-gate status.

### Don't:

- **Don't** replace the pure-black pane ground with charcoal, neon glow or large colored panels.
- **Don't** add decorative type families, oversized radii or shadows to resting workspace panes.
- **Don't** encode task state through color alone or remove its readable label.
- **Don't** treat the accepted evidence-link differences as a pixel-perfect or numeric visual-gate pass.
- **Don't** turn screenshot text into functional UI or present illustrative task data as verified runtime evidence.
