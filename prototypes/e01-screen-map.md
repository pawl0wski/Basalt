# E01 screen map for the clickable prototype

- Flow: epic E01 "Local Markdown notes that work offline" (issue #5): E01-S01 (#8), E01-S03 (#10), E01-S04 (#16).
- Status: **draft v2, approved by the owner on 2026-10-31**. The clickable prototype is built from it in `prototypes/workspace-basic/`.
- Scope of this step: **screen map only**. No prototype is built now (owner decision D-1, 2026-10-31). Sections 4 and 5 (scenarios, demo data) are kept for the prototype that will be built later from this map.
- Date: 2026-10-31
- Platform: desktop only (S01 Q6), dark theme only (design system, "What is missing"), English only (S01 G10). Screens are checked at 768 and 1440 px.

## 0. Sources and how they were used

| Source | Path or issue | Used for |
|---|---|---|
| Product brief | `.ai/specs/product-brief.md` | Scope (D05), non-goals (N01–N03), owner as the only user (D02). The brief has **no Key flows and no Business rules** ("Deferred"), so the flow order below comes from the specs, not the brief. |
| Backlog | `.ai/specs/backlog.md`, issues #5, #8, #10, #16 | Story and acceptance criteria numbers. The backlog file is only an index; the criteria are in the issues. |
| S01 spec | `.ai/specs/2026-10-24-markdown-notes-and-app-foundations.md` | Screens and states of E01-S01. |
| S03 spec | `.ai/specs/2026-10-25-images-in-notes.md` | Screens and states of E01-S03. |
| S04 | issue #16 only | **No spec exists** ("a dedicated S04 spec is still owed"). Screens for S04 rest on the seven criteria, two open questions and the owner's folder-tree direction of 2026-10-30. |
| Design system | `basalt-app/packages/ui/docs/` (guide, `design-system.md`, product, primitives, screens, proposals), `src/product/`, `src/components/` | Component names, state coverage, "What is missing". |
| Personas from lesson 4 | none | Not available. The brief names one user, the owner. |

Source codes used in the tables:

| Code | Meaning |
|---|---|
| `AC-01.n`, `AC-03.n`, `AC-04.n` | Acceptance criterion n of E01-S01, E01-S03, E01-S04 (section 1). |
| `S01 UX`, `S03 UX` | The "UI/UX" section of the S01 or S03 spec. |
| `S01 edge: <row>`, `S03 edge: <row>` | A row of the spec's "Edge Cases & Failure Scenarios" table. |
| `S01 Gn/Qn`, `S03 Gn/Qn/Rn` | A decision recorded in the spec (grilling, open questions, review). |
| `DS` | Exists only as a design-system story or doc, with no spec behind it. It is a proposal, not a requirement. |
| `none → GAP-nn` | The flow needs this state, no criterion or spec describes it, see section 4. |

### Owner decisions of 2026-10-31

| Id | Topic | Decision | Effect on this map |
|---|---|---|---|
| D-1 | Scope of this step | Only the screen map. No prototype for now. | GAP-28 resolved for now; sections 4 and 5 wait for the prototype. |
| D-2 | Moving a note | By dragging. | GAP-27 resolved; s14 is a drag on the tree, `Move dialog` dropped from DSG-04, DSG-12 is now required; new GAP-31. |
| D-3 | Deleting a note | Moves it to the OS trash. | GAP-23 partly resolved (the question of Undo and a missing trash remains). |
| D-4 | Open notes | Several notes can be open at once. | GAP-21 partly resolved (tabs confirmed, their rules are open). |
| D-5 | Editor | Markdown in live preview, as in Obsidian. | GAP-29 resolved; new GAP-30 (live preview has no story or spec). |
| D-6 | Activity bar and outline panel (GAP-24) | Shown in the prototype, inert, with a note that they do not work in the prototype. | GAP-24 resolved for the prototype only; the product question stays open. |
| D-7 | Sync word in the status bar (GAP-22) | Not shown: there is no sync in E01. | GAP-22 resolved for the prototype; design system rule 9 still says otherwise. |
| D-8 | Map approval | The owner approved this draft on 2026-10-31. | Status line above. |

## 1. Stories and acceptance criteria in this flow

Epic E01 is done only when S01, S03 and S04 are done (owner decision 2026-10-25, S01 G5). Out of the flow: E02 sync and E2EE (no screens exist, "no server or account is involved in E01"), E03 whiteboards, and the brief's "Should have" items (PDF annotation, file icons, command palette, meeting recording, sharing).

### E01-S01 (#8) The owner can create and edit notes stored as plain Markdown files

| Id | Criterion |
|---|---|
| AC-01.1 | Given no workspace, when the owner chooses a directory, then the app opens it and lists the Markdown files in it. |
| AC-01.2 | Given an open workspace, when the owner creates a note, edits it and saves, then a `.md` file with that content exists in the workspace and another Markdown editor can open it. |
| AC-01.3 | (proposed, negative) Given the directory is not writable, when the owner saves, then the app shows an error and keeps the unsaved text in the editor. |

### E01-S03 (#10) The owner can add images to notes

| Id | Criterion |
|---|---|
| AC-03.1 | Given an open note, when the owner adds an image file, then the note references it and the image is displayed. |
| AC-03.2 | Given a note with an image, when the workspace is opened in another Markdown editor, then the reference is a normal Markdown image link and the image file is in the workspace. |
| AC-03.3 | (proposed, negative) Given the referenced image file is missing or unreadable, when the note is displayed, then a placeholder is shown and the note text is unchanged. |

### E01-S04 (#16) The owner can manage notes and folders in the workspace

| Id | Criterion |
|---|---|
| AC-04.1 | Given an open note, when the owner renames it, then the file is renamed on disk and the note stays open; a name colliding with an existing note (including case-only or Unicode-form-only) is rejected inline. |
| AC-04.2 | Given a note, when the owner deletes it and confirms, then the file is removed and the note closes. |
| AC-04.3 | Given an open workspace, when the owner creates a folder, then the directory exists in the workspace. |
| AC-04.4 | Given a folder, when the owner creates a note in it, then a `.md` file exists inside that folder. |
| AC-04.5 | Given a note, when the owner moves it to another folder, then the file is moved and an open session follows the new path. |
| AC-04.6 | Given a workspace with folders, then the sidebar shows them as an expandable tree. |
| AC-04.7 | (negative) Given a read-only workspace, when the owner renames, deletes, moves or creates, then the app shows an error and nothing changes on disk. |

## 2. Roles

E01 has **one role: the owner**. The brief names the owner as customer, user and stakeholder (D02). The epic says "no server or account is involved in E01", and the design system rule 9 says "the app opens on notes (no login first)". Therefore:

| Question | Answer from the sources |
|---|---|
| Who sees each screen | The owner, on every screen (column "Role" shows `owner`). |
| What does a logged-out visitor see | Not applicable: there is no login, no account and no session in E01. |
| What does someone with another role see | Not applicable: no other role exists in the materials. |
| What is the closest thing to "no access" | The operating system denying access to a folder (cannot open it, or it is read-only). It appears as states in s01, s03, s04, s08, s11–s14. |

No roles were invented. If the owner wants any other role in the prototype, that is a new decision, not a gap in these materials.

## 3. Screen map

Each state is written as `• state *(source)*`. Screens never change their id.

| ID | Screen | Role | States | Story or criterion | Design-system components |
|---|---|---|---|---|---|
| s01 | **Welcome** (no workspace open) | owner | • default, one action "Open folder as workspace" *(AC-01.1, S01 UX)*<br>• workspace lost, explanatory notice *(S01 edge: workspace folder deleted or renamed while open, no unsaved changes; last workspace no longer exists)*<br>• picker cancelled, nothing changes *(S01 edge: user cancels the picker)*<br>• picked folder cannot be opened (no access, unavailable) *(none → GAP-10)*<br>• restoring the last workspace and note at launch *(none → GAP-11)* | AC-01.1 | `WelcomeScreen`, `Button`, `Alert` (notice). Gaps: DSG-09 |
| s02 | **Workspace window, note list** (left sidebar, no note open) | owner | • list ready, no note open *(AC-01.1, S01 UX)*<br>• empty workspace "Create your first note" *(S01 UX)*<br>• list loading *(DS; spec silent → GAP-11)*<br>• list cannot be read *(DS; spec silent → GAP-10)*<br>• many notes (hundreds) and long names *(S01 G9, DS)*<br>• watcher cannot start, notice "list refreshes when you return to this window" *(S01 G4, S01 edge: watcher cannot start)*<br>• notes added or removed outside Basalt, list updates live *(S01 G4, S01 edge: note added/removed externally)*<br>• workspace root lost while open, return to s01 *(S01 edge)*<br>• read-only workspace, list still readable *(AC-01.3)*<br>• activity bar with Search, Bookmarks, Settings next to Notes *(DS; no material lists them → GAP-24)* | AC-01.1, AC-01.3 | `AppShell`, `TitleBar`, `ActivityBar`, `NoteSidebar`, `NoteList`, `EmptyState`, `ErrorState`, `Skeleton`, `Alert`, `StatusBar`, `Button`, `IconButton`. Gaps: DSG-09 |
| s03 | **Note editor** (workspace window with a note open) | owner | • saved *(S01 UX)*<br>• saving *(S01 UX)*<br>• not saved (change pending) *(S01 UX; mapping → GAP-14)*<br>• external change while clean: silent reload, no visual change *(S01 edge)*<br>• conflict with the file on disk (dirty note), autosave paused *(S01 edge)*<br>• note deleted or moved on disk *(S01 edge)*<br>• folder not writable, error banner, text kept, autosave paused *(AC-01.3, S01 edge)*<br>• note too large (over 5 MiB) *(S01 edge)*<br>• note is not UTF-8 *(S01 edge)*<br>• note is a symlink or fails with an unknown error *(S01 edge: symlinks; banner kind → GAP-12)*<br>• workspace folder lost while the note has unsaved text *(S01 edge; banner kind → GAP-13)*<br>• note opening *(none → GAP-11)*<br>• last note reopened at launch *(S01 UX)*<br>• several open notes as tabs, unsaved dot on a tab, "Open notes" menu when tabs do not fit *(D-4, DS; S01 has one session → GAP-21)*<br>• closing a tab that has unsaved text *(D-4; none → GAP-21)*<br>• live preview: the line with the cursor shows its Markdown source, other lines are rendered *(D-5; no story or spec → GAP-30)*<br>• status bar next to the save state: sync word or none *(DS rule 9; E01 has no sync → GAP-22)*<br>• right panel with the note outline *(DS; no material lists it → GAP-24)*<br>• no note selected, "Select a note to start writing" *(DS; AC-04.2 leads here)* | AC-01.2, AC-01.3 | `AppShell`, `TitleBar` + `NoteTab`, `NoteSidebar`, `NoteList`, `NoteBanner`, `SaveStatus`, `StatusBar`, `Alert`. Editor surface: DSG-01. Banner kinds: DSG-08. Save wording: DSG-11. Outline: DSG-13 |
| s04 | **New note dialog** | owner | • suggested name "Untitled" or "Untitled 1", selected *(S01 UX)*<br>• name taken, including case-only and Unicode-form-only, Create disabled *(S01 UX, S01 edge: name issues)*<br>• invalid name (`/ \ : * ? " < > \|`, reserved, over 255 bytes) *(S01 edge: name issues)*<br>• creating *(DS)*<br>• create fails, read-only workspace, no ghost entry in the list *(S01 edge: create note in a read-only workspace; AC-04.7)*<br>• create inside a chosen folder *(AC-04.4; no entry point → GAP-03)*<br>• opened from the sidebar button, the title bar button or Ctrl/Cmd+N *(S01 UX, DS; which one is canonical → GAP-25)* | AC-01.2, AC-04.4, AC-04.7 | `NewNoteDialog`, `Dialog`, `Field`, `Input`, `Button`. Gaps: DSG-05 |
| s05 | **Save-failed dialog** (leaving a note) | owner | • default: Retry, Discard changes, Cancel *(S01 UX)*<br>• with the reason, for example folder not writable *(S01 UX, S01 edge)*<br>• Retry fails again, dialog stays and shows the reason *(DS)*<br>• triggered by switching note, changing workspace, closing the window *(S01 UX)* or closing a tab *(D-4; none → GAP-21)*<br>• triggered by a lost workspace folder, runs before the banner *(S01 edge)*<br>• Escape means Cancel, never Discard *(DS)* | AC-01.3 | `SaveFailedDialog`, `Dialog`, `Button` |
| s06 | **Discard-edits confirmation** | owner | • "Load version from disk" after a conflict, discards local edits *(S01 edge: file changed on disk, note dirty; texts → GAP-15)*<br>• "Close note" on a deleted file while the note is dirty *(S01 edge: file deleted or moved externally; texts → GAP-15)* | AC-01.3 (text is never lost silently) | `ConfirmDialog`, `Button` |
| s07 | **Note with images** (display) | owner | • image shown below its link *(AC-03.1, S03 UX)*<br>• loading box *(S03 UX; text is a DS proposal → GAP-16)*<br>• placeholder: image not found *(AC-03.3, S03 UX)*<br>• placeholder: could not be read *(AC-03.3, S03 UX)*<br>• placeholder: format not supported *(S03 UX)*<br>• placeholder: too large (20 MiB or 100 megapixels) *(S03 UX)*<br>• placeholder: remote images are not loaded *(S03 Q7)*<br>• placeholder: invalid image link *(S03 UX)*<br>• placeholder: image could not be displayed (decode fails) *(S03 edge: corrupt image; text missing → GAP-16)*<br>• image replaced, deleted or appearing on disk updates live *(S03 edge)*<br>• Obsidian-style `![](x.png)` shows "not found" *(S03 G1)*<br>• reference-style image and HTML `<img>` show no widget *(S03 G2)*<br>• link inside a code block shows no widget *(S03 edge)*<br>• note text unchanged by any placeholder *(AC-03.3)*<br>• link source hidden or visible on lines the cursor is not on *(D-5, S03 Q5: live preview "may later hide" it; none → GAP-30)*<br>• the link is a normal Markdown link, file in `attachments/` *(AC-03.2; cannot be shown → GAP-01)* | AC-03.1, AC-03.2, AC-03.3 | `NoteImage`, `ImagePlaceholder`, note column recipe, `NoteBanner`, `StatusBar`. Editor surface: DSG-01. Gaps: DSG-07 |
| s08 | **Add images** (paste or drop onto the editor) | owner | • paste image: link inserted, image shown, note saved *(AC-03.1, S03 UX)*<br>• drop one image *(AC-03.1, S03 Q1)*<br>• drop several images, each link on its own line *(S03 R5)*<br>• second paste in the same second gets suffix " 1" *(S03 Q3, S03 edge)*<br>• note in a sub-folder, link starts with `../attachments/` *(S03 UX, link format)*<br>• drag over the editor, drop caret *(S03 UX; editor-level → DSG-01)*<br>• some files skipped, one notice with count and first reason *(S03 UX)*<br>• unsupported file, too large, write failed: notice, nothing inserted *(S03 defaults, S03 edge)*<br>• read-only workspace: notice, nothing inserted *(S03 edge)*<br>• `attachments` exists as a file: notice *(S03 edge)*<br>• no note open: nothing happens *(S03 UX)*<br>• drop outside the editor: nothing happens *(S03 UX)*<br>• text paste unchanged, text and image together is a text paste *(S03 defaults, S03 edge)*<br>• image being written (large file) *(none → GAP-17)*<br>• dismissing the notice *(S03 defaults; dismissal rules → GAP-18)* | AC-03.1, AC-03.2 | `Alert` (notice), `NoteImage`, `ImagePlaceholder`. Editor surface and drop caret: DSG-01. Gaps: DSG-06, DSG-10 |
| s09 | **Folder tree** (S04, no spec → GAP-28; replaces the list of s02) | owner | • tree with collapsed and expanded folders, chevron and guide line *(AC-04.6; owner direction 2026-10-30)*<br>• selecting a note in the tree opens it *(AC-04.6)*<br>• empty workspace *(S01 UX, carried over)*<br>• empty folder, folder with no notes *(none → GAP-06)*<br>• loading, cannot be read *(DS; spec silent → GAP-10, GAP-11)*<br>• live external changes *(S01 G4)*<br>• read-only workspace, tree readable, actions fail *(AC-04.7)*<br>• expansion remembered or not, open note's folder expanded or not *(none → GAP-05)*<br>• `attachments/` and non-Markdown files shown or hidden *(S03 Q6; none → GAP-06)*<br>• many notes and long names *(DS)* | AC-04.6 | `NoteSidebar`, `EmptyState`, `ErrorState`, `Skeleton`, `Alert`. Tree: DSG-02 |
| s10 | **Item actions menu** (on a note, a folder, the workspace root) | owner | • on a note: rename, delete; moving is by dragging, not in this menu *(AC-04.1, AC-04.2, D-2; invocation → GAP-03)*<br>• on a folder: new note, new folder *(AC-04.3, AC-04.4; invocation → GAP-03)*<br>• on the workspace root: new folder *(AC-04.3)*<br>• read-only workspace: actions present, then fail *(AC-04.7; surface → GAP-04)* | AC-04.1–AC-04.4, AC-04.7 | `Menu`, `IconButton`, `Tooltip`. Context menu: DSG-03 |
| s11 | **Rename dialog** | owner | • prefilled with the current name *(AC-04.1)*<br>• collision, including case-only and Unicode-form-only, rejected inline *(AC-04.1)*<br>• invalid name *(inherited from S01 name rules, not stated for rename → GAP-19)*<br>• name unchanged, or changed only in case from its own name *(none → GAP-09)*<br>• renaming *(DS)*<br>• rename fails, read-only workspace *(AC-04.7)*<br>• note stays open and keeps its session after rename *(AC-04.1; dirty case → GAP-02)* | AC-04.1, AC-04.7 | `Dialog`, `Field`, `Input`, `Button`. Rename dialog: DSG-04. Gaps: DSG-05 |
| s12 | **New folder dialog** | owner | • empty name, ready to type *(AC-04.3)*<br>• name taken or invalid *(inherited from S01 name rules, not stated for folders → GAP-19)*<br>• creating *(DS)*<br>• create fails, read-only workspace *(AC-04.7)* | AC-04.3, AC-04.7 | `Dialog`, `Field`, `Input`, `Button`. New folder dialog: DSG-04. Gaps: DSG-05 |
| s13 | **Delete note confirmation** | owner | • question names the note, Cancel has initial focus *(AC-04.2, DS Delete confirmation)*<br>• cancel keeps the note *(AC-04.2, DS)*<br>• confirmed: file removed, note closes, main area shows "no note selected" *(AC-04.2; what comes next → GAP-20)*<br>• toast "Note moved to trash", with Undo or without *(DS, D-3; Undo → GAP-23)*<br>• OS trash unavailable or moving to it fails *(none → GAP-23)*<br>• delete fails, read-only workspace, nothing changes *(AC-04.7)*<br>• deleting the open note while it has unsaved text *(none → GAP-02)*<br>• deleting a folder *(none → GAP-07)* | AC-04.2, AC-04.7 | `ConfirmDialog`, `Toast` (`ToastProvider`, `useToast`), `Alert` |
| s14 | **Move note by dragging** | owner | • drag a note row onto a folder row, tree updates, every open tab of that note follows the new path *(AC-04.5, D-2; dirty case → GAP-02)*<br>• drag over a folder, drop-target highlight *(D-2; styling → DSG-12)*<br>• drop on the workspace root, on the note's own folder, several notes, Escape cancels, folder opens while hovering *(none → GAP-31)*<br>• a note with that name already exists at the destination *(none → GAP-19)*<br>• links inside the moved note rewritten *(S03 Q2, S03 forward compatibility; not in AC-04.5 → GAP-08)*<br>• move fails, read-only workspace, nothing changes *(AC-04.7)*<br>• keyboard-only move *(none → GAP-31)* | AC-04.5, AC-04.7 | The tree of s09 with drag and drop; no dialog. Tree: DSG-02. Drag styling: DSG-12 |

## 4. Scenarios to switch in the prototype

These are prototype controls, not product features. Each one produces an outcome that cannot be reached by clicking through the happy path. There is no GitHub, e-mail link, sign-in or session in E01, so "service unavailable", "link expired" and "session expired" do not occur. The only external services are the operating system (folder picker, file system watcher, clipboard, drag-and-drop, file permissions) and, if chosen for S04, the OS trash.

| ID | Control | Values | Screens | Source |
|---|---|---|---|---|
| sw01 | Launch | no last workspace; last workspace restores; last workspace missing; restore is slow | s01, s02, s03 | S01 edge: last workspace no longer exists; GAP-11 |
| sw02 | Folder picker result | picks W1; picks W2 (empty); picks W3 (read-only); picks W4 (many notes); picker cancelled; folder cannot be opened | s01, s02 | AC-01.1; S01 edge: user cancels the picker; GAP-10 |
| sw03 | Note list loading | instant; slow; read error | s02, s09 | DS NoteList states; GAP-10, GAP-11 |
| sw04 | File watcher | live; cannot start (focus fallback) | s02, s09 | S01 G4 |
| sw05 | Workspace folder | present; deleted or renamed while open | s01, s02, s03, s05 | S01 edge |
| sw06 | Folder permission | writable; read-only | s03, s04, s08, s10–s14 | AC-01.3, AC-04.7, S03 edge |
| sw07 | Next save | succeeds; fails with permission-denied; fails once, succeeds on Retry | s03, s05 | AC-01.3, S01 UX |
| sw08 | External change to the open note | edit on disk; delete on disk; move on disk (clean or dirty note decides the result) | s03, s06 | S01 edge |
| sw09 | How the note file opens | ok; too large (5.2 MiB); not UTF-8; symlink; unknown error | s03 | S01 edge; GAP-12 |
| sw10 | State of each demo image file | ok; missing; unreadable; unsupported; too large; corrupt; can also change while the note is shown | s07 | AC-03.3, S03 edge |
| sw11 | Clipboard at the next paste | screenshot PNG; text only; text plus image; copied file path | s08 | S03 UX, S03 defaults |
| sw12 | Files at the next drop | 1 image; 2 images; 2 images and a PDF; image over 20 MiB; HEIC; drop outside the editor | s08 | S03 UX, S03 Q4 |
| sw13 | Writing into `attachments/` | ok; write fails; `attachments` is a file; same name appears at the last moment | s08 | S03 edge |
| sw14 | Delete result | moved to trash; OS trash unavailable; fails | s13 | AC-04.2, D-3; GAP-23 |
| sw15 | Move result | ok; ok with links rewritten; fails halfway | s14 | AC-04.5; GAP-08 |
| sw16 | Clock | fixed at 2026-10-25 14:30:12; "advance one second" button | s08 | S03 Q3 |
| sw17 | Reset | restore all demo data and all switches | all | prototype only |
| sw18 | Open notes | one; several; more than fit in the title bar | s03, s05 | D-4; GAP-21 |

Assumptions for the later prototype (mine, not product decisions; to approve when it is started): the OS folder picker, clipboard and drag-and-drop are simulated by in-prototype controls (the real ones are native); autosave runs on a virtual 1 000 ms timer; widths are 768 and 1440 px only; dark theme only.

## 5. Demo accounts and data (all fictional)

### Accounts

| Account | Role | Notes |
|---|---|---|
| Owner (implicit, no name shown) | owner | The only role. There is no account, no login and no avatar (design system rule 9 and "What to avoid"). Role combinations: none exist. |

### Brief data

| Kind | Value | Where it comes from |
|---|---|---|
| Product name | Basalt | brief |
| Prices | none | The brief's only price is the unverified "100$ per year" of Obsidian Sync (A03). No E01 screen shows a price, so it is not used. |
| Deadlines and dates | none in the UI | The design system forbids relative times ("Saved 3 minutes ago"). Only the fixed clock below is used. |
| Limits shown in text | 5 MiB (note), 20 MiB and 100 megapixels (image), autosave 1 000 ms | S01 and S03 specs |

### Fixed "now" for the demo clock

`2026-10-25 14:30:12` (local time). It matches the spec's own example, so the first pasted image is `Pasted image 20261025143012.png` and the second in the same second is `Pasted image 20261025143012 1.png`.

### Workspaces

| Id | Folder name | Content | Used by |
|---|---|---|---|
| W1 | `Basalt notes` | Tree below, about 12 notes, writable | default workspace |
| W2 | `Empty notes` | no files | empty state |
| W3 | `Read-only archive` | 3 notes, read-only | AC-01.3, AC-04.7 |
| W4 | `Big vault` | 500 notes, long names | many notes |
| W5 | `Lost workspace` | path no longer exists | workspace lost |

### Tree of W1 (names reuse the design-system stories)

```text
journal/        Daily 2026-10-18, Daily 2026-10-19
projects/       Roadmap, Sync server spec, archive/ (Old ideas)
demo/           Images, all cases (note), Big note (5.2 MiB), Binary file (not UTF-8)
attachments/    Roadmap diagram.png (1200 x 800), Photo 001.JPG, Scan.heic, Huge.png (21 MiB), Broken.png (corrupt)
Ideas, Meeting notes, Reading list, Shopping, Weekly plan, Résumé ideas
```

- Open by default: two tabs, `Weekly plan` (active, 1,204 words and 7,311 characters, the counts used in the design-system stories) and `Meeting notes`.
- `Weekly plan` contains one example of each live-preview element listed in the S01 spec, Phase 3 (heading, emphasis, strong, inline code, link, list, task list, blockquote, fenced code) and one image link.
- Collision tests: typing `weekly plan` (case-only) and the decomposed form of `Résumé ideas` (Unicode-form-only) must collide with existing notes.
- `Images, all cases` links: an existing image, a missing one, an unreadable one, an unsupported one (`Scan.heic`), a too large one, a corrupt one, `https://example.com/logo.png`, `![](Roadmap diagram.png)` (Obsidian style, shows "not found"), a reference-style image, and one inside a code block.

## 6. Specification gaps

Each gap has a question for the product owner. None is resolved here.

### A. Criterion without a screen or a state

**GAP-01 — "Another editor can open it" has no screen.** AC-01.2 and AC-03.2 are checked outside the app. The prototype can show only the raw Markdown source and the file name; with live preview (D-5) the source is visible only on the line being edited.
Question: is showing the Markdown source (and the file in `attachments/`) enough for these two criteria, and is it confirmed that there is no "reveal in file manager" or "open in another app" action?

**GAP-02 — Rename, move or delete of an open note with unsaved text.** AC-04.1, AC-04.2 and AC-04.5 describe an open note but not one that is dirty, has a conflict banner, or has autosave paused.
Question: what happens to the unsaved text, the banner and the paused autosave when the owner renames, moves or deletes that note, whether it is the active tab or a background tab? Is the text flushed first, and does the Save-failed dialog appear if that fails?

**GAP-03 — No entry point for "create folder" and "create note in a folder".** AC-04.3 and AC-04.4 do not say how the owner starts them. The sidebar header has only "New note" and "Change workspace", and the design system says not to add more without a spec.
Question: where does the owner start each action (header button, context menu on a row, both), and does the New note dialog get a folder choice or does the note go into the selected folder?

**GAP-04 — Where the read-only error is shown.** AC-04.7 says "the app shows an error" for four different actions. Design system rule 6 forbids a Toast for an error that needs action. Drag-and-drop would have no dialog to hold it.
Question: which surface shows this error: inside the dialog, an alert in the sidebar, or something else?

**GAP-05 — Tree expansion state.** AC-04.6 says "expandable tree" only.
Question: are expanded folders remembered between launches (and per device, as `lastOpenedNote` is), and is the folder of the open note expanded on open?

**GAP-06 — What the tree lists.** S01 lists only Markdown notes and skips dot-entries. S03 Q6 leaves attachments to S04. Empty folders and folders with only images are not covered.
Question: does the tree show empty folders, the `attachments/` folder, and non-Markdown files? What does an empty folder look like?

**GAP-07 — Folder operations in scope.** The S04 change text says "rename, delete and move notes, create folders", and every criterion about rename, delete and move names a note.
Question: are rename, move and delete of a folder out of scope for E01? If delete of a folder is in scope, what happens to the notes inside?

**GAP-08 — Link rewriting on move.** S03 Q2 says "when a note is moved (S04), its links are rewritten". AC-04.5 does not mention links, and no state shows the rewrite, a partial failure, or a notice.
Question: is link rewriting part of E01-S04's acceptance, and what does the owner see when it runs or fails?

**GAP-09 — Renaming a note to its own name.** AC-04.1 rejects case-only collisions with existing notes. A case-only change of the note's own name (`Weekly plan` to `weekly plan`) collides with itself on a case-insensitive file system. An unchanged name is also unspecified.
Question: is a case-only rename of the same note allowed, and is an unchanged name an error, a no-op, or a disabled button?

### B. State the flow needs that no criterion describes

**GAP-10 — Workspace cannot be opened or listed.** AC-01.1 covers only success. The specs cover a lost last workspace and a lost folder, not a freshly picked folder that is unreadable, and not a failed listing. The design system has "List could not be read" with no matching requirement.
Question: what should the owner see, and with what text, when a picked folder cannot be opened and when the listing fails?

**GAP-11 — Loading states.** Neither spec describes the app while it restores the last workspace and note at launch, while the list loads, or while a note opens. The design system says launch loading is "not designed" and no loading motion exists.
Question: which of these three moments need a visible state, and what does the owner see in each?

**GAP-12 — A note that cannot be opened.** The editor area for "too large" and "not UTF-8" is not described (the banner says "text is never cleared", but there is no text). Symlinks (`invalid-path`) and `unknown` errors have no banner kind and no text.
Question: what does the editor area show when a note cannot be opened, and which messages cover symlinks and unknown errors?

**GAP-13 — Workspace lost while the note has unsaved text.** S01 says the editor stays open with a banner offering Retry or "Change workspace". `NoteBanner` has no such kind.
Question: what are the banner's title, message and actions in this case?

**GAP-14 — Save indicator for pending and paused.** The autosave machine has `saved`, `pending`, `saving` and `paused`. The interface has three words: Saved, Saving…, Not saved.
Question: what word does the owner see while a change is waiting for the debounce, and while autosave is paused behind a banner?

**GAP-15 — Discard confirmations without text or design.** S01 requires a confirmation before "Load version from disk" and before "Close note" on a dirty deleted note. Neither dialog has a title, message, button labels or initial focus.
Question: what do these two confirmations say, and which button has the initial focus?

**GAP-16 — Image placeholder texts for two cases.** S03's i18n has `broken` and `loading`, but its UI/UX list has no text for either. The design system's "Loading image" is a proposal and `ImagePlaceholder` has no `broken` problem.
Question: what should the "image could not be displayed" and "loading" placeholders say?

**GAP-17 — Feedback while an image is being added.** A file of up to 20 MiB can take time to write. Nothing is visible until the link appears. A paste with no open note, and a drop outside the editor, do nothing and show nothing.
Question: is silence acceptable in all three cases, or should one of them show something?

**GAP-18 — The notice for skipped files.** S03 calls it "dismissible", built on `Alert`, with `role="status"`. The design system's `Alert` has no close button (listed as not built). Not stated: whether it stays until dismissed, whether a second add replaces or stacks it, and whether it disappears when the note changes.
Question: how is the notice dismissed, and what happens on a second add and on switching notes?

**GAP-19 — Name rules for folders, renames and moves.** S01's name validation is written for new notes. S04 states a collision rule only for renaming a note. Not stated: invalid names for rename and for folders, a folder name that collides, and a move where the destination already has a note of that name or is the same folder.
Question: do the S01 name rules apply to renames and folders, and what happens on a collision or a no-op move?

**GAP-20 — What follows a delete, rename or move.** AC-04.2 says "the note closes". Not stated: whether another note is selected, what the main area shows, how a renamed note finds its place in the sorted tree, and what happens to the tree scroll position.
Question: after each of the three actions, what is selected and what is shown in the note area?

### C. Contradictions between specs, brief and design system

**GAP-21 — Several open notes: the rules.** *Status: partly resolved 2026-10-31 (D-4: several notes can be open at once, shown as tabs).* The S01 spec still describes a single `session`, and launch restores one `lastOpenedNote`.
Questions: (a) does clicking a note in the sidebar replace the active tab or open a new one, and does opening an already open note focus its tab? (b) what happens to unsaved text when a tab is closed, and does the Save-failed dialog appear? (c) are all open tabs restored at launch, and where is that stored? (d) is there a limit on open tabs?
**GAP-22 — Sync word in the status bar.** Design system rule 9 says "sync state is always visible as a word in the status bar", and its main-screen story has a "Sync error" state. Epic E01 has no sync and no server (E02).
Question: what does the status bar show in the E01 prototype: only the save state, or a sync word with a fixed value?

**GAP-23 — Delete to the OS trash: what is left open.** *Status: partly resolved 2026-10-31 (D-3: delete moves the note to the OS trash, so "the file is removed" in AC-04.2 means removed from the workspace).* The design system's delete pattern offers a Toast with Undo; the S04 criteria do not mention it. Not stated: what happens when the OS has no trash or the move fails, and whether trashing is possible with official Tauri plugins only (AGENTS.md keeps Rust minimal; to be checked in the S04 spec).
Questions: is Undo (restoring from the trash) part of E01? If the file cannot be moved to the trash, is permanent deletion offered or is the delete refused?
**GAP-24 — Design-system parts that no material mentions.** The activity bar has Search, Bookmarks and Settings; the right panel shows a note outline; the status bar shows word and character counts "that the owner can turn off in settings". The brief, S01, S03 and S04 list none of these (search is explicitly out of scope; N03 excludes graph, tags, backlinks and themes). There is no settings screen.
Question: in the prototype, are these hidden, shown but inert, or in scope? Which activity bar section is active, and what do the others do when clicked?

**GAP-25 — Entry points and shortcuts.** S01 names a "New note" button and Ctrl/Cmd+N, Ctrl/Cmd+O and Ctrl/Cmd+S. The design system has a "New note" icon button in the sidebar and another in the title bar. No screen shows what Ctrl/Cmd+O does.
Question: which "New note" control is canonical, and do the shortcuts appear anywhere in the interface (tooltips, menus)?

**GAP-26 — "Offline-first" versus "local-first", and no flow in the brief.** S01 Q11 says the brief "should get a clarifying row"; the brief still says offline-first (D05). The brief's Key flows are "Deferred".
Question: should the brief be updated, and may this map's flow order (welcome, open, list, create, edit, images, then file management) stand in for the missing Key flow?

### D. Decisions nobody has made

**GAP-27 — How to move a note.** *Status: resolved 2026-10-31 (D-2: dragging). The rules of dragging moved to GAP-31.* Issue #16 had left "drag-and-drop, an action/dialog, or both" open.
**GAP-28 — S04 has no specification.** *Status: resolved for now (D-1: this step produces only the screen map; the S04 screens stay in it). Issue #16 still says a dedicated S04 spec is owed.* s09–s14 rest on seven criteria, two open questions, the folder-tree direction and decisions D-2 to D-4. States such as loading, error and empty folder are not specified.
**GAP-29 — Which editor the prototype shows.** *Status: resolved 2026-10-31 (D-5: Markdown in live preview, as in Obsidian). What follows from it is GAP-30.* Before the decision, S01 Phase 2a shipped source mode and live preview was "Phase 3".

**GAP-30 — Live preview has no story, criteria or spec.** The owner wants live preview (D-5). In the sources it is "Phase 3" of the S01 spec, "extracted into its own spec and issue" that does not exist. Epic E01's "done when" lists only S01, S03 and S04, and no criterion mentions live preview. The S01 Phase 3 element list is: headings, emphasis, strong, inline code, links, lists, task lists, blockquotes, fenced code, with source shown on the active line or selection. S03 Q5 keeps the image link source visible "now" and says live preview "may later hide" it.
Question: is live preview part of epic E01 (a new story, or part of S01) or later work? Which elements must the map show rendered? In live preview, is the `![](…)` source of an image hidden on lines the cursor is not on, and must it stay viewable for AC-03.2?

**GAP-31 — Moving by dragging: the rules.** D-2 gives the mechanism, not its behaviour. Not stated: dropping on the workspace root, dropping on the note's own folder, moving several notes at once, cancelling a drag with Escape, opening a collapsed folder while hovering over it, and a keyboard way to move (design system rule 8 requires every control to work without a pointer, and the S01 list is keyboard-navigable).
Questions: which of these behaviours apply, and is a keyboard alternative to dragging required in E01?
## 7. Gaps in the design system

| ID | Missing | Needed by | Source of the claim |
|---|---|---|---|
| DSG-01 | Markdown editor surface with live preview (D-5): typing, selection, rendered headings, emphasis, lists, quotes and code, source on the cursor line, drop caret while dragging a file, host for the image widgets. It is the separate `@basalt/editor` package, not in `@basalt/ui`, so a prototype needs a stand-in. | s03, s07, s08 | "Remaining" in epic E01 docs; `Missing.mdx` |
| DSG-02 | `Tree` component with tree semantics, arrow-key navigation and drag and drop (D-2). Only a visual proposal story exists. | s09, s14 | `Missing.mdx`: Folder tree |
| DSG-03 | `ContextMenu` (right-click). `Menu` exists, but the context menu is "built after a second use". | s10 | `Missing.mdx`: Components not built |
| DSG-04 | Rename dialog and New folder dialog. Only `NewNoteDialog` exists, and its doc says rename is "a rename dialog built from the same parts". (Moving is by dragging, so no Move dialog is needed.) | s11, s12 | `NewNoteDialog.mdx`; E01 epic docs: "Missing: … rename dialog, move" |
| DSG-05 | An error for the whole operation inside a dialog (for example read-only folder). `NewNoteDialog` has only a name `error`. | s04, s11, s12 | `NewNoteDialog.mdx` anatomy |
| DSG-06 | Close button on `Alert`, needed for the dismissible notice. | s08 | `Missing.mdx`: Dismissing alerts, "No use yet" |
| DSG-07 | `broken` problem in `ImagePlaceholder`, and final text for `loading`. | s07 | `ImagePlaceholder.mdx` variants versus S03 i18n |
| DSG-08 | `NoteBanner` kinds for: workspace unavailable (Retry, Change workspace), symlink or invalid path, unknown error. | s03 | `NoteBanner.mdx` variants versus S01 edge cases |
| DSG-09 | Loading state at launch, and loading motion in general. | s01, s02, s03 | `WelcomeScreen.mdx` section 6; `Missing.mdx`: Spinner or pulse motion |
| DSG-10 | In-progress indicator for a long write. A progress bar is listed as "Low". | s08 | `Missing.mdx`: Long tasks |
| DSG-11 | `SaveStatus` has three states, with no wording for pending or paused. | s03 | `SaveStatus.mdx` versus the autosave states in S01 |
| DSG-12 | Drag source and drop target styling for tree rows, required by D-2. | s09, s14 | owner decision D-2 |
| DSG-13 | Outline content of `SidePanel`, only if the right panel is shown (GAP-24). | s03 | `Missing.mdx`: Outline content |

## 8. Numbers

Counts were taken from this file by script, not estimated.

| Item | Count |
|---|---|
| Screens | 14 (s01–s14) |
| Screens of E01-S01 / E01-S03 / E01-S04 | 6 (s01–s06) / 2 (s07–s08) / 6 (s09–s14) |
| States (bullets in the screen table) | 120 |
| States with no criterion or spec behind them (marked `none`) | 17 |
| States that exist only in the design system (marked `DS`) | 7 |
| States that carry a pointer to a specification gap | 46 |
| Scenarios to switch | 18 (sw01–sw18) |
| Specification gaps | 31 (GAP-01–GAP-31) |
| Specification gaps by kind | criterion without screen or state 9, state without criterion 11, contradiction 6, undecided 5 |
| Specification gaps by status | open 26, partly resolved 2, resolved 3 |
| Design-system gaps | 13 (DSG-01–DSG-13) |
| Acceptance criteria in the flow | 13 (3 + 3 + 7), all mapped to at least one screen; AC-01.2 and AC-03.2 only partly (GAP-01) |
