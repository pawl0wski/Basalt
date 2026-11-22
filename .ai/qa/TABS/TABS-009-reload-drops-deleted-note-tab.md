# TABS-009 — Drops the tab of a note that was deleted outside the app when the app is reloaded

| Field          | Value                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TABS-009                                                                                                                                                          |
| Status         | Active                                                                                                                                                            |
| Priority       | High                                                                                                                                                              |
| Type           | UI                                                                                                                                                                |
| Requirement    | [AC-01.17](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (entries that no longer exist are dropped)                                               |
| Implementation | [`basalt-app/e2e/editor.spec.ts`](../../../basalt-app/e2e/editor.spec.ts) — `"drops the tab of a note that was deleted outside the app when the app is reloaded"` |
| Run            | `npx playwright test --grep @TABS-009` (from `basalt-app/`)                                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                                  |

## Scenario

Given notes `a` and `b` are open
And `a.md` is deleted outside the app
When the owner reloads the app
Then only tab `b` remains and it is selected

## Steps observed in the app

| #   | Action                      | Observed result              |
| --- | --------------------------- | ---------------------------- |
| 1   | Delete a.md outside the app | No immediate change asserted |
| 2   | Reload                      | Only b, selected             |

## Related cases

TABS-008.
