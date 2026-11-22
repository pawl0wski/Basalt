# NOTES-002 — Keeps the BOM and the CRLF line endings byte for byte when a note is edited and saved

| Field          | Value                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-002                                                                                                                                                                               |
| Status         | Active                                                                                                                                                                                  |
| Priority       | High                                                                                                                                                                                    |
| Type           | UI                                                                                                                                                                                      |
| Requirement    | [Data model — Line endings and BOM](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                                       |
| Implementation | [`basalt-app/e2e/notes-roundtrip.spec.ts`](../../../basalt-app/e2e/notes-roundtrip.spec.ts) — `"keeps the BOM and the CRLF line endings byte for byte when a note is edited and saved"` |
| Run            | `npx playwright test --grep @NOTES-002` (from `basalt-app/`)                                                                                                                            |
| Review         | AI draft — awaiting human review                                                                                                                                                        |

## Scenario

Given a note whose bytes are a UTF-8 BOM and `one\r\ntwo\r\n`
And the clock is frozen
When the owner types `three` at the end and the autosave delay passes, then reloads
Then the file bytes are the BOM and `one\r\ntwo\r\nthree` both after the save and after the reload

## Steps observed in the app

| #   | Action           | Observed result         |
| --- | ---------------- | ----------------------- |
| 1   | Type three       | Tab unsaved             |
| 2   | Advance 1 000 ms | Bytes with BOM and CRLF |
| 3   | Reload           | Same bytes              |

## Related cases

NOTES-003 (untouched note). Mixed line endings are Vitest only.
