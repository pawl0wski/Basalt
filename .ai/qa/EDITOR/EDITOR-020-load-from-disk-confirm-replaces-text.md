# EDITOR-020 — Replaces the typed text with the disk text and clears the banner when Load version from disk is confirmed

| Field          | Value                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-020                                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                                        |
| Priority       | High                                                                                                                                                                                                          |
| Type           | UI                                                                                                                                                                                                            |
| Requirement    | [AC-01.14](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                                      |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"replaces the typed text with the disk text and clears the banner when Load version from disk is confirmed"` |
| Run            | `npx playwright test --grep @EDITOR-020` (from `basalt-app/`)                                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                                              |

## Scenario

Given the Load version from disk confirmation is open for a dirty conflicted note
When the owner confirms Load version from disk
Then the editor shows `theirs` without `mine`
And the banner is gone and the file holds `theirs`

## Steps observed in the app

| #   | Action  | Observed result           |
| --- | ------- | ------------------------- |
| 1   | Confirm | Editor `theirs`; no alert |

## Related cases

EDITOR-019.
