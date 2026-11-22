# EDITOR-012 — Shows only the source of the fence line the cursor is on and hides the other fence line

| Field          | Value                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-012                                                                                                                                                              |
| Status         | Active                                                                                                                                                                  |
| Priority       | High                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                      |
| Requirement    | [AC-10.2, AC-10.10](../../specs/implemented/2026-11-17-live-preview-fences-and-escapes.md)                                                                              |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"shows only the source of the fence line the cursor is on and hides the other fence line"` |
| Run            | `npx playwright test --grep @EDITOR-012` (from `basalt-app/`)                                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                                        |

## Scenario

Given a note with a fenced block, opened
When the owner puts the cursor on the opening fence, then the closing fence, then the code
Then only the cursor's fence line shows its source (a js-tagged opening fence, then a plain closing fence)
And with the cursor in the code both fences are hidden
And the file is unchanged

## Steps observed in the app

| #   | Action              | Observed result           |
| --- | ------------------- | ------------------------- |
| 1   | Click opening fence | Shows ```js; other hidden |
| 2   | Click closing fence | Shows ```; other hidden   |
| 3   | Click code          | Both hidden               |

## Related cases

EDITOR-011.
