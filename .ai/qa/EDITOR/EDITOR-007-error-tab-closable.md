# EDITOR-007 — Closes the error tab and keeps other notes working when a note that cannot be opened is closed

| Field          | Value                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | EDITOR-007                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                         |
| Priority       | Medium                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                             |
| Requirement    | [AC-01.15](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                       |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"closes the error tab and keeps other notes working when a note that cannot be opened is closed"` |
| Run            | `npx playwright test --grep @EDITOR-007` (from `basalt-app/`)                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                               |

## Scenario

Given notes `bin` (invalid UTF-8) and `ok` are open as tabs
When the owner closes the `bin` tab
Then only `ok` remains and its editor is visible

## Steps observed in the app

| #   | Action          | Observed result |
| --- | --------------- | --------------- |
| 1   | Click Close bin | Only ok tab     |

## Related cases

EDITOR-005, EDITOR-006.
