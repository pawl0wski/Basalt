# TOASTS-012 — Moves the note, keeps its bytes and shows a links-not-updated toast when its links cannot be rewritten

| Field          | Value                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TOASTS-012                                                                                                                                                                             |
| Status         | Active                                                                                                                                                                                 |
| Priority       | High                                                                                                                                                                                   |
| Type           | UI                                                                                                                                                                                     |
| Requirement    | [AC-08.7](../../specs/2026-11-17-informational-toasts.md)                                                                                                                              |
| Implementation | [`basalt-app/e2e/toasts.spec.ts`](../../../basalt-app/e2e/toasts.spec.ts) — `"moves the note, keeps its bytes and shows a links-not-updated toast when its links cannot be rewritten"` |
| Run            | `npx playwright test --grep @TOASTS-012` (from `basalt-app/`)                                                                                                                          |
| Review         | AI draft — awaiting human review                                                                                                                                                       |

## Scenario

Given note `Broken` has invalid UTF-8 bytes and folder `projects` holds `Roadmap`
When the owner drops `Broken` onto `projects`
Then one toast says `Moved 1 of 1 notes.` and that its links could not be updated
And the sidebar shows no status message
And the files are `projects/Broken.md` and `projects/Roadmap.md` and `Broken` keeps its original bytes

## Steps observed in the app

| #   | Action                    | Observed result                         |
| --- | ------------------------- | --------------------------------------- |
| 1   | Drag Broken onto projects | One toast; files moved; bytes unchanged |

## Related cases

TOASTS-001.
