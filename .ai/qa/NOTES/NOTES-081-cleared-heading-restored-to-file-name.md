# NOTES-081 — Restores the heading to the file name and changes no file when a cleared heading is left

| Field          | Value                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-081                                                                                                                                                                        |
| Status         | Active                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                               |
| Requirement    | [AC-06.6](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                                                                                 |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"restores the heading to the file name and changes no file when a cleared heading is left"` |
| Run            | `npx playwright test --grep @NOTES-081` (from `basalt-app/`)                                                                                                                     |
| Review         | AI draft — awaiting human review                                                                                                                                                 |

## Scenario

Given note `Plan` containing `# Plan\nbody` is open
And the clock is frozen
When the owner deletes the heading text and leaves the line
Then the heading shows `# ` while empty and `Plan` after leaving
And the only file is `Plan.md` and it still holds `# Plan\nbody`

## Steps observed in the app

| #   | Action          | Observed result              |
| --- | --------------- | ---------------------------- |
| 1   | Delete the text | Heading `# `                 |
| 2   | ArrowDown       | Heading Plan; file unchanged |

## Related cases

NOTES-078.
