# TABS-010 — Restores each workspace's own tabs and active note and drops notes that no longer exist when workspaces are switched and the app is reloaded

| Field          | Value                                                                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | TABS-010                                                                                                                                                                                                                                       |
| Status         | Active                                                                                                                                                                                                                                         |
| Priority       | High                                                                                                                                                                                                                                           |
| Type           | UI                                                                                                                                                                                                                                             |
| Requirement    | [AC-01.17](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                                                                                                       |
| Implementation | [`basalt-app/e2e/notes-roundtrip.spec.ts`](../../../basalt-app/e2e/notes-roundtrip.spec.ts) — `"restores each workspace's own tabs and active note and drops notes that no longer exist when workspaces are switched and the app is reloaded"` |
| Run            | `npx playwright test --grep @TABS-010` (from `basalt-app/`)                                                                                                                                                                                    |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                               |

## Scenario

Given workspace `One` has tabs `a`, `gone`, `b` with `b` active
And workspace `Two` has tab `y`
When the owner switches between the workspaces with Ctrl+O, `gone.md` is deleted outside the app and the app is reloaded
Then each workspace shows its own tabs
And after the reload `One` shows tabs `a` and `b` with `b` selected and showing `B`
And switching to `Two` shows only `y`

## Steps observed in the app

| #   | Action                 | Observed result  |
| --- | ---------------------- | ---------------- |
| 1   | Open One, a, gone, b   | Three tabs       |
| 2   | Switch to Two, open y  | Only y           |
| 3   | Switch back to One     | a, gone, b       |
| 4   | Delete gone.md, reload | a, b; b selected |
| 5   | Switch to Two          | y                |

## Related cases

TABS-008, TABS-009 (single workspace).
