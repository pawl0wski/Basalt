# TABS-008 — Restores the open tabs in order and the active tab after a reload

| Field          | Value                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TABS-008                                                                                                                                          |
| Status         | Active                                                                                                                                            |
| Priority       | High                                                                                                                                              |
| Type           | UI                                                                                                                                                |
| Requirement    | [AC-01.17](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                          |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"restores the open tabs in order and the active tab after a reload"` |
| Run            | `npx playwright test --grep @TABS-008` (from `basalt-app/`)                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                  |

## Scenario

Given notes `a`, `c` and `b` were opened in that order and `c` is active
When the owner reloads the app
Then the tabs are `a`, `c`, `b` in that order
And `c` is selected and its editor shows `C`

## Steps observed in the app

| #   | Action                 | Observed result     |
| --- | ---------------------- | ------------------- |
| 1   | Open a, c, b; select c | c active            |
| 2   | Reload                 | Same tabs; c active |

## Related cases

TABS-009 (missing note). Per-workspace restore is in notes-roundtrip.
