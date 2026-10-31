---
date: 2026-10-30
slug: tailwind-merge-and-layer-order
type: lesson
status: active
tags: [design-system, tailwind, storybook, bug]
---

# Custom Tailwind tokens break `tailwind-merge` and layer order

Two silent bugs made the first Basalt buttons ignore their token classes. Both were caught only by the Storybook a11y contrast check, not by typecheck, lint or unit tests.

1. **`tailwind-merge` does not know Basalt tokens.** `text-size-ui` looked like a text color, so `cn("text-size-ui", "text-text-on-accent")` dropped one of them. Fix: `extendTailwindMerge` in `packages/ui/src/lib/utils.ts` lists the token colors, font sizes, spacing, radii and weights. When a token is added to `theme.css`, add it there too (`utils.test.ts` guards the behavior).
2. **Layer order.** `@layer base` was declared after `utilities`, so base rules such as `button { color: inherit }` beat utility classes. Fix: `@layer theme, base, components, utilities;` first in `styles.css`.

Also: with no Tailwind preflight, `button` keeps the browser background (grey in dark color scheme); `styles.css` resets it to transparent.

How to notice: a story passes unit tests but axe reports a foreground of `#cccccc` (inherited `text-ui`) on a colored button.

Follow-up (Batch 2): the same missing preflight left default browser margins on `p` and headings, which pushed Card and Alert text apart although tests and a11y passed. `styles.css` now resets them. Always open new components in the built Storybook, tests do not catch spacing.
