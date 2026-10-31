---
date: 2026-10-30
slug: design-system-window-shell
type: run
status: completed
tags: [design-system, storybook, app-shell, title-bar, activity-bar, side-panel]
---

# Design system: the window shell (stages 1 and 2)

## Goal

Act on `lekcja6/design-system-handoff-main-screen.md`: add the missing window regions to `@basalt/ui` and settle the two surface contradictions. Spec: `.ai/specs/2026-10-30-design-system-window-shell.md`. Stage 1 only (owner decision "20b"): components and contradictions; the rest waits for the owner's review.

## What was done

- Asked the owner every visual question (20 decisions plus 4 follow-ups); nothing was guessed. Decisions are in the spec.
- Surfaces: left and right panel stay `surface-card`, the status bar stays `surface-frame`; `tokeny.md`, `tokenData.ts`, `Color.mdx`, `design-system.md`, `NoteSidebar.mdx` and the `LayoutWidths` diagram were corrected.
- `IconButton`: `size="activity"` and `active`.
- New components in `src/product/`: `AppShell`, `TitleBar` (with internal `NoteTab`), `ActivityBar`, `SidePanel`. Unit tests, stories with play tests, 13-section docs pages, catalog and `design-system.md` rows, exports.
- Tokens: `note-tab-min-width` (128 px) and `note-tab-max-width` (200 px), both proposals.
- `MainScreen.stories.tsx` rewritten with package imports only; stories added for the unsaved change and 768 px.
- `Missing.mdx`, `Tabs.mdx`, `Spacing and layout.mdx`, `IconButton.mdx` updated.

## Decisions made by the agent (to confirm)

- Dividers between regions are drawn by `AppShell`.
- Right panel below 1440 px starts closed as application state, not CSS.
- Note tabs are a list of buttons with a sibling close button, not ARIA tabs.
- Overflow of tabs: clipped, open tab scrolled into view, "Show all open notes" menu appears.
- Side panel close icon: `PanelRightClose`. Tab width tokens: 128 and 200 px.

## Outcome

Green: `npm run lint`, `npm run typecheck`, `npm run check:tokens`, `npm run test` (231 unit tests), `npm run safety-net` (213 story tests with a11y), `npm run build-storybook`, `npm run test:e2e` (5 tests).

## Stage 2 (2026-10-31, after the owner accepted the proposals)

- Accessible-name vocabulary and landmark names in `Content.mdx`.
- Spacing table for the window regions in `Spacing and layout.mdx`.
- Screen-story checklist in `Contributing.mdx`.
- New token `overlay-width` (300 px) for Menu, Popover and Toast, so `sidebar` means only the panel width; a `cn` test guards the registration of the newer width tokens.
- `Usage.mdx`: 320 px applies to components, screens are desktop only.
- `StatusBar.mdx` not needed: `SaveStatus.mdx` covers both components.
- Unit tests 232, story tests 213, build, e2e 5, all green. Docs pages of the changed topics load without runtime errors.

## Open issues

- No Playwright test for the new components: the app (`packages/app`) does not use them yet.
- Two tabs with the same note name look the same in the tab and in the menu.
- `NoteSidebar`: "Change workspace" is indented more than the workspace name (ghost button padding). Not part of this change.
