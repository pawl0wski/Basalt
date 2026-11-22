# NOTES-005 — Moves the note when a real mouse drag ends on a folder row

| Field          | Value                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-005                                                                                                                                          |
| Status         | Active                                                                                                                                             |
| Priority       | Medium                                                                                                                                             |
| Type           | UI                                                                                                                                                 |
| Requirement    | [AC-04.5](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                          |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"moves the note when a real mouse drag ends on a folder row"` |
| Run            | `npx playwright test --grep @NOTES-005` (from `basalt-app/`)                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                   |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
When the owner drags `Ideas` onto the `projects` row with a real mouse
Then the file is moved into `projects`

## Steps observed in the app

| #   | Action     | Observed result |
| --- | ---------- | --------------- |
| 1   | Mouse drag | File moved      |

## Related cases

NOTES-004. Native drag and drop on real Tauri is not covered (see PLATFORM).
