# NOTES-048 — Creates Untitled inside the folder at once, opens it and saves the typed text there when New note is chosen in a folder menu

| Field          | Value                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-048                                                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                                                   |
| Priority       | High                                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                                       |
| Requirement    | [AC-04.4](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                                                |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"creates Untitled inside the folder at once, opens it and saves the typed text there when New note is chosen in a folder menu"` |
| Run            | `npx playwright test --grep @NOTES-048` (from `basalt-app/`)                                                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                                                         |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
And the clock is frozen
When the owner chooses New note in the `projects` menu and types `hello`
Then no dialog appears and `projects/Untitled.md` exists
And the tab is selected, the row is at depth 2
And after the autosave delay the file holds `# hello` and no root `Untitled.md` exists

## Steps observed in the app

| #   | Action                           | Observed result            |
| --- | -------------------------------- | -------------------------- |
| 1   | Choose New note in projects menu | Untitled opens in projects |
| 2   | Type hello, advance 1 000 ms     | # hello saved              |

## Related cases

NOTES-049, NOTES-050, NOTES-051.
