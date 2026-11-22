# NOTES-018 — Adds and removes notes from the selection without opening them when Ctrl+click is used on a multiselectable tree

| Field          | Value                                                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-018                                                                                                                                                                                                |
| Status         | Active                                                                                                                                                                                                   |
| Priority       | High                                                                                                                                                                                                     |
| Type           | UI                                                                                                                                                                                                       |
| Requirement    | [AC-04.10](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                               |
| Implementation | [`basalt-app/e2e/move-notes.spec.ts`](../../../basalt-app/e2e/move-notes.spec.ts) — `"adds and removes notes from the selection without opening them when Ctrl+click is used on a multiselectable tree"` |
| Run            | `npx playwright test --grep @NOTES-018` (from `basalt-app/`)                                                                                                                                             |
| Review         | AI draft — awaiting human review                                                                                                                                                                         |

## Scenario

Given a workspace with notes `Ideas`, `Todo`, `Notes` and a folder `projects` holding `Roadmap` and a folder `2026`
When the owner Ctrl+clicks `Todo`, `Ideas`, then `Todo` again
Then the tree is multiselectable
And `Ideas`, `Todo` are selected without opening tabs and after the second click on `Todo` only `Ideas` remains

## Steps observed in the app

| #   | Action                 | Observed result        |
| --- | ---------------------- | ---------------------- |
| 1   | Ctrl+click Todo, Ideas | Both selected; no tabs |
| 2   | Ctrl+click Todo        | Only Ideas             |

## Related cases

NOTES-024 (plain click).
