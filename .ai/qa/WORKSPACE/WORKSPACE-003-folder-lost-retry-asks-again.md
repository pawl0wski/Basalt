# WORKSPACE-003 — Asks again that the workspace folder is not available when Retry is used while the folder is still missing

| Field          | Value                                                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-003                                                                                                                                                                                                  |
| Status         | Active                                                                                                                                                                                                         |
| Priority       | Medium                                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                                             |
| Requirement    | [Edge cases — Workspace folder deleted/renamed while open](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                       |
| Implementation | [`basalt-app/e2e/external-changes.spec.ts`](../../../basalt-app/e2e/external-changes.spec.ts) — `"asks again that the workspace folder is not available when Retry is used while the folder is still missing"` |
| Run            | `npx playwright test --grep @WORKSPACE-003` (from `basalt-app/`)                                                                                                                                               |
| Review         | AI draft — awaiting human review                                                                                                                                                                               |

## Scenario

Given the folder-lost banner is shown for a dirty note
When the owner chooses Retry while the folder is still missing
Then a dialog says the workspace folder is not available
And the unsaved text is still in the editor

## Steps observed in the app

| #   | Action       | Observed result   |
| --- | ------------ | ----------------- |
| 1   | Choose Retry | Dialog; text kept |

## Related cases

WORKSPACE-002. Idempotence: the repeated attempt changes nothing.
