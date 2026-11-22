# NOTES-057 — Disables Create folder, shows the trailing-dot message inline and creates nothing when the folder name ends with a dot

| Field          | Value                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID             | NOTES-057                                                                                                                                                                                                          |
| Status         | Active                                                                                                                                                                                                             |
| Priority       | Medium                                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                                                 |
| Requirement    | [AC-04.3](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                                          |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"disables Create folder, shows the trailing-dot message inline and creates nothing when the folder name ends with a dot"` |
| Run            | `npx playwright test --grep @NOTES-057` (from `basalt-app/`)                                                                                                                                                       |
| Review         | AI draft — awaiting human review                                                                                                                                                                                   |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
When the owner types `Ideas.` as the folder name
Then the dialog shows `A name cannot end with a dot or a space.`
And Create folder is disabled, Enter keeps the dialog open and no directory is added

## Steps observed in the app

| #   | Action      | Observed result          |
| --- | ----------- | ------------------------ |
| 1   | Type Ideas. | Message; button disabled |
| 2   | Press Enter | Dialog stays             |

## Related cases

NOTES-056.
