# EDITOR-024 — Closes the tab and shows No note open when Close note is confirmed on a deleted dirty note

| Field          | Value                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-024                                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                                             |
| Requirement    | [AC-01.14](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                       |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"closes the tab and shows No note open when Close note is confirmed on a deleted dirty note"` |
| Run            | `npx playwright test --grep @EDITOR-024` (from `basalt-app/`)                                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                                               |

## Scenario

Given the Close note confirmation is open for a deleted dirty note
When the owner confirms Close note
Then no tab remains and `No note open` is shown

## Steps observed in the app

| #   | Action  | Observed result      |
| --- | ------- | -------------------- |
| 1   | Confirm | No tabs; empty state |

## Related cases

EDITOR-023.
