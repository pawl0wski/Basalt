# WORKSPACE-024 — Shows the focus-refresh notice and updates the list only when the window is focused when the watcher cannot start

| Field          | Value                                                                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-024                                                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                                                           |
| Requirement    | [AC-01.8](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (focus-fallback mode shows the refresh notice) and [Edge cases — Watcher cannot start](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"shows the focus-refresh notice and updates the list only when the window is focused when the watcher cannot start"`                      |
| Run            | `npx playwright test --grep @WORKSPACE-024` (from `basalt-app/`)                                                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                                                             |

## Scenario

Given the watcher cannot start
And note `a` is listed
And the clock is frozen
When `late.md` is created outside the app, 600 ms pass, and then the window receives focus
Then the notice `The list refreshes when the window is focused.` is shown
And the list stays `a` until the focus and then shows `a`, `late`

## Steps observed in the app

| #   | Action                         | Observed result |
| --- | ------------------------------ | --------------- |
| 1   | Open with failing watcher      | Notice shown    |
| 2   | Create late.md, advance 600 ms | List still a    |
| 3   | Focus the window               | a, late         |

## Related cases

WORKSPACE-025.
