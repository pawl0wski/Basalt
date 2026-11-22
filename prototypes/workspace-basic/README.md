# Basalt workspace-basic: clickable prototype

A clickable prototype of epic E01 "Local Markdown notes that work offline" (stories E01-S01, E01-S03, E01-S04), built from the approved screen map `../e01-screen-map.md`. It shows how the app will look and behave before production code exists. The owner or a client clicks and comments. A developer builds the real screens from it.

All data is fictional. Nothing here is a real service: there is no file system, folder picker, clipboard, trash or file watcher behind it. Everything is simulated in memory. Reloading the page or pressing "Reset (sw17)" restores the start.

## Run it

```bash
cd basalt-app && npm ci          # once; the prototype reuses these dependencies
cd ../prototypes/workspace-basic
npm run dev                      # http://localhost:5174
```

`npm run dev` links `node_modules` to `basalt-app/node_modules` (`scripts/link-deps.mjs`), so nothing else is installed and `basalt-app` is not changed. Other scripts: `npm test` (Vitest), `npm run typecheck`, `npm run build`.

The prototype is not imported by the application. Screens are built from `@basalt/ui` components and tokens (imported from the package source). Where the design system has no part, the simplest version from tokens is built and marked with a `data-gap="DSG-nn"` attribute in the markup.

## Review bar

The bar above the screen is the review tool, not part of the product.

- **Prototype** marks the page as a prototype. **Theme: dark only**: the design system has only the dark theme, so the toggle is inert and says why.
- **Screen map** s01 to s14. Screen ids are the ids of the map. Choosing a screen shows its canonical state. Using the app moves the highlight on its own.
- **Clickable / Comment**: in Comment mode a click pins a comment to the element instead of running it. Comments are saved in your browser under the prototype id `workspace-basic`. "Export for repository" gives a new `review/comments.js` to commit, "Export Markdown" gives a feedback file.
- **Show hotspots, Presentation (one screen at a time), Threads, Hide pins, Back.** Backspace also goes back.
- **Screen notes** opens the note under the screen: stories, what is simulated, what the prototype does not decide.
- **Scenario controls** (below) can be hidden with "Hide scenario controls". They are separate from the product navigation.

Dialogs are modal, as in the real app, so the review bar is inactive while a dialog is open. Close it with Cancel or Escape.

## Demo accounts

None. Epic E01 has one role, the owner (brief D02), no login, no account and no session (design system rule 9). There are no access gates and no "other role" screens; the closest thing is the operating system refusing access to a folder, which is simulated by sw05, sw06 and sw02. Nothing asks for a card, a password or an e-mail.

## Screens

| Id  | Screen                     | Stories          |
| --- | -------------------------- | ---------------- |
| s01 | Welcome                    | E01-S01          |
| s02 | Workspace, no note open    | E01-S01          |
| s03 | Note editor                | E01-S01          |
| s04 | New note (instant)         | E01-S01, E01-S04 |
| s05 | Save-failed dialog         | E01-S01          |
| s06 | Discard-edits confirmation | E01-S01          |
| s07 | Note with images           | E01-S03          |
| s08 | Add images                 | E01-S03          |
| s09 | Folder tree                | E01-S04          |
| s10 | Item actions menu          | E01-S04          |
| s11 | Rename dialog              | E01-S04          |
| s12 | New folder dialog          | E01-S04          |
| s13 | Delete note confirmation   | E01-S04          |
| s14 | Move note by dragging      | E01-S04          |

The happy path is s01, s02, s03, s04, s07, s08, then s09, s10, s12, s11, s14, s13. Demo workspaces: W1 "Basalt notes" (folders, about 14 notes, demo images), W2 empty, W3 read-only, W4 500 notes with long names, W5 missing. The demo clock is fixed at 2026-10-25 14:30:12.

## Scenario controls

| Id   | Control                          | Values                                                                                               |
| ---- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| sw01 | Launch                           | no last workspace, restores, missing, restore is slow                                                |
| sw02 | Folder picker result             | W1, W2, W3, W4, cancelled, cannot be opened                                                          |
| sw03 | Note list loading                | instant, slow, read error (slow also delays opening a note)                                          |
| sw04 | File watcher                     | live, cannot start; buttons to add or remove a note on disk and to return to the window              |
| sw05 | Workspace folder                 | present, deleted or renamed while open                                                               |
| sw06 | Folder permission                | writable, read-only                                                                                  |
| sw07 | Next save                        | succeeds, permission denied, fails once                                                              |
| sw08 | External change to the open note | edit, delete, move (the result depends on whether the note has unsaved text)                         |
| sw09 | Notes open as                    | normally, too large, not UTF-8, symlink, unknown error                                               |
| sw10 | Demo image file and its state    | ok, missing, unreadable, unsupported, too large, corrupt; images load slowly                         |
| sw11 | Clipboard at the next paste      | PNG, text only, text plus image, file path                                                           |
| sw12 | Files at the next drop           | 1 image, 2 images, 2 images and a PDF, over 20 MiB, HEIC, outside the editor; "Drag over the editor" |
| sw13 | Writing into attachments         | ok, write fails, attachments is a file, slow, same name appears                                      |
| sw14 | Delete result                    | moved to trash, trash unavailable, fails                                                             |
| sw15 | Move result                      | ok (links untouched), links rewritten, fails halfway                                                 |
| sw16 | Clock                            | fixed; "Advance one second"                                                                          |
| sw17 | Reset                            | restores all data and all switches                                                                   |
| sw18 | Open notes                       | one, several, more than fit                                                                          |

