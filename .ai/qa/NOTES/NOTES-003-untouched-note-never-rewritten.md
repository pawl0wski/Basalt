# NOTES-003 — Leaves the file bytes unchanged when an untouched BOM and CRLF note is opened and saved with Ctrl+S

| Field          | Value                                                                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | NOTES-003                                                                                                                                                                                             |
| Status         | Active                                                                                                                                                                                                |
| Priority       | High                                                                                                                                                                                                  |
| Type           | UI                                                                                                                                                                                                    |
| Requirement    | [Data model — unedited notes are never written (autosave rule 1)](../../specs/2026-10-24-markdown-notes-and-app-foundations.md)                                                                       |
| Implementation | [`basalt-app/e2e/notes-roundtrip.spec.ts`](../../../basalt-app/e2e/notes-roundtrip.spec.ts) — `"leaves the file bytes unchanged when an untouched BOM and CRLF note is opened and saved with Ctrl+S"` |
| Run            | `npx playwright test --grep @NOTES-003` (from `basalt-app/`)                                                                                                                                          |
| Review         | AI draft — awaiting human review                                                                                                                                                                      |

## Scenario

Given a note with a BOM and CRLF line endings
And the clock is frozen
When the owner opens it, presses Ctrl+S and 2 000 ms pass
Then the file bytes are identical to the original

## Steps observed in the app

| #   | Action                   | Observed result       |
| --- | ------------------------ | --------------------- |
| 1   | Open a                   | Editor shows the text |
| 2   | Ctrl+S, advance 2 000 ms | Bytes unchanged       |

## Related cases

NOTES-002. Idempotence: a re-save of unchanged text changes nothing.
