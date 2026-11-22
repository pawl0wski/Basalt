# EDITOR-008 — Renders a line once the cursor leaves it and shows the source again on the line with the cursor

| Field          | Value                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-008                                                                                                                                                                      |
| Status         | Active                                                                                                                                                                          |
| Priority       | High                                                                                                                                                                            |
| Type           | UI                                                                                                                                                                              |
| Requirement    | [AC-01.18](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                        |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"renders a line once the cursor leaves it and shows the source again on the line with the cursor"` |
| Run            | `npx playwright test --grep @EDITOR-008` (from `basalt-app/`)                                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                                |

## Scenario

Given an empty note is open
When the owner types a heading, a line with bold and emphasis, and a last line, then moves the cursor up twice
Then lines without the cursor are rendered (`Title`, `bold and em`, `last`)
And the line with the cursor shows its source

## Steps observed in the app

| #   | Action           | Observed result                 |
| --- | ---------------- | ------------------------------- |
| 1   | Type three lines | Heading and bold lines rendered |
| 2   | ArrowUp          | Bold line shows source          |
| 3   | ArrowUp          | Heading shows `## Title`        |

## Related cases

EDITOR-009, EDITOR-010.
