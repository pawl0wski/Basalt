---
date: 2026-11-01
slug: prototype-review-feeds-specs
type: lesson
status: active
tags: [prototype, specs, review, e01]
---

# Prototype review notes must reach the specs, with screen ids

## What happened

The owner's review of the clickable prototype contradicted the specs in several places: the New note dialog (S01 UX) versus "click and get `Untitled`", the "Change workspace" button in the sidebar, a single open note (`lastOpenedNote`) versus tabs, and a flat list versus the folder tree. S04 had no spec at all, so its criteria lived only in the screen map.

## Lessons

- Turn every map decision and review note into a checkable criterion with the screen id, or into a recorded "not doing" with the reason. Do it in the spec that owns the flow; a flow with no spec gets a skeleton spec.
- A decision that changes a data shape (tabs replace `lastOpenedNote`) must be followed through the whole spec: Data Model, Phase 1 step lists and tests, not only the UI section.
- When a note names a control vaguely ("this button is not needed"), ask which control. Do not guess.
- Some requests have no home yet (Change workspace moves to Settings, which does not exist): record the intent in "Out of scope" so it is not lost.
- Show the list of spec changes and wait for approval before editing; the owner's answers changed several items.
