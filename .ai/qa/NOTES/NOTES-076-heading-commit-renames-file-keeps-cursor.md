# NOTES-076 — Renames the file to the new first heading and keeps the cursor and typing flow when the cursor leaves the heading

| Field          | Value                                                                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-076                                                                                                                                                                                                 |
| Status         | Active                                                                                                                                                                                                    |
| Priority       | High                                                                                                                                                                                                      |
| Type           | UI                                                                                                                                                                                                        |
| Requirement    | [AC-06.2](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md), [AC-06.9](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                        |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"renames the file to the new first heading and keeps the cursor and typing flow when the cursor leaves the heading"` |
| Run            | `npx playwright test --grep @NOTES-076` (from `basalt-app/`)                                                                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                                                                          |

## Scenario

Given note `Untitled` containing `# \nbody` is open
And the clock is frozen
When the owner types `Plan` in the heading, moves down and types `X`
Then the tab is `Plan`, `Plan.md` holds `# Plan\nbodyX` after the autosave delay and it is the only file

## Steps observed in the app

| #   | Action                   | Observed result |
| --- | ------------------------ | --------------- |
| 1   | Type Plan, ArrowDown     | Tab Plan        |
| 2   | Type X, advance 1 000 ms | Plan.md saved   |

## Related cases

NOTES-075, NOTES-077.
