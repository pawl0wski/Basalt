# WORKSPACE-027 — Creates Untitled and opens it in a selected tab when the title bar New note button is used

| Field          | Value                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-027                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                           |
| Priority       | Medium                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                               |
| Requirement    | [AC-01.10](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                         |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"creates Untitled and opens it in a selected tab when the title bar New note button is used"` |
| Run            | `npx playwright test --grep @WORKSPACE-027` (from `basalt-app/`)                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                 |

## Scenario

Given a workspace with note `a` is open
When the owner uses the title bar New note button
Then the list shows `a`, `Untitled`
And a selected tab named `Untitled` is in the title bar

## Steps observed in the app

| #   | Action                       | Observed result               |
| --- | ---------------------------- | ----------------------------- |
| 1   | Click the title bar New note | Untitled listed; tab selected |

## Related cases

WORKSPACE-026.
