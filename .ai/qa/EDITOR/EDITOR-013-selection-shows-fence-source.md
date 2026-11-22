# EDITOR-013 — Shows the source of every fence line a selection touches

| Field          | Value                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-013                                                                                                                               |
| Status         | Active                                                                                                                                   |
| Priority       | Medium                                                                                                                                   |
| Type           | UI                                                                                                                                       |
| Requirement    | [AC-10.7, AC-10.8](../../specs/implemented/2026-11-17-live-preview-fences-and-escapes.md)                                                |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"shows the source of every fence line a selection touches"` |
| Run            | `npx playwright test --grep @EDITOR-013` (from `basalt-app/`)                                                                            |
| Review         | AI draft — awaiting human review                                                                                                         |

## Scenario

Given a note with a tilde fence, cursor after it
When the owner extends the selection upward over the fence
Then both tilde fence lines show their source

## Steps observed in the app

| #   | Action           | Observed result    |
| --- | ---------------- | ------------------ |
| 1   | Click end line   | Fences hidden      |
| 2   | Shift+ArrowUp x3 | Both `~~~` visible |

## Related cases

EDITOR-012.
