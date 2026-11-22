# NOTES-084 — Changes the first heading of the open note when it is renamed in the tree

| Field          | Value                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-084                                                                                                                                                         |
| Status         | Active                                                                                                                                                            |
| Priority       | High                                                                                                                                                              |
| Type           | UI                                                                                                                                                                |
| Requirement    | [AC-06.3](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                                                                  |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"changes the first heading of the open note when it is renamed in the tree"` |
| Run            | `npx playwright test --grep @NOTES-084` (from `basalt-app/`)                                                                                                      |
| Review         | AI draft — awaiting human review                                                                                                                                  |

## Scenario

Given `Old` (`# Old\nbody`) is open
When the owner renames `Old` to `Fresh` in the tree
Then the tab is `Fresh` and its first line shows `# Fresh`
And `Fresh.md` holds `# Fresh\nbody` after the autosave delay

## Steps observed in the app

| #   | Action           | Observed result            |
| --- | ---------------- | -------------------------- |
| 1   | Rename to Fresh  | Tab Fresh; heading # Fresh |
| 2   | Advance 1 000 ms | Fresh.md saved             |

## Related cases

NOTES-083. The first line is found by its `cm-line` class (no role).
