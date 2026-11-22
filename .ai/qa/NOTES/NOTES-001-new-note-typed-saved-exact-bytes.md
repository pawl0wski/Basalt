# NOTES-001 — Saves a new note under its heading name with the exact typed bytes and shows the same text after a reload

| Field          | Value                                                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-001                                                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                                                          |
| Requirement    | [AC-01.10, AC-01.18](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) and [AC-06.1](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                     |
| Implementation | [`basalt-app/e2e/notes-roundtrip.spec.ts`](../../../basalt-app/e2e/notes-roundtrip.spec.ts) — `"saves a new note under its heading name with the exact typed bytes and shows the same text after a reload"` |
| Run            | `npx playwright test --grep @NOTES-001` (from `basalt-app/`)                                                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                                            |

## Scenario

Given a workspace with note `a` containing `x`
And the clock is frozen
When the owner creates a note, types a heading, a blank line and body text, the autosave delay passes, and the app is reloaded
Then a tab `Heading` appears and `Heading.md` holds exactly `# Heading\n\nbody text`
And `a.md` still holds `x`
And after the reload the note shows the same text and the bytes are unchanged

## Steps observed in the app

| #   | Action           | Observed result          |
| --- | ---------------- | ------------------------ |
| 1   | New note, type   | Untitled editor          |
| 2   | Advance 1 000 ms | Tab Heading; exact bytes |
| 3   | Reload           | Same text and bytes      |

## Related cases

EDITOR-002, EDITOR-003.
