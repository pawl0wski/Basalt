# NOTES-042 — Offers the root menu when the context menu is opened on the empty area of the sidebar

| Field          | Value                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-042                                                                                                                                                                         |
| Status         | Active                                                                                                                                                                            |
| Priority       | Medium                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                                |
| Requirement    | [AC-04.9](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                         |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"offers the root menu when the context menu is opened on the empty area of the sidebar"` |
| Run            | `npx playwright test --grep @NOTES-042` (from `basalt-app/`)                                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                                  |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the owner right-clicks the empty area of the sidebar
Then the root menu is shown

## Steps observed in the app

| #   | Action                 | Observed result |
| --- | ---------------------- | --------------- |
| 1   | Right-click empty area | Root menu       |

## Related cases

NOTES-043.
