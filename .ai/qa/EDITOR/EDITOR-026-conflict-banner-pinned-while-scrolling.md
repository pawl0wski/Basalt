# EDITOR-026 — Keeps the conflict banner at the top of the editor and as wide as the text column while the note scrolls

| Field          | Value                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | EDITOR-026                                                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                                                       |
| Priority       | Medium                                                                                                                                                                                                       |
| Type           | UI                                                                                                                                                                                                           |
| Requirement    | [AC-01.12](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                                     |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"keeps the conflict banner at the top of the editor and as wide as the text column while the note scrolls"` |
| Run            | `npx playwright test --grep @EDITOR-026` (from `basalt-app/`)                                                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                                             |

## Scenario

Given a 200-line note is open with `!` typed
And the clock is frozen
And the file was changed on disk so the conflict banner is shown
When the editor is scrolled down
Then the note scrolled and the `main` area did not
And the banner keeps its vertical position and matches the editor's left edge and width within 2 px

## Steps observed in the app

| #   | Action                         | Observed result           |
| --- | ------------------------------ | ------------------------- |
| 1   | Change on disk, advance 300 ms | Conflict banner           |
| 2   | Scroll to 1 500 px             | Banner position unchanged |

## Related cases

EDITOR-027, SAVING-006.
