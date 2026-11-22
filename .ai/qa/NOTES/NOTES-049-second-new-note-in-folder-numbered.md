# NOTES-049 — Creates Untitled 1 when New note is chosen a second time in the same folder

| Field          | Value                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-049                                                                                                                                                               |
| Status         | Active                                                                                                                                                                  |
| Priority       | Medium                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                      |
| Requirement    | [AC-04.4](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                               |
| Implementation | [`basalt-app/e2e/manage-notes.spec.ts`](../../../basalt-app/e2e/manage-notes.spec.ts) — `"creates Untitled 1 when New note is chosen a second time in the same folder"` |
| Run            | `npx playwright test --grep @NOTES-049` (from `basalt-app/`)                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                        |

## Scenario

Given a workspace with note `Ideas`, folder `projects` holding `Roadmap` and folder `2026` with `Plan`
And `projects/Untitled` exists
When the owner chooses New note in the `projects` menu again
Then `projects/Untitled 1` is created

## Steps observed in the app

| #   | Action                | Observed result |
| --- | --------------------- | --------------- |
| 1   | Choose New note again | Untitled 1      |

## Related cases

NOTES-048.
