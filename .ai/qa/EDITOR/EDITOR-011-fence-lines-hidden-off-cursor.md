# EDITOR-011 — Hides the fence lines and shows the code with its blank line when the cursor is outside a fenced block

| Field          | Value                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-011                                                                                                                                                                             |
| Status         | Active                                                                                                                                                                                 |
| Priority       | High                                                                                                                                                                                   |
| Type           | UI                                                                                                                                                                                     |
| Requirement    | [AC-10.1, AC-10.3, AC-10.10](../../specs/implemented/2026-11-17-live-preview-fences-and-escapes.md)                                                                                    |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"hides the fence lines and shows the code with its blank line when the cursor is outside a fenced block"` |
| Run            | `npx playwright test --grep @EDITOR-011` (from `basalt-app/`)                                                                                                                          |
| Review         | AI draft — awaiting human review                                                                                                                                                       |

## Scenario

Given a note with a fenced block with info string, a blank line and `Test`
When the owner opens it
Then both fence lines are empty and the block is styled
And the blank line and `Test` are shown and no backticks
And the file is unchanged

## Steps observed in the app

| #   | Action | Observed result                          |
| --- | ------ | ---------------------------------------- |
| 1   | Open a | 8 lines; fence lines empty; Test visible |

## Related cases

EDITOR-012, EDITOR-013, EDITOR-014.
