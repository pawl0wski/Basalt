# TABS-005 — Closes a tab with the middle mouse button and shows No note open after the last tab is closed

| Field          | Value                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TABS-005                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                        |
| Priority       | Medium                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                            |
| Requirement    | [AC-01.16](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (close with the middle mouse button)                                                                 |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"closes a tab with the middle mouse button and shows No note open after the last tab is closed"` |
| Run            | `npx playwright test --grep @TABS-005` (from `basalt-app/`)                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                              |

## Scenario

Given notes `a` and `b` are open
When the owner middle-clicks tab `a`, then tab `b`
Then after the first click only `b` remains and is selected
And after the second click no tab remains and `No note open` is shown

## Steps observed in the app

| #   | Action         | Observed result      |
| --- | -------------- | -------------------- |
| 1   | Middle-click a | Only b, selected     |
| 2   | Middle-click b | No tabs; empty state |

## Related cases

TABS-004.
