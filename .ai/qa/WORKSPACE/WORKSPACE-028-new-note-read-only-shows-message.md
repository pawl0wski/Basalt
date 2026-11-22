# WORKSPACE-028 — Shows the read-only message and adds no note when New note or Ctrl+N is used in a read-only workspace

| Field          | Value                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | WORKSPACE-028                                                                                                                                                                               |
| Status         | Active                                                                                                                                                                                      |
| Priority       | High                                                                                                                                                                                        |
| Type           | UI                                                                                                                                                                                          |
| Requirement    | [AC-01.10](../../specs/2026-10-24-markdown-notes-and-app-foundations.md) (read-only workspace)                                                                                              |
| Implementation | [`basalt-app/e2e/workspace.spec.ts`](../../../basalt-app/e2e/workspace.spec.ts) — `"shows the read-only message and adds no note when New note or Ctrl+N is used in a read-only workspace"` |
| Run            | `npx playwright test --grep @WORKSPACE-028` (from `basalt-app/`)                                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                                            |

## Scenario

Given a read-only workspace with note `a` is open
When the owner uses New note and then Ctrl+N
Then the message `The workspace folder is read-only. Nothing was changed.` is shown
And the list and the files stay `a` and `a.md`

## Steps observed in the app

| #   | Action         | Observed result          |
| --- | -------------- | ------------------------ |
| 1   | Click New note | Message; list a          |
| 2   | Press Ctrl+N   | List still a; files a.md |

## Related cases

WORKSPACE-026. Idempotence: the repeat changes nothing.
