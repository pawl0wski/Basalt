# NOTES-082 — Rewrites links to the renamed note in every note including the renamed note when the heading changes

| Field          | Value                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-082                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                           |
| Requirement    | [AC-06.8](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                                                                                             |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"rewrites links to the renamed note in every note including the renamed note when the heading changes"` |
| Run            | `npx playwright test --grep @NOTES-082` (from `basalt-app/`)                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                             |

## Scenario

Given `Old` links itself, `other` and `dir/deep` link to `Old`
And `Old` is open
When the owner changes the heading to `New` and leaves it
Then `other.md` links `New.md` and `dir/deep.md` links `../New.md`
And `New.md` holds `# New\n[self](New.md)`

## Steps observed in the app

| #   | Action              | Observed result              |
| --- | ------------------- | ---------------------------- |
| 1   | Type New, ArrowDown | Links rewritten in all notes |

## Related cases

NOTES-083.