## Simulation limits

- **Nothing is real.** The folder picker, file system, trash, clipboard, drag and drop from the desktop, and file watcher are simulated by the review controls. Paste and drop are buttons; the "image" added is always the same drawing. Drag and drop of a note inside the tree uses the browser's own drag and drop.
- **The editor is a stand-in.** The real editor is the separate `@basalt/editor` package (DSG-01). Here the line with the cursor shows its Markdown source and other lines are rendered by a small parser: headings, emphasis, strong, inline code, links (not clickable), lists, task lists, quotes, fenced code, and images. Selection across lines, undo and shortcuts do not exist. The image link source stays visible on every line (GAP-30). The line with the cursor is an input styled like the text around it, so no box is visible.
- **Autosave is virtual**: 1 000 ms after the last keystroke, then 250 ms of "Saving…" (the 250 ms is invented). Text counts are computed from the text, so they do not equal the figures in the design-system stories.
- **No sync, no account.** There is no sync word in the status bar (owner decision D-7). The activity bar sections (Search, Bookmarks, Settings) and the outline panel are shown but do not work (D-6).
- **Dark theme only; desktop only.** The prototype is checked at 768 and 1440 px. At 320 px it does not break, but the product is not designed for it.
- **Not simulated**: moving several notes at once and a keyboard way to move a note (GAP-31), rename, move and delete of folders (GAP-07), the "switching note" trigger of the Save-failed dialog (tabs replace it), a right-click menu (the actions menu opens from a button), restoring open tabs other than at launch.
- **Texts and rules not in the specifications.** Several texts and rules are invented so that a state can be shown, and each maps to a gap in the screen map: name-rule messages, the discard confirmations (texts proposed in the S01 spec, AC-01.14), the lost-workspace banner (GAP-13), unreadable list and unopenable folder messages (GAP-10), symlink and unknown-error banners (GAP-12), the skipped-files notice and its dismissal (GAP-18), refusing to delete when there is no trash (GAP-23), a case-only rename of a note's own name being allowed (GAP-09), moving a note leaving its image links untouched by default (GAP-08), and in the watcher fallback mode the list refreshing on every action in the app. They are not product decisions.
- **Design-system gaps built from tokens** (marked `data-gap`): DSG-01 editor, DSG-02 tree, DSG-04 rename and new folder dialogs, DSG-06 dismissing a notice, DSG-07 corrupt image placeholder, DSG-08 banners, DSG-09 loading, DSG-10 in-progress notice, DSG-13 outline. The context menu (DSG-03) is a button menu.
- **Review chrome is not the product.** The engine's own stylesheet (`review/prototype.css`) contains three `color-mix(` calls and square pins; the bridge `review/mostek.css` points everything else at tokens and removes shadows.

## Files

- `src/model/`: the state (reducer), demo data, name rules, Markdown helpers, presets for each screen, screen notes, timers.
- `src/ui/`: the screens, built from `@basalt/ui`, the review bar and the scenario bar.
- `review/`: the review engine copied from `a local review engine` (`prototype.js` is not edited), `comments.js` for committed comments, the colour bridge and the review-bar styles.
- `POSTEP.md`: progress log, to resume in a new session.

## Changes after the owner review (2026-11-01)

The prototype follows the criteria added to the specs on 2026-11-01 (`.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md`, `.ai/specs/2026-11-01-manage-notes-and-folders.md`):

- The sidebar is always the folder tree. Its header shows the workspace folder name and has no Change workspace button (Ctrl/Cmd+O opens the picker). Rows have icons at every depth.
- New note (sidebar button, title bar button, Ctrl/Cmd+N, folder menu) creates `Untitled` at once and opens it. There is no dialog.
- Item actions open with a right-click, or Shift+F10 / the Menu key on the focused row. Rows have no "..." button.
- Sidebar and outline panel open and close with an animation (none with reduced motion). The outline panel has no second close button.
- Banners are as wide as the text and stay at the top while the note scrolls.
- The status bar shows only the save state. Delete has no Undo.
- The line with the cursor shows its Markdown source in place, with no visible input box.
- Several notes can be selected (Ctrl/Cmd+click, Shift+click, Shift+Arrow) and then deleted with one confirmation from the context menu, or moved together by dragging one of them. A name clash on any of them moves none (all-or-nothing, as simulated here).
- A new note opens with the cursor in the editor, so typing works at once. A middle mouse click on a tab closes it, with the same unsaved-text rules as the close button.
