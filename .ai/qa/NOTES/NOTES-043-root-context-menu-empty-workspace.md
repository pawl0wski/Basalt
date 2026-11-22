# NOTES-043 — Offers the root menu when the context menu is opened in an empty workspace

| Field          | Value                                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-043                                                                                                                                                              |
| Status         | Active                                                                                                                                                                 |
| Priority       | Medium                                                                                                                                                                 |
| Type           | UI                                                                                                                                                                     |
| Requirement    | [AC-04.9](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                              |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"offers the root menu when the context menu is opened in an empty workspace"` |
| Run            | `npx playwright test --grep @NOTES-043` (from `basalt-app/`)                                                                                                           |
| Review         | AI draft — awaiting human review                                                                                                                                       |

## Scenario

Given an empty workspace
When the owner right-clicks in the sidebar
Then the root menu is shown

## Steps observed in the app

| #   | Action      | Observed result |
| --- | ----------- | --------------- |
| 1   | Right-click | Root menu       |

## Related cases

NOTES-042.
