# WORKSPACE-031 — Lists nested Markdown files folders-first and hides other file types, hidden files and backup files when a workspace is opened

| Field          | Value                                                                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-031                                                                                                                                                                                                                    |
| Status         | Active                                                                                                                                                                                                                           |
| Priority       | High                                                                                                                                                                                                                             |
| Type           | UI                                                                                                                                                                                                                               |
| Requirement    | [AC-01.8](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) and [Data model — listing](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                 |
| Implementation | [`basalt-app/e2e/notes-roundtrip.spec.ts`](../../../basalt-app/e2e/notes-roundtrip.spec.ts) — `"lists nested Markdown files folders-first and hides other file types, hidden files and backup files when a workspace is opened"` |
| Run            | `npx playwright test --grep @WORKSPACE-031` (from `basalt-app/`)                                                                                                                                                                 |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                 |

## Scenario

Given a workspace with nested notes and a `.txt`, a `.png`, a `.md.bak` and a hidden `.md` file
When the workspace is opened and the folders `docs` and `deep` are expanded
Then the list shows `docs`, `a`, `b` and after expanding `docs`, `deep`, `c`, `a`, `b`
And no other file type appears

## Steps observed in the app

| #   | Action               | Observed result     |
| --- | -------------------- | ------------------- |
| 1   | Open the workspace   | docs, a, b          |
| 2   | Expand docs and deep | docs, deep, c, a, b |

## Related cases

WORKSPACE-017.
