---
date: 2026-10-30
slug: design-system-window-shell
type: spec
status: implemented
tags:
  [design-system, storybook, ui, app-shell, title-bar, activity-bar, side-panel]
---

# Design system: the window shell

## Goal

The main screen test (`lekcja6/design-system-handoff-main-screen.md`) showed that `@basalt/ui` cannot build the window of an open workspace: four regions have no component and two surfaces contradict the token table. This spec adds the regions and settles the contradictions. Stage 1 (this spec's scope, owner decision "20b") covers components and contradictions. Stage 2 (rules and documentation polish) is separate and waits for the owner's review.

## Owner decisions (2026-10-30)

| #   | Decision                                                                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Left and right panel use `surface-card` (same shade as the editor), not `surface-frame`. `lekcja6/tokeny.md` and `docs/design-system.md` are corrected.        |
| 2   | The status bar uses `surface-frame` (as `StatusBar` does today). `tokeny.md` and the `LayoutWidths` diagram are corrected.                                     |
| 3   | A note tab is 28 px high (`h-icon-button`) inside the 36 px title bar.                                                                                         |
| 4   | The active tab indicator is at the bottom of the tab.                                                                                                          |
| 5   | Tab width is elastic up to a limit (tokens, see below); the name is truncated.                                                                                 |
| 6   | When the tabs do not fit, an "Open notes" menu lists all of them.                                                                                              |
| 7   | An unsaved note shows a dot in place of the close button; the close button appears on hover and keyboard focus.                                                |
| 8   | A save failure is shown in the status bar and the note banner, not on the tab.                                                                                 |
| 9   | `TitleBar` draws the window buttons (minimize, maximize, close).                                                                                               |
| 10  | A 1 px `border-divider` runs under the title bar, full width.                                                                                                  |
| 11  | The activity bar has Notes, Search, Bookmarks and, at the bottom, Settings.                                                                                    |
| 12  | No count badge on activity bar icons for now. Recorded in `Missing.mdx`.                                                                                       |
| 13  | `SidePanel` is a frame with a header and a content slot. The outline content and its loading and error states are not designed yet. Recorded in `Missing.mdx`. |
| 14  | The side panel header has a visible title, a search icon and a close icon.                                                                                     |
| 15  | The side panel is `sidebar` wide (300 px), like the left panel.                                                                                                |
| 16  | The side panel is not shown when no note is open.                                                                                                              |
| 17  | With no note open the title bar shows the toggles and window buttons but no tabs.                                                                              |
| 18  | Below `desktop` (1440 px) the right panel starts closed.                                                                                                       |
| 19  | The note column is a documented class recipe, not an exported component.                                                                                       |
| 20  | Stage 1 first, the rest after the owner's review.                                                                                                              |
| 21  | The close icon of the side panel header (`PanelRightClose`) is an agent proposal to confirm in the review.                                                     |

## Decisions made by the agent (to confirm)

- Components live in `src/product/` (they are tied to the application window, not base controls).
- `AppShell` owns the dividers between regions (`border-b` under the title bar, `border-r` after the activity bar and the left panel, `border-l` before the right panel). Region components have no outer divider, so a region keeps exactly its token size.
- Right panel: below 1440 px the application opens the panel closed; the user can open it with the title bar toggle and it takes width from the note. This is state of the application, not CSS, so `AppShell` does not hide it.
- Activity bar items are `aria-current="page"` buttons in a `nav` named "Sections".
- Note tabs are a list of buttons (name) with a sibling close button, `aria-current="true"` for the open note. They are not ARIA tabs because a tab cannot contain another button.
- `IconButton` gets `size: "default" | "activity"` and an `active` flag (`icon-active` colour, `data-active`). The consumer sets the ARIA attribute.
- New tokens: `--bs-note-tab-min-width` 96 px and `--bs-note-tab-max-width` 200 px. These values are proposals.
- `aria-label` vocabulary: "Toggle sidebar", "Toggle right panel", "New note", "Close {name}", "Open notes", "Minimize window", "Maximize window", "Close window", "Search {panel title}", "Close {panel title}".

## Scope

1. Surface corrections: `tokeny.md`, `design-system.md`, `NoteSidebar.mdx`, `LayoutWidths` diagram and its width table.
2. `IconButton`: `size`, `active`, docs, stories, tests, frozen-state CSS.
3. `AppShell`, `TitleBar` (with `NoteTab`), `ActivityBar`, `SidePanel`: component, unit test, stories (playground, states, long content, narrow), 13-section docs page, catalog entry, `design-system.md` row, export.
4. `MainScreen.stories.tsx` rewritten with package imports only.
5. `Missing.mdx` and `Tabs.mdx` updated; replace the docs-only `AppShell` block with the real one.
6. Lessons and run log.

## Out of scope (stage 2)

Accessible-name vocabulary page, the spacing table for the shell regions, screen-story checklist, `StatusBar.mdx`, the `Usage.mdx` / `Missing.mdx` 320 px wording, `sidebar` token split for overlays.

## Definition of done

- `MainScreen.stories.tsx` has no local `TitleBar`, `ActivityBar`, `OutlinePanel`, shell `div` or `size-activity-button` override.
- `npm run check:tokens` reports 0; `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:stories:themes` and `npm run build-storybook` pass; every story passes the accessibility check.

## Progress

Stage 1 and stage 2 are implemented (run log `.ai/runs/2026-10-30-design-system-window-shell.md`). Stage 2 added: the accessible-name vocabulary (`Content.mdx`), the spacing table for the window regions (`Spacing and layout.mdx`), the screen-story checklist (`Contributing.mdx`), the `overlay-width` token (Menu, Popover, Toast no longer use `sidebar`), and the 320 px wording in `Usage.mdx`. `StatusBar.mdx` was not needed: `SaveStatus.mdx` already covers both.
