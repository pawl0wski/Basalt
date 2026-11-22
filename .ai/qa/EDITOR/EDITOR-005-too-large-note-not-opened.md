# EDITOR-005 — Shows the too-large message, mounts no editor and never writes the file when a note over 5 MiB is opened

| Field          | Value                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | EDITOR-005                                                                                                                                                                               |
| Status         | Active                                                                                                                                                                                   |
| Priority       | High                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                       |
| Requirement    | [AC-01.15](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                 |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"shows the too-large message, mounts no editor and never writes the file when a note over 5 MiB is opened"` |
| Run            | `npx playwright test --grep @EDITOR-005` (from `basalt-app/`)                                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                                         |

## Scenario

Given a workspace with a note of 5 MiB plus one byte
When the owner opens it
Then the message about notes over 5 MiB is shown, no editor is mounted and the tab exists
And the file still has its original size and bytes

## Steps observed in the app

| #   | Action   | Observed result             |
| --- | -------- | --------------------------- |
| 1   | Open big | Message; no editor; tab big |

## Related cases

Boundary exactly 5 MiB is covered by Vitest. EDITOR-006, EDITOR-007.
