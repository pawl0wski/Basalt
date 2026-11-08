# Lessons Learned

Long-term memory index for AI agents. Each entry links to a full lesson file in `.ai/lessons/`.

## Index

<!-- Append new lessons here as: `- YYYY-MM-DD — one-line summary — [detail](lessons/YYYY-MM-DD-slug.md)` -->
- 2026-10-17 — Install and configure shadcn/ui as the actual component system, not just Tailwind and helper dependencies — [detail](lessons/2026-10-17-use-shadcn-ui-not-just-tailwind.md)
- 2026-10-17 — Keep Rust minimal: thin Tauri host, logic in TypeScript, official plugins first — [detail](lessons/2026-10-17-minimize-rust.md)
- 2026-10-17 — Resolve PR conflicts by rebasing onto origin/master (force-with-lease), not by merging master into the branch — [detail](lessons/2026-10-17-resolve-conflicts-with-rebase.md)
- 2026-10-25 — `pathKey` (NFC + case fold) only detects name collisions; file identity (cache keys, equality, link rewriting) is exact `WorkspacePath` — [detail](lessons/2026-10-25-pathkey-is-not-identity.md)
- 2026-10-30 — Basalt token classes need `extendTailwindMerge` and `@layer` order theme, base, components, utilities, or utilities are silently dropped/overridden — [detail](lessons/2026-10-30-tailwind-merge-and-layer-order.md)
- 2026-10-30 — Without Tailwind preflight, reset margins on `p`/headings/`figure`/`fieldset` and button background in `styles.css`; verify new components visually, not only by tests — [detail](lessons/2026-10-30-tailwind-merge-and-layer-order.md)
- 2026-10-30 — Radix overlays: tooltip opens on autofocus, state-hover = surface-raised, modal menu fails axe, radio arrow selection needs a held key in tests — [detail](lessons/2026-10-30-radix-overlays-gotchas.md)
- 2026-10-30 — Running `npm run test:e2e` was missed until Stage 5: rewriting a shared component (Button) on new tokens broke the app landing page that still used the old shadcn CSS; run the app e2e after changing anything the app imports — [detail](lessons/2026-10-30-run-app-e2e-after-shared-component-change.md)
- 2026-10-30 — [A check that only exists as a local script is not a safety net](lessons/2026-10-30-wire-checks-into-ci.md)
- 2026-10-30 — Window shell components: `overflow-hidden` clips focus rings, sr-only text adds a space (and a stray comma) to the accessible name, state matrices need landmark rules off, scrollable regions need `tabIndex` — [detail](lessons/2026-10-30-window-shell-gotchas.md)
- 2026-10-31 — CI failed on unformatted markdown and an axe `scrollable-region-focusable` violation in a story `<pre>`; run `format:check` + `safety-net` before pushing and give scrollable demo content `tabIndex={0}` — [detail](lessons/2026-10-31-ci-format-and-scrollable-story-content.md)
- 2026-10-31 — `backlog.md` is only an index: acceptance criteria live in the GitHub issues; compare the design system with the specs before mapping screens and record clashes as owner questions — [detail](lessons/2026-10-31-backlog-is-an-index-acs-live-in-issues.md)
- 2026-10-31 — Embedding a React prototype in the review engine: one stable app host moved between screen frames, listener in `useLayoutEffect`, capture the engine's heading focus, guard key handlers against portal bubbling, activate on `click`, key every timer — [detail](lessons/2026-10-31-prototype-embedding-radix-and-review-engine.md)
- 2026-11-01 — Prototype review notes and map decisions become spec criteria with screen ids (or a recorded "not doing"); follow data-shape changes through the whole spec; ask which control a vague note means — [detail](lessons/2026-11-01-prototype-review-feeds-specs.md)
- 2026-11-01 — After removing the New note dialog the new note was not focused and typing did nothing; test "action, then type" for every flow that opens a note — [detail](lessons/2026-11-01-focus-new-note.md)
- 2026-11-08 — Registered Tauri fs/dialog/persisted-scope plugins; only `allow-destroy` confirmed by docs, Linux sandbox could not cargo-check and all runtime assumptions stay unverified — [detail](lessons/2026-11-08-tauri-fs-plugins-spike-setup.md)
