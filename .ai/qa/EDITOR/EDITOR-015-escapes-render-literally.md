# EDITOR-015 — Renders escaped characters literally off the active line and keeps the backslashes in the file

| Field          | Value                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | EDITOR-015                                                                                                                                                                     |
| Status         | Active                                                                                                                                                                         |
| Priority       | Medium                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                             |
| Requirement    | [AC-10.4, AC-10.5, AC-10.9, AC-10.10](../../specs/implemented/2026-11-17-live-preview-fences-and-escapes.md)                                                                   |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"renders escaped characters literally off the active line and keeps the backslashes in the file"` |
| Run            | `npx playwright test --grep @EDITOR-015` (from `basalt-app/`)                                                                                                                  |
| Review         | AI draft — awaiting human review                                                                                                                                               |

## Scenario

Given a note with escaped asterisks and backtick and an inline code span containing an escape
When the owner opens it and moves the cursor onto and off the escaped line
Then off the line the escapes render literally and the code span keeps its backslash
And on the line the source with backslashes shows
And the file is unchanged

## Steps observed in the app

| #   | Action             | Observed result                          |
| --- | ------------------ | ---------------------------------------- |
| 1   | Open a             | Literal characters; code keeps backslash |
| 2   | Click escaped line | Source shown                             |
| 3   | Click another line | Literal again                            |

## Related cases

EDITOR-011.
