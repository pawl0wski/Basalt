# TOASTS-010 — Shows the read-only message in the sidebar and no toast when a note is moved in a read-only workspace

| Field          | Value                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TOASTS-010                                                                                                                                                                            |
| Status         | Active                                                                                                                                                                                |
| Priority       | High                                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                                    |
| Requirement    | [AC-08.3](../../specs/2026-11-17-informational-toasts.md)                                                                                                                             |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"shows the read-only message in the sidebar and no toast when a note is moved in a read-only workspace"` |
| Run            | `npx playwright test --grep @TOASTS-010` (from `basalt-app/`)                                                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                                                      |

## Scenario

Given a read-only workspace with `Ideas` and `projects/Roadmap`
When the owner drops `Ideas` onto `projects`
Then the sidebar status says `The workspace folder is read-only. Nothing was changed.` and no toast appears

## Steps observed in the app

| #   | Action                   | Observed result          |
| --- | ------------------------ | ------------------------ |
| 1   | Drag Ideas onto projects | Sidebar status; no toast |

## Related cases

TOASTS-011.
