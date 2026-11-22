# NOTES-074 — Saves the note under its edited heading name and closes the tab when the tab is closed right after the heading was edited

| Field          | Value                                                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-074                                                                                                                                                                                                         |
| Status         | Active                                                                                                                                                                                                            |
| Priority       | High                                                                                                                                                                                                              |
| Type           | UI                                                                                                                                                                                                                |
| Requirement    | [AC-06.2](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md) and [AC-01.16](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                     |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"saves the note under its edited heading name and closes the tab when the tab is closed right after the heading was edited"` |
| Run            | `npx playwright test --grep @NOTES-074` (from `basalt-app/`)                                                                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                                                                  |

## Scenario

Given note `Old` containing `# Old\nbody` is open
And the clock is frozen
When the owner appends ` title` to the heading and closes the tab at once
Then `Old title.md` holds `# Old title\nbody`
And no tab remains

## Steps observed in the app

| #   | Action           | Observed result             |
| --- | ---------------- | --------------------------- |
| 1   | Edit the heading | Unsaved                     |
| 2   | Close the tab    | Renamed file saved; no tabs |

## Related cases

NOTES-076.
