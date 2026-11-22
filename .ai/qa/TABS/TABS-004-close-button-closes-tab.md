# TABS-004 — Closes the clicked tab and keeps the others when its Close button is used

| Field          | Value                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TABS-004                                                                                                                                                  |
| Status         | Active                                                                                                                                                    |
| Priority       | Medium                                                                                                                                                    |
| Type           | UI                                                                                                                                                        |
| Requirement    | [AC-01.16](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                  |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"closes the clicked tab and keeps the others when its Close button is used"` |
| Run            | `npx playwright test --grep @TABS-004` (from `basalt-app/`)                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                          |

## Scenario

Given notes `a`, `b` and `c` are open
When the owner uses the Close button of tab `c`
Then tabs `a` and `b` remain

## Steps observed in the app

| #   | Action        | Observed result |
| --- | ------------- | --------------- |
| 1   | Click Close c | Two tabs left   |

## Related cases

TABS-005 (middle click), TABS-006 (dirty tab).
