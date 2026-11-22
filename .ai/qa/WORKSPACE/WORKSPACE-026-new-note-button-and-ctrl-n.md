# WORKSPACE-026 — Creates Untitled and then Untitled 1 at once without a dialog when the New note button and Ctrl+N are used

| Field          | Value                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | WORKSPACE-026                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                               |
| Requirement    | [AC-01.10](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                         |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"creates Untitled and then Untitled 1 at once without a dialog when the New note button and Ctrl+N are used"` |
| Run            | `npx playwright test --grep @WORKSPACE-026` (from `basalt-app/`)                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                                 |

## Scenario

Given a workspace with note `a` is open
When the owner uses the sidebar New note button and then presses Ctrl+N
Then the list shows `a`, `Untitled`, `Untitled 1` and `Untitled 1` is selected
And no dialog appears
And the files on disk are exactly `Untitled 1.md`, `Untitled.md`, `a.md`

## Steps observed in the app

| #   | Action         | Observed result                |
| --- | -------------- | ------------------------------ |
| 1   | Click New note | Untitled listed                |
| 2   | Press Ctrl+N   | Untitled 1 listed and selected |

## Related cases

WORKSPACE-027, WORKSPACE-028, EDITOR-003.
