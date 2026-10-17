---
date: 2026-10-17
slug: use-shadcn-ui-not-just-tailwind
status: active
tags: [ui, shadcn, correction]
---

# Use shadcn/ui as the component system

When a project specifies shadcn/ui, installing Tailwind CSS and class utilities alone does not fulfill the requirement. Configure the shadcn CLI (`components.json`), create reusable shadcn-style components in the shared UI package, and use those components in the app. Keep framework integration in the app package, and ensure workspace package aliases resolve to package source correctly under Vite and TypeScript.
