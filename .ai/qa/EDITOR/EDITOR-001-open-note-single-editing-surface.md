# EDITOR-001 — Shows the note text in a single focused editing surface when a note is opened from the list

| Field          | Value                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-001                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                          |
| Requirement    | [AC-01.18](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                    |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"shows the note text in a single focused editing surface when a note is opened from the list"` |
| Run            | `npx playwright test --grep @EDITOR-001` (from `basalt-app/`)                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                            |

## Scenario

Given a workspace with note `a` containing a heading and a paragraph
When the owner chooses `a` in the list
Then the editor shows `# Alpha` and has focus
And exactly one editing surface exists and no textarea
And the empty-state text `No note open` is gone

## Steps observed in the app

| #   | Action        | Observed result                   |
| --- | ------------- | --------------------------------- |
| 1   | Choose note a | Editor focused with the note text |

## Related cases

EDITOR-009 (typing). Not covered: a note whose first line is not a heading.
