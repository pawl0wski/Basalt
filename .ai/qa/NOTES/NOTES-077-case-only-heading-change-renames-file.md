# NOTES-077 — Renames the file when the first heading changes only by case

| Field          | Value                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-077                                                                                                                                            |
| Status         | Active                                                                                                                                               |
| Priority       | Medium                                                                                                                                               |
| Type           | UI                                                                                                                                                   |
| Requirement    | [AC-06.7](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                                                     |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"renames the file when the first heading changes only by case"` |
| Run            | `npx playwright test --grep @NOTES-077` (from `basalt-app/`)                                                                                         |
| Review         | AI draft — awaiting human review                                                                                                                     |

## Scenario

Given note `plan` containing `# plan\nx` is open
When the owner changes the heading to `Plan` and leaves it
Then the only file is `Plan.md`

## Steps observed in the app

| #   | Action                      | Observed result |
| --- | --------------------------- | --------------- |
| 1   | Replace p with P, ArrowDown | Plan.md         |

## Related cases

NOTES-076.
