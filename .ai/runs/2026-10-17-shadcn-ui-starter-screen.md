---
date: 2026-10-17
slug: shadcn-ui-starter-screen
type: run
status: completed
tags: [ui, shadcn, tauri, frontend]
---

# Replace the Tauri starter screen with a Basalt screen using shadcn/ui

## Goal

Add the shadcn/ui foundation and replace the default Tauri + Vite + React starter screen with a responsive Basalt welcome screen, without building workspace functionality.

## Work done

- Added the shadcn CLI configuration in `basalt-app/components.json`.
- Configured Tailwind CSS v4 through the Vite plugin, global theme tokens, and `@/*` aliases.
- Added a reusable shadcn-style Button component and `cn` utility to `packages/ui`.
- Replaced the starter logos, greeting form, and template CSS with a Basalt-branded workspace welcome screen using the shared Button, Lucide icons, and responsive Tailwind styling.
- Added shadcn's Radix slot, class utilities, icon library, Tailwind integration, and animation package dependencies.
- Recorded the correction in `.ai/lessons/`.

## Verification

- `npm run build` from `basalt-app/` passes: TypeScript check and Vite production build.

## Notes

- Workspace selection and creation buttons are visual placeholders; no application workflow was implemented, as requested.
- Avoid adding a decorative side rail or other unrequested interface surfaces to this initial welcome screen.
