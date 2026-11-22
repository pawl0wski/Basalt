# TABS-002 — Shows the unsaved dot while typing and removes it after the autosave delay passes

| Field          | Value                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TABS-002                                                                                                                                                          |
| Status         | Active                                                                                                                                                            |
| Priority       | High                                                                                                                                                              |
| Type           | UI                                                                                                                                                                |
| Requirement    | [AC-01.19](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                          |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"shows the unsaved dot while typing and removes it after the autosave delay passes"` |
| Run            | `npx playwright test --grep @TABS-002` (from `basalt-app/`)                                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                                  |

## Scenario

Given note `a` containing `base` is open
And the clock is frozen
When the owner types ` more` and the autosave delay passes
Then while unsaved the tab is named `a not saved` and one dot is shown
And after the delay the name is `a`, no dot is shown and the file holds `base more`

## Steps observed in the app

| #   | Action           | Observed result                   |
| --- | ---------------- | --------------------------------- |
| 1   | Type ` more`     | Tab `a not saved`; one dot        |
| 2   | Advance 1 000 ms | Tab `a`; no dot; file `base more` |

## Related cases

SAVING-001. The dot is decorative (`aria-hidden`, AC-07.8), so the test finds it by its `data-unsaved-dot` attribute.
