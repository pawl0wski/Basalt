# NOTES-047 — Shows no buttons in tree rows and no more-actions button in the sidebar

| Field          | Value                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-047                                                                                                                                                           |
| Status         | Active                                                                                                                                                              |
| Priority       | Low                                                                                                                                                                 |
| Type           | UI                                                                                                                                                                  |
| Requirement    | [AC-04.9](../../specs/implemented/2026-11-01-manage-notes-and-folders.md) (rows have no … button)                                                                   |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"shows no buttons in tree rows and no more-actions button in the sidebar"` |
| Run            | `npx playwright test --grep @NOTES-047` (from `basalt-app/`)                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                    |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the sidebar is inspected
Then no tree row contains a button and the sidebar has no more-actions button

## Steps observed in the app

| #   | Action       | Observed result |
| --- | ------------ | --------------- |
| 1   | Inspect rows | No buttons      |

## Related cases

NOTES-040.
