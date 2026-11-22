---
date: 2026-10-30
slug: design-system-batch-1
type: run
status: completed
tags: [design-system, storybook, components]
---

# Design system, Stage 2, Batch 1

## Goal

Continue a local course file (not in this repo): build Batch 1 of the base components (Button, IconButton, TextLink, Input, Label+Field, Checkbox) on tokens, with stories and 13-section docs.

## Done

- Components in `basalt-app/packages/ui/src/components/`, exported from `src/index.ts`.
- Unit tests for each component and for `cn`; stories with Playground, variants, state matrix (frozen hover/focus through `data-preview-state`), long content, narrow screen and `play` interaction tests.
- Docs pages `docs/primitives/*.mdx` (13 sections each); blocks `StateMatrix` and `DoDont`.
- Fixes found on the way: `tailwind-merge` configuration, CSS layer order, button background reset (see lesson `2026-10-30-tailwind-merge-and-layer-order`).
- `contrastPairs.ts`: added `status-danger` on `surface-card`, `state-hover`, `state-selected`.
- Removed the `buttonVariants.ts` exception from `checkTokens.ts` ignored paths.

## Decisions (proposals, pending owner approval; open questions 1-6 of the TODO)

1. Button keeps `default` and `outline` as aliases of `primary` and `secondary`, and `lg` (36 px), so `packages/app` is untouched.
2. IconButton uses native `title` until Tooltip (Batch 3).
3. Disabled = `text-muted` on `state-hover`, no opacity.
4. Checkbox box 16 px inside a 28 px row; no indeterminate state.
5. Components written by hand, shadcn CLI not used.
6. Optional fields marked with "(optional)", required ones unmarked.

## Results

`check:tokens` 0 violations, unit tests 96/96, stories as tests 45/45 (a11y, dark), lint 0, typecheck 0, `build-storybook` OK.

## Open issues

- Not checked: 320/768/1440 px in a browser beyond the narrow-screen stories, keyboard walk through the built docs, accent variants (green, amber, purple) for the new components.
- Owner has not reviewed the batch; Batch 2 waits for "dalej".
- Not committed or pushed.

## Update: Batch 2 (same day)

Built Select (native), Switch (hand-written `role="switch"`), Card/CardRow, StatusIndicator, Alert, Skeleton with tests, stories and 13-section docs. Also added a margin reset for `p`, headings, `figure` and `fieldset` to `styles.css` (no Tailwind preflight). Results: `check:tokens` 0, unit tests 121/121, stories 70/70, lint 0, typecheck 0, build OK. Proposals are listed in `POSTEP.md`. Not committed or pushed.

## Update: Batch 3 (same day)

Built Tooltip, Dialog, ConfirmDialog, Menu, Popover, RadioGroup, Toast, Tabs, EmptyState, ErrorState with tests, stories and 13-section docs. Added Radix dependencies (dialog, dropdown-menu, popover, radio-group, tabs, toast; tooltip moved to dependencies). IconButton now uses Tooltip. `setupTests.ts` got jsdom stubs for Radix. Results: `check:tokens` 0, unit tests 163/163, stories 110/110, lint 0, typecheck 0, build OK. Proposals in `POSTEP.md`. Not committed or pushed.

## Update: Stage 3 (same day)

Built product components from the E01-S01 and E01-S03 specs (`src/product/`), four proposed patterns, 21 full-screen stories and a map of states. Fixes: AppShell scroll region needs `tabIndex` (axe), focus after a server error needs an effect (the field is disabled while pending). Stage 2 was committed as `a32e838`; Stage 3 is not committed. Results: `check:tokens` 0, unit tests 204/204, stories 182/182, lint 0, typecheck 0, build OK.

## Update: Stage 4 (same day)

Wrote the guide pages (Start here, Components, How to choose, Usage and accessibility, Content, What to avoid, What is missing, Contributing, epics E01-E03), the catalog block and the agent file `docs/design-system.md` (referenced from `AGENTS.md`). All internal docs links were checked against the built `index.json`. Results: `check:tokens` 0, unit tests 204/204, stories 182/182, lint 0, typecheck 0, build OK. Not committed.

## Update: Stage 5 (same day)

Final checks, a sweep of all stories and docs pages at 320, 768 and 1440 px, and a keyboard walk. Fixed story layouts that overflowed at 320 px (Tabs, ImagePlaceholder, Button, Skeleton) and hid ReactNode args from Controls tables. Found a regression: `npm run test:e2e` fails on "applies the stylesheet" because the app does not generate the token classes the new Button uses; the owner chose to rewrite the app welcome page on the design system; done (`packages/app/src/index.css`, `App.tsx`, new e2e test), e2e 5/5. Prepared (not ran) the agent test on E02-S01 "Connect to a sync server". Results: `check:tokens` 0, unit tests 204/204, stories 182/182, lint 0, typecheck 0, build OK. Not committed.

## Update: selected row style (same day)

Owner chose option C (inset rounded row, accent-tinted fill while the list has focus, neutral otherwise, no accent bar). Updated `NoteList`, added token `--bs-tree-selected` and the `focus-ring-inset` utility, removed `--bs-tree-selected-indicator`, recorded the accepted 1.57:1 deviation in the contrast pairs and docs, replaced the three-way prototype with a single "Folder tree (E01-S04 direction)" prototype. Added a browser test for the focus-dependent fill. Not committed.
