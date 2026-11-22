# WINDOW-007 — Makes the tree the only scroller in the sidebar and keeps the watcher notice outside it when many notes are listed in a short window

| Field          | Value                                                                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WINDOW-007                                                                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                                                                     |
| Priority       | Medium                                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                                         |
| Requirement    | [AC-09.1](../../specs/implemented/2026-11-17-scrolling-model.md), [AC-09.3](../../specs/implemented/2026-11-17-scrolling-model.md)                                                                                         |
| Implementation | [`basalt-app/e2e/scrolling.spec.ts`](../../../basalt-app/e2e/scrolling.spec.ts) — `"makes the tree the only scroller in the sidebar and keeps the watcher notice outside it when many notes are listed in a short window"` |
| Run            | `npx playwright test --grep @WINDOW-007` (from `basalt-app/`)                                                                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                                                                           |

## Scenario

Given the viewport is 1280 by 500 and a workspace has 60 notes
And the watcher cannot start so the notice is shown
When the sidebar is inspected
Then exactly one scroller exists in the sidebar and it contains the tree
And the notice is not inside it and the scrollbar is thin

## Steps observed in the app

| #   | Action             | Observed result            |
| --- | ------------------ | -------------------------- |
| 1   | Open the workspace | Notice shown               |
| 2   | Inspect scrollers  | One scroller with the tree |

## Related cases

WORKSPACE-024.
