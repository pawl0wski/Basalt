# NOTES-078 — Keeps the file name and shows the invalid-name reason when the heading cannot be used as a file name

| Field          | Value                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-078                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                           |
| Requirement    | [AC-06.4](../../specs/implemented/2026-11-16-note-name-follows-first-heading.md)                                                                                                             |
| Implementation | [`basalt-app/e2e/note-title.spec.ts`](../../../basalt-app/e2e/note-title.spec.ts) — `"keeps the file name and shows the invalid-name reason when the heading cannot be used as a file name"` |
| Run            | `npx playwright test --grep @NOTES-078` (from `basalt-app/`)                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                             |

## Scenario

Given note `a` containing `# a\nx` is open
When the owner changes the heading to `a:b` and leaves it
Then a status says the note is `still named a` and the heading `cannot be used as a note name`
And the only file is `a.md`
And the status disappears when Dismiss is chosen

## Steps observed in the app

| #   | Action             | Observed result |
| --- | ------------------ | --------------- |
| 1   | Type :b, ArrowDown | Status message  |
| 2   | Choose Dismiss     | Status gone     |

## Related cases

NOTES-079.
