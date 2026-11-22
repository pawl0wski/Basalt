# EDITOR-014 — Keeps the content of an unclosed fence and shows its opening line source when the cursor is put on it

| Field          | Value                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-014                                                                                                                                                                            |
| Status         | Active                                                                                                                                                                                |
| Priority       | Medium                                                                                                                                                                                |
| Type           | UI                                                                                                                                                                                    |
| Requirement    | [AC-10.6](../../specs/implemented/2026-11-17-live-preview-fences-and-escapes.md)                                                                                                      |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"keeps the content of an unclosed fence and shows its opening line source when the cursor is put on it"` |
| Run            | `npx playwright test --grep @EDITOR-014` (from `basalt-app/`)                                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                                      |

## Scenario

Given a note with an unclosed fence
When the owner opens it and puts the cursor on the opening fence
Then the content is kept and the fence line is hidden before
And the fence source shows on the cursor line and the file is unchanged

## Steps observed in the app

| #   | Action      | Observed result             |
| --- | ----------- | --------------------------- |
| 1   | Open a      | Fence hidden; content shown |
| 2   | Click fence | Shows ```                   |

## Related cases

EDITOR-011.
