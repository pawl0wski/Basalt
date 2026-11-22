# Progress: workspace-basic clickable prototype

Resume here in a new session. Source of truth: `../e01-screen-map.md` (approved by the owner on 2026-10-31), the grey prototype in `../../.ai/prototypes/discovery/workspace-basic/revision-001/`, the design system in `../../basalt-app/packages/ui`, the review engine copied from the local review engine/` into `review/`.

## Decisions taken with the owner

- Directory: `prototypes/workspace-basic/`. Not imported by the app. Nothing outside it was changed, except the status lines of the screen map (approval and decisions D-6 to D-8), with the owner's permission.
- One role (the owner). No login, accounts, payments or access gates: the map has none (section 2).
- Dark theme only (the design system has no light theme). The theme toggle is a labelled, inert button.
- GAP-24 (D-6): the activity bar and the outline panel are shown, inert, with a note. GAP-22 (D-7): no sync word in the status bar.
- Push to the current test branch only at the end of stage 3, and only `prototypes/workspace-basic/`.

## How it runs

Once: `cd basalt-app && npm ci`. Then `cd prototypes/workspace-basic && npm run dev`. The script links `node_modules` to `basalt-app/node_modules` (`scripts/link-deps.mjs`) and starts Vite on port 5174. Other scripts: `npm test`, `npm run typecheck`.

## Stages

- [x] Stage 0. Plan, with the owner's answers on GAP-22 and GAP-24.
- [x] Stage 1. Skeleton and happy path (below).
- [x] Stage 2. States and scenarios (below). Roles and access gates do not apply (see above). Waiting for the owner's "dalej".
- [x] Stage 3. Notes per screen, README, navigation tests, browser checks, report, push (below).

## Stage 1: done

- Vite + React 19 + Tailwind 4. `@basalt/ui` through an alias to the package source. The review engine is wired (comments, screen map, presentation mode, Back). `prototypeId` is `workspace-basic`. The colour bridge is `review/mostek.css`. The review-bar look is `review/chrome.css` (tokens only).
- Review bar: Prototype badge, theme toggle (dark only), screen map s01 to s14, scenario controls (picker result sw02, next save sw07, permission sw06, simulate paste sw11, simulate drop sw12, reset sw17).
- One app instance in a stable host that is moved into the frame of the current screen. The screen id is derived from the state (`deriveScreen`) and announced to the engine (`prototype:navigate`). Choosing a screen in the map applies a preset (`src/model/presets.ts`).
- All 14 screens are reachable. The happy path was clicked through in Chromium: open workspace, open notes as tabs, type and autosave, new note (instant Untitled), images and placeholders, paste, tree, actions menu, rename, new folder, drag to move, delete.
- Checks: `npm test` 41 tests, `npm run typecheck` clean, token check 0 violations in `src`, `review/chrome.css`, `review/mostek.css`. The engine's own `review/prototype.css` has 3 `color-mix(` calls (review chrome, not product screens).

## Stage 2: done

- Scenario controls sw01 to sw18 are all in the review bar (collapsible). Every state of the map is reachable by a click or a control, except the ones listed under "Not simulated".
- New in the model: launch restore (slow, missing), list loading and read error, watcher fallback with "Return to window", notes added or removed on disk, external edit, delete and move of the open note (clean and dirty), workspace folder lost (Save-failed dialog first, then a banner), notes that open as too large, not UTF-8, symlink or unknown, creating state in the name dialogs, delete result (no trash, fails), move result (links untouched, rewritten, fails halfway), paste and drop variants with a dismissible notice and an "adding" state, image file states that change live, clock +1 s, one, several or many open notes, window controls (close flushes unsaved text).
- Bug fixed on the way: one timer reset all others (the slow-write notice lingered). Timers are now keyed (`desiredTimers` in `src/model/store.tsx`) with a regression test.
- Checks: 90 unit tests, typecheck clean, token check clean. Chromium walks (scripts outside the repo): 100+ asserted steps over sw01 to sw18, all passing.

## Not simulated (noted on screen in stage 3)

Keyboard-only move and moving several notes at once (GAP-31), deleting or renaming a folder (GAP-07), "switching note" as a trigger of the Save-failed dialog (tabs replace it), light theme.

## Assumed texts and rules (owner to confirm; each maps to a spec gap)

Name-rule messages, discard-edits dialog texts (GAP-15), workspace-lost banner text (GAP-13), unreadable list and unopenable folder texts (GAP-10), symlink and unknown note banners (GAP-12), skipped-file notice texts and its dismissal rules (GAP-18), "no trash: refuse to delete" (GAP-23), case-only rename of the note's own name allowed and an unchanged name closing the dialog (GAP-09), move without link rewriting by default (GAP-08), the folder list refreshes on every app action in focus-fallback mode.

## Gaps marked in code (`data-gap`)

DSG-01 editor stand-in, DSG-02 tree, DSG-04 rename and new folder dialogs (the context menu DSG-03 is a button menu), DSG-07 `broken` image placeholder, DSG-08 symlink and unknown banners, DSG-13 outline.

## Stage 3: done

- Screen notes under each screen ("Screen notes" button in the review bar), `README.md` with "Simulation limits", navigation tests for all 14 screens (110 unit tests in total), browser checks (every button on every screen, keyboard, comment mode, 320, 768 and 1440 px), run log and lesson in `.ai/`.
- Bugs found and fixed in this stage: deep link `#sNN` ended on s01, the engine's heading focus closed open menus, the tree key handler stole menu keystrokes (React portal bubbling), editor activation on `mousedown` broke comment mode, the image disappeared from the active line, a focus loss after closing a dialog, the review bar overflowed at 320 px.
- Pushed to branch `prototype-workspace-basic-test`: only `prototypes/workspace-basic/` and the two new `.ai` files of this run. `.ai/lessons.md` (index line added), `prototypes/e01-screen-map.md` and a local course file (not in this repo) are left uncommitted for the owner.
