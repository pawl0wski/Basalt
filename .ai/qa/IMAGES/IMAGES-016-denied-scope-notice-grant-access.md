# IMAGES-016 — Shows the no-access notice and banner and adds no file when the scope is denied, then adds the image and keeps the open note after access is granted

| Field          | Value                                                                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | IMAGES-016                                                                                                                                                                                                                                   |
| Status         | Active                                                                                                                                                                                                                                       |
| Priority       | High                                                                                                                                                                                                                                         |
| Type           | UI                                                                                                                                                                                                                                           |
| Requirement    | [Scope-denied workspace — AC-04.7](../../specs/implemented/2026-11-01-manage-notes-and-folders.md)                                                                                                                                           |
| Implementation | [`basalt-app/e2e/add-images.spec.ts`](../../../basalt-app/e2e/add-images.spec.ts) — `"shows the no-access notice and banner and adds no file when the scope is denied, then adds the image and keeps the open note after access is granted"` |
| Run            | `npx playwright test --grep @IMAGES-016` (from `basalt-app/`)                                                                                                                                                                                |
| Review         | AI draft — awaiting human review                                                                                                                                                                                                             |

## Scenario

Given note `a` with `typed text` is open
And the clock is frozen
And access to `attachments` is denied
When the owner drops `d.png`, then chooses Grant access, then drops it again
Then a notice says Basalt has no access and a banner asks for access to the whole folder, and `attachments/d.png` is not created
And after Grant access the banner is gone and the note keeps `typed text`
And the second drop adds a preview, writes the bytes and the saved note holds `typed text` plus the link

## Steps observed in the app

| #   | Action                       | Observed result            |
| --- | ---------------------------- | -------------------------- |
| 1   | Deny scope, drop             | Notice and banner; no file |
| 2   | Grant access                 | Banner gone; text kept     |
| 3   | Drop again, advance 1 000 ms | Preview; file; note saved  |

## Related cases

IMAGES-014.
