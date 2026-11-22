# NOTES-079 — Keeps the file name and shows the already-exists message when the heading collides with another note

| Field          | Value                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-079                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                           |
| Requirement    | [AC-06.4](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                                                                                             |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"keeps the file name and shows the already-exists message when the heading collides with another note"` |
| Run            | `npx playwright test --grep @NOTES-079` (from `basalt-app/`)                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                             |

## Scenario

Given notes `a` and `Taken` exist and `a` is open
When the owner changes the heading to `taken` and leaves it
Then a status says the name already exists
And the files are `Taken.md` and `a.md`

## Steps observed in the app

| #   | Action                | Observed result  |
| --- | --------------------- | ---------------- |
| 1   | Type taken, ArrowDown | Collision status |

## Related cases

NOTES-078.
