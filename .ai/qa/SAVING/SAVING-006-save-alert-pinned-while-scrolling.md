# SAVING-006 — Keeps the save-failure alert at the top of the editor and as wide as the text column while the note scrolls

| Field          | Value                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | SAVING-006                                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                                      |
| Priority       | Medium                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                          |
| Requirement    | [UI/UX — Errors](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (banner as wide as the text column, pinned to the top of the editor while the note scrolls)                  |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"keeps the save-failure alert at the top of the editor and as wide as the text column while the note scrolls"` |
| Run            | `npx playwright test --grep @SAVING-006` (from `basalt-app/`)                                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                                            |

## Scenario

Given a read-only workspace with a 200-line note `a`, open in a tab
And the save-failure alert is shown after the owner typed `!`
When the editor is scrolled down
Then the editor content has scrolled and the `main` area has not
And the alert keeps its vertical position and matches the editor's left edge and width within 2 px

## Steps observed in the app

| #   | Action                                  | Observed result                                   |
| --- | --------------------------------------- | ------------------------------------------------- |
| 1   | Type `!` and advance the clock 1 000 ms | Alert shown                                       |
| 2   | Scroll the editor to 1 500 px           | Scroll position above 0; alert position unchanged |

## Related cases

Conflict and deleted-file banners (AC-01.12) are covered in `external-changes.spec.ts`. CodeMirror internals have no accessible role, so the test uses its `cm-scroller` and `cm-editor` classes.
