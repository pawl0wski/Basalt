# EDITOR-009 — Keeps one editing surface and saves the exact typed source when formatted Markdown is typed

| Field          | Value                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-009                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                          |
| Requirement    | [AC-01.18](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (the saved file text equals the typed source)                                                      |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"keeps one editing surface and saves the exact typed source when formatted Markdown is typed"` |
| Run            | `npx playwright test --grep @EDITOR-009` (from `basalt-app/`)                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                            |

## Scenario

Given an empty note is open
And the clock is frozen
When the owner types headings, code, strong text, a link and a quote and the autosave delay passes
Then one editing surface exists and no textarea or text input
And code and strong text are styled
And the saved file equals the typed source

## Steps observed in the app

| #   | Action           | Observed result             |
| --- | ---------------- | --------------------------- |
| 1   | Type the source  | Styled code and strong      |
| 2   | Advance 1 000 ms | `Head.md` equals the source |

## Related cases

EDITOR-002.
