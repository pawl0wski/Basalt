# TABS-001 — Opens one tab per note and focuses the existing tab when an already open note is chosen again

| Field          | Value                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TABS-001                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                        |
| Priority       | High                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                            |
| Requirement    | [AC-01.16](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                      |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"opens one tab per note and focuses the existing tab when an already open note is chosen again"` |
| Run            | `npx playwright test --grep @TABS-001` (from `basalt-app/`)                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                              |

## Scenario

Given a workspace with notes `a`, `b` and `projects/Roadmap`
And tabs `a`, `b` and `Roadmap` are open
When the owner chooses `a` in the list again
Then there are still three tabs
And tab `a` is selected and its editor is visible and focused; `b` is not selected and hidden

## Steps observed in the app

| #   | Action             | Observed result                  |
| --- | ------------------ | -------------------------------- |
| 1   | Open a, b, Roadmap | Three tabs in order              |
| 2   | Choose a again     | Tab a selected; still three tabs |

## Related cases

TABS-004, TABS-005 (closing).
