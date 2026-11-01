---
date: 2026-10-31
slug: workspace-basic-clickable-prototype
type: run
status: completed
tags: [prototype, e01, screen-map, design-system, review-engine]
---

# Clickable prototype workspace-basic

## Goal

Build a clickable prototype of the approved E01 screen map (`prototypes/e01-screen-map.md`) in `prototypes/workspace-basic/`, from design-system components and tokens, with the review engine for comments, in four stages (0 plan, 1 happy path, 2 states and scenarios, 3 honesty and checks), waiting for the owner's "dalej" after each.

## What was done

- Stage 0: plan; four conflicts between the task and the map were raised (one role, dark theme only, directory, review-engine styling). The owner answered GAP-24 (inert, with a note) and GAP-22 (no sync word) and approved the map.
- Stage 1: Vite + React + Tailwind setup that reuses `basalt-app/node_modules` through a symlink script; review engine wired; 14 screens; happy path.
- Stage 2: scenario controls sw01 to sw18 and every state of the map; keyed timers.
- Stage 3: a note for each screen, README with "Simulation limits", navigation tests for all 14 screens, browser checks (every button, keyboard, 320 and 1440 px, comment mode).

## Decisions

- No demo accounts or access gates: the map has one role and no login (map section 2).
- Dark theme only; the theme toggle is inert and says so. No colours, spacing or components were added; missing parts are built from tokens and marked with `data-gap`.
- `lekcja7/silnik-przegladu` was copied, not edited. Its three `color-mix(` calls stay (review chrome, not product).
- The screen map was marked approved and decisions D-6 to D-8 were added, at the owner's request.
- Texts and rules the specifications do not give were invented and are listed in the README as not product decisions.

## Outcomes

- 110 unit tests, typecheck and token check clean. Browser walks in Chromium cover sw01 to sw18, the happy path, keyboard use and comment mode.
- Bugs found by those checks and fixed are in [the lesson](../lessons/2026-10-31-prototype-embedding-radix-and-review-engine.md).

## Open issues

- Questions for the specifications and design-system gaps are in the final report and the README.
- The map `prototypes/e01-screen-map.md` and `lekcja7/` are untracked in git; only `prototypes/workspace-basic/` and these `.ai` files are committed by this run.
- Playwright integration tests in `basalt-app/e2e/` were not added: the prototype is not part of the application. The browser walks were run as scripts outside the repository.
