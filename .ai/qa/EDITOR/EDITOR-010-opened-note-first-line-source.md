# EDITOR-010 — Shows the source of the first line and renders task items when a note is opened

| Field          | Value                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-010                                                                                                                                                      |
| Status         | Active                                                                                                                                                          |
| Priority       | Medium                                                                                                                                                          |
| Type           | UI                                                                                                                                                              |
| Requirement    | [Live-preview editor, requirement 2](../../specs/implemented/2026-11-08-live-preview-editor.md)                                                                 |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"shows the source of the first line and renders task items when a note is opened"` |
| Run            | `npx playwright test --grep @EDITOR-010` (from `basalt-app/`)                                                                                                   |
| Review         | AI draft — awaiting human review                                                                                                                                |

## Scenario

Given a note with a heading and a task list
When the owner opens it
Then the first line shows its source
And two task items are rendered, one of them done

## Steps observed in the app

| #   | Action | Observed result                   |
| --- | ------ | --------------------------------- |
| 1   | Open a | Source `# Alpha`; 2 tasks; 1 done |

## Related cases

EDITOR-008.
