# NOTES-037 — Shows an empty folder and lets it be expanded

| Field          | Value                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-037                                                                                                                                 |
| Status         | Active                                                                                                                                    |
| Priority       | Low                                                                                                                                       |
| Type           | UI                                                                                                                                        |
| Requirement    | [AC-04.6](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                 |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"shows an empty folder and lets it be expanded"` |
| Run            | `npx playwright test --grep @NOTES-037` (from `basalt-app/`)                                                                              |
| Review         | AI draft — awaiting human review                                                                                                          |

## Scenario

Given a workspace with a folder `empty` that holds only a hidden `.keep` file and a note `other`
When the owner expands `empty`
Then the list shows `empty` and `other` before and after
And `empty` is expanded and still no child row appears

## Steps observed in the app

| #   | Action             | Observed result              |
| --- | ------------------ | ---------------------------- |
| 1   | Open the workspace | empty, other                 |
| 2   | Click empty        | aria-expanded true; two rows |

## Related cases

NOTES-034.
