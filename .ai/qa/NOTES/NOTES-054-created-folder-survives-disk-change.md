# NOTES-054 — Keeps a created folder in the tree when the workspace changes on disk afterwards

| Field          | Value                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-054                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                       |
| Priority       | Medium                                                                                                                                                                       |
| Type           | UI                                                                                                                                                                           |
| Requirement    | [AC-04.3](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                    |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"keeps a created folder in the tree when the workspace changes on disk afterwards"` |
| Run            | `npx playwright test --grep @NOTES-054` (from `basalt-app/`)                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                             |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the owner creates the folder `Later` from the root menu, `projects/new.md` is created outside the app and the owner expands `projects`
Then the tree shows both `new` and `Later`

## Steps observed in the app

| #   | Action                                             | Observed result      |
| --- | -------------------------------------------------- | -------------------- |
| 1   | Create Later                                       | Later listed         |
| 2   | Create projects/new.md externally, expand projects | new and Later listed |

## Related cases

NOTES-052.
