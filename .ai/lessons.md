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
