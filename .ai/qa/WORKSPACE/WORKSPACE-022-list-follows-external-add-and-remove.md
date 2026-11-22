# WORKSPACE-022 — Adds and removes the list entry within the watcher debounce when a Markdown file is created or deleted outside the app

| Field          | Value                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | WORKSPACE-022                                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                                           |
| Requirement    | [AC-01.8](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                                      |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"adds and removes the list entry within the watcher debounce when a Markdown file is created or deleted outside the app"` |
| Run            | `npx playwright test --grep @WORKSPACE-022` (from `basalt-app/`)                                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                                             |

## Scenario

Given note `a` is listed
And the clock is frozen
When `fresh.md` is created and `a.md` is deleted outside the app and the watcher debounce passes after each
Then the list shows `a`, `fresh` after the creation and `fresh` after the deletion

## Steps observed in the app

| #   | Action                          | Observed result |
| --- | ------------------------------- | --------------- |
| 1   | Create fresh.md, advance 300 ms | a, fresh        |
| 2   | Delete a.md, advance 300 ms     | fresh           |

## Related cases

WORKSPACE-023, WORKSPACE-024.
