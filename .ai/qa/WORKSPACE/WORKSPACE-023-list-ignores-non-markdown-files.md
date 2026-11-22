# WORKSPACE-023 — Leaves a non-Markdown file out of the list when it is created outside the app

| Field          | Value                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-023                                                                                                                                                       |
| Status         | Active                                                                                                                                                              |
| Priority       | Medium                                                                                                                                                              |
| Type           | UI                                                                                                                                                                  |
| Requirement    | [AC-01.8](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (Markdown files only)                                                                       |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"leaves a non-Markdown file out of the list when it is created outside the app"` |
| Run            | `npx playwright test --grep @WORKSPACE-023` (from `basalt-app/`)                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                    |

## Scenario

Given note `a` is listed
And the clock is frozen
When `photo.png` and `marker.md` are created outside the app and the debounce passes
Then the list shows `a`, `marker` and no `photo`

## Steps observed in the app

| #   | Action                           | Observed result |
| --- | -------------------------------- | --------------- |
| 1   | Create two files, advance 300 ms | a, marker       |

## Related cases

WORKSPACE-022.
