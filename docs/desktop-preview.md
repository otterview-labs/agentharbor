# Desktop meeting workspace — design proposals

These are **generated design mockups with synthetic data**, not screenshots of a working desktop application. The user selected a chat application interaction model: assistants meet in the center; tasks and results stay in the side pane. These three complete layouts are pending selection. The earlier dashboard-style proposals were rejected and are not the implementation target.

Window controls illustrate macOS or Windows variants, not separate codebases. The future Electron host will use the correct native chrome for the running OS. Brand mark, example dates and UI copy in generated images are provisional; completion states must derive from runtime evidence in the actual application.

## A — Project and meeting workspace

Three panes: combined project/meeting sidebar, central assistant discussion, right task inspector with evidence and history. Suits one focused meeting at a time.

![A: Desktop assistant meeting with right task inspector](../.impeccable/mocks/desktop-chat-a.png)

## B — Messaging application structure

Activity rail, searchable meeting list, central discussion and a persistent right task/results inspector. Suits several simultaneous projects or meetings.

![B: Desktop messaging application with meeting list and task inspector](../.impeccable/mocks/desktop-chat-b.png)

## C — Project tree and focused conversation

Project tree on the left, broad conversation in the middle, task details and selected results in the right dock. Suits frequent movement between projects and their conversations.

![C: Desktop project conversations with a docked task and result pane](../.impeccable/mocks/desktop-chat-c.png)

Generated with the built-in image_gen tool. Exact prompts, edit history and `approved: false` metadata accompany the files; the final generation/edit prompt is also embedded in each PNG. No renderer code should be implemented from these proposals until a complete layout is approved.
