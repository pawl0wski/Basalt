# EDITOR-004 — Focuses the editor of the new Untitled note so typing starts at once when Ctrl+N is pressed

| Field          | Value                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-004                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                          |
| Requirement    | [AC-01.10](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                    |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"focuses the editor of the new Untitled note so typing starts at once when Ctrl+N is pressed"` |
| Run            | `npx playwright test --grep @EDITOR-004` (from `basalt-app/`)                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                            |

## Scenario

Given a workspace with note `a`
And the clock is frozen
When the owner presses Ctrl+N and types `hello`
Then the editor of `Untitled` was focused before typing
And after the autosave delay `Untitled.md` holds `# hello`

## Steps observed in the app

| #   | Action                    | Observed result               |
| --- | ------------------------- | ----------------------------- |
| 1   | Press Ctrl+N              | Editor `Untitled` focused     |
| 2   | Type and advance 1 000 ms | `Untitled.md` holds `# hello` |

## Related cases

EDITOR-003 (button).
