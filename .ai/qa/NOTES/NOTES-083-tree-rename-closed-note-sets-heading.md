# NOTES-083 — Sets the first heading and updates links without opening the note when a closed note is renamed in the tree

| Field          | Value                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-083                                                                                                                                                                                           |
| Status         | Active                                                                                                                                                                                              |
| Priority       | High                                                                                                                                                                                                |
| Type           | UI                                                                                                                                                                                                  |
| Requirement    | [AC-06.3](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                                                                                                    |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"sets the first heading and updates links without opening the note when a closed note is renamed in the tree"` |
| Run            | `npx playwright test --grep @NOTES-083` (from `basalt-app/`)                                                                                                                                        |
| Review         | AI draft — awaiting human review                                                                                                                                                                    |

## Scenario

Given `Old` (`# Old\nbody`) is closed and `ref` links to it
When the owner renames `Old` to `Fresh` in the tree
Then the files are `Fresh.md` and `ref.md`
And `Fresh.md` holds `# Fresh\nbody` and `ref.md` links `Fresh.md`
And no tab is opened

## Steps observed in the app

| #   | Action              | Observed result                     |
| --- | ------------------- | ----------------------------------- |
| 1   | Rename Old to Fresh | Heading and links rewritten; no tab |

## Related cases

NOTES-084.
