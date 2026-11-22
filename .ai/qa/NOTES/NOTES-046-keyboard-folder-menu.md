# NOTES-046 — Offers the folder menu when Shift+F10 is pressed on a focused folder row

| Field          | Value                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-046                                                                                                                                                            |
| Status         | Active                                                                                                                                                               |
| Priority       | Medium                                                                                                                                                               |
| Type           | UI                                                                                                                                                                   |
| Requirement    | [AC-04.9](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                            |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"offers the folder menu when Shift+F10 is pressed on a focused folder row"` |
| Run            | `npx playwright test --grep @NOTES-046` (from `basalt-app/`)                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                     |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
And the `projects` row has focus
When the owner presses Shift+F10
Then the folder menu with four items is shown

## Steps observed in the app

| #   | Action    | Observed result |
| --- | --------- | --------------- |
| 1   | Shift+F10 | Folder menu     |

## Related cases

NOTES-044.
