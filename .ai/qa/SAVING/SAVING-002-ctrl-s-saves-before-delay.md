# SAVING-002 — Writes the typed text at once on Ctrl+S before the autosave delay has passed

| Field          | Value                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | SAVING-002                                                                                                                                                   |
| Status         | Active                                                                                                                                                       |
| Priority       | High                                                                                                                                                         |
| Type           | UI                                                                                                                                                           |
| Requirement    | [UI/UX — Editing and saving](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (Ctrl/Cmd+S saves immediately)                                    |
| Implementation | [`basalt-app/e2e/saving.spec.ts`](../../../basalt-app/e2e/saving.spec.ts) — `"writes the typed text at once on Ctrl+S before the autosave delay has passed"` |
| Run            | `npx playwright test --grep @SAVING-002` (from `basalt-app/`)                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                             |

## Scenario

Given a workspace with an empty note `a`, open in a tab
And the clock is frozen so the autosave delay cannot pass
When the owner types `typed` and presses Ctrl+S
Then the tab is named `a` again
And the file holds exactly `typed`

## Steps observed in the app

| #   | Action       | Observed result                           |
| --- | ------------ | ----------------------------------------- |
| 1   | Type `typed` | Tab named `a not saved`; file still empty |
| 2   | Press Ctrl+S | Tab named `a`; file holds `typed`         |

## Related cases

SAVING-001 (autosave). Not covered: the browser's own save dialog, which Playwright cannot observe in the memory platform.
