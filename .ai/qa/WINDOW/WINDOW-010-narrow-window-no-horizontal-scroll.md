# WINDOW-010 — Shows no horizontal page scrolling when a note with a very long name is open in a 360 px wide window

| Field          | Value                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | WINDOW-010                                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                                     |
| Priority       | Medium                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                         |
| Requirement    | [AC-09.5](../../specs/implemented/2026-11-17-scrolling-model.md)                                                                                                                           |
| Implementation | [`basalt-app/e2e/scrolling.spec.ts`](../../../basalt-app/e2e/scrolling.spec.ts) — `"shows no horizontal page scrolling when a note with a very long name is open in a 360 px wide window"` |
| Run            | `npx playwright test --grep @WINDOW-010` (from `basalt-app/`)                                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                                           |

## Scenario

Given the viewport is 360 by 640 and a note with a very long name is listed
When the workspace is shown
Then the page does not scroll horizontally

## Steps observed in the app

| #   | Action             | Observed result        |
| --- | ------------------ | ---------------------- |
| 1   | Open the workspace | No horizontal overflow |

## Related cases

WORKSPACE-008.
