# TOASTS-001 — Shows a collision toast that dismisses itself, changes no file and leaves the sidebar without a message when a note is moved onto an existing name

| Field          | Value                                                                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TOASTS-001                                                                                                                                                                                                                         |
| Status         | Active                                                                                                                                                                                                                             |
| Priority       | High                                                                                                                                                                                                                               |
| Type           | UI                                                                                                                                                                                                                                 |
| Requirement    | [AC-08.1 and AC-08.8](../../specs/2026-11-17-informational-toasts.md)                                                                                                                                                              |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"shows a collision toast that dismisses itself, changes no file and leaves the sidebar without a message when a note is moved onto an existing name"` |
| Run            | `npx playwright test --grep @TOASTS-001` (from `basalt-app/`)                                                                                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                   |

## Scenario

Given workspace notes `Ideas`, `Todo`, `Notes`, `Plan` and a folder `projects` holding notes of the same names
And the clock is frozen
When the owner drops `Ideas` onto `projects`
Then exactly one toast says `"Ideas.md" already exists in the destination. Nothing was moved.`
And the sidebar shows no status message and no file changed
And after the toast duration the toast is gone

## Steps observed in the app

| #   | Action                   | Observed result              |
| --- | ------------------------ | ---------------------------- |
| 1   | Drag Ideas onto projects | One toast; no sidebar status |
| 2   | Advance 6 000 ms         | No toast                     |

## Related cases

TOASTS-002, TOASTS-003.
