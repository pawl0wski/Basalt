# NOTES-061 — Accepts typing in the name field right after Rename is chosen

| Field          | Value                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-061                                                                                                                                                 |
| Status         | Active                                                                                                                                                    |
| Priority       | Medium                                                                                                                                                    |
| Type           | UI                                                                                                                                                        |
| Requirement    | [AC-04.1](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                 |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"accepts typing in the name field right after Rename is chosen"` |
| Run            | `npx playwright test --grep @NOTES-061` (from `basalt-app/`)                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                          |

## Scenario

Given note `a` exists
When the owner chooses Rename and types `typed`
Then the name field holds `typed`

## Steps observed in the app

| #   | Action              | Observed result   |
| --- | ------------------- | ----------------- |
| 1   | Choose Rename, type | Field value typed |

## Related cases

NOTES-059.
