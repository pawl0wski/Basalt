# NOTES-080 — Keeps the file name when a note without a first heading is edited

| Field          | Value                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-080                                                                                                                                                 |
| Status         | Active                                                                                                                                                    |
| Priority       | Medium                                                                                                                                                    |
| Type           | UI                                                                                                                                                        |
| Requirement    | [AC-06.5](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                                                          |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"keeps the file name when a note without a first heading is edited"` |
| Run            | `npx playwright test --grep @NOTES-080` (from `basalt-app/`)                                                                                              |
| Review         | AI draft — awaiting human review                                                                                                                          |

## Scenario

Given note `a` containing `plain` is open
And the clock is frozen
When the owner appends ` more` and the autosave delay passes
Then `a.md` holds `plain more` and is the only file

## Steps observed in the app

| #   | Action                      | Observed result         |
| --- | --------------------------- | ----------------------- |
| 1   | Type more, advance 1 000 ms | a.md updated; no rename |

## Related cases

NOTES-081.
