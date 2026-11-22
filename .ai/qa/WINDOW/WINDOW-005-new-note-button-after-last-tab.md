# WINDOW-005 — Places the New note button right after the last tab and between the sidebar toggle and the window buttons when two notes are created

| Field          | Value                                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WINDOW-005                                                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                                                               |
| Priority       | Medium                                                                                                                                                                                                               |
| Type           | UI                                                                                                                                                                                                                   |
| Requirement    | [Window shell, decisions 3 and 17](../../specs/implemented/2026-10-30-design-system-window-shell.md)                                                                                                                 |
| Implementation | [`basalt-app/e2e/window.spec.ts`](../../../basalt-app/e2e/window.spec.ts) — `"places the New note button right after the last tab and between the sidebar toggle and the window buttons when two notes are created"` |
| Run            | `npx playwright test --grep @WINDOW-005` (from `basalt-app/`)                                                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                                                     |

## Scenario

Given a workspace with two notes is open
When the owner uses New note twice
Then two tabs exist and no `Basalt` text is in the bar
And the sidebar toggle is left of the last tab
And the New note button is less than 48 px right of the last tab and well left of the window buttons

## Steps observed in the app

| #   | Action               | Observed result                       |
| --- | -------------------- | ------------------------------------- |
| 1   | Click New note twice | Two tabs                              |
| 2   | Measure positions    | Toggle < tabs < plus < window buttons |

## Related cases

Overflow into the Open notes menu (decision 6) is not covered.
