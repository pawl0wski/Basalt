# WINDOW-006 — Scrolls a long note inside the editor and never scrolls the shell or the page when the cursor moves to the end of the note

| Field          | Value                                                                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WINDOW-006                                                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                                               |
| Requirement    | [AC-09.2](../../specs/implemented/2026-11-17-scrolling-model.md), [AC-09.6](../../specs/implemented/2026-11-17-scrolling-model.md)                                                                               |
| Implementation | [`basalt-app/e2e/scrolling.spec.ts`](../../../basalt-app/e2e/scrolling.spec.ts) — `"scrolls a long note inside the editor and never scrolls the shell or the page when the cursor moves to the end of the note"` |
| Run            | `npx playwright test --grep @WINDOW-006` (from `basalt-app/`)                                                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                                                 |

## Scenario

Given a note with 200 lines is open
When the cursor moves to the end of the note
Then `main` has hidden overflow and does not scroll, the page does not scroll
And the editor scroller scrolls and has a scroll position above 0

## Steps observed in the app

| #   | Action        | Observed result              |
| --- | ------------- | ---------------------------- |
| 1   | Open the note | Editor scrollable; shell not |
| 2   | Ctrl+End      | Editor scrolled; main at 0   |

## Related cases

WINDOW-003, WINDOW-007. Structure is read from computed styles because regions have no roles.
