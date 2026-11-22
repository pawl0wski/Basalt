# WORKSPACE-017 — Lists folders first and then notes sorted, without non-Markdown files or the attachments folder, and shows No note open when a workspace is opened

| Field          | Value                                                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-017                                                                                                                                                                                                                            |
| Status         | Active                                                                                                                                                                                                                                   |
| Priority       | High                                                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                                                       |
| Requirement    | [AC-01.8](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) and [Data model — listing](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                         |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"lists folders first and then notes sorted, without non-Markdown files or the attachments folder, and shows No note open when a workspace is opened"` |
| Run            | `npx playwright test --grep @WORKSPACE-017` (from `basalt-app/`)                                                                                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                         |

## Scenario

Given a workspace with folders `projects` and `attachments`, notes `Welcome` and `Ideas`, a `readme.txt` and an image
When the workspace is opened
Then the list shows `projects`, `Ideas`, `Welcome` in that order
And no `readme` entry and no attachments folder appear
And the editor area says `No note open`

## Steps observed in the app

| #   | Action             | Observed result                  |
| --- | ------------------ | -------------------------------- |
| 1   | Open the workspace | Folders first, then notes sorted |

## Related cases

WORKSPACE-022, WORKSPACE-023 (live changes). The built-in demo workspace is no longer used.
