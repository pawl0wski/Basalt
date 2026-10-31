---
date: 2026-10-30
slug: radix-overlays-gotchas
type: lesson
status: active
tags: [design-system, radix, a11y, testing, bug]
---

# Radix overlay gotchas found while building Batch 3

- **Tooltip on a focus-trapped autofocus target.** A Radix tooltip opens on any focus. The close button of a dialog gets focus on open, so its tooltip opened at once, and the first Escape closed the tooltip instead of the dialog. `IconButton` has `tooltip={false}` for such cases (dialog and toast close buttons).
- **`state-hover` equals `surface-raised`.** A highlighted menu item on `surface-raised` is invisible with `state-hover`; use `state-selected` inside any raised panel.
- **Modal dropdown menu and axe.** `DropdownMenu` is modal by default and puts `aria-hidden` on the page, including the focusable trigger, which fails axe `aria-hidden-focus`. `Menu` uses `modal={false}`.
- **Menu name.** Radix labels `role="menu"` by its trigger (`aria-labelledby`), so an extra `aria-label` is ignored; the trigger text is the name.
- **Radio arrow keys in tests.** Radix selects on arrow focus only while the key is still held (it resets on `keyup`), so `user.keyboard("{ArrowDown}")` moves focus but does not check. Use `{ArrowDown>}` plus `waitFor` and `{/ArrowDown}` in the browser. jsdom: assert focus only.
- **jsdom needs stubs** for Radix: `ResizeObserver`, `hasPointerCapture`, `setPointerCapture`, `releasePointerCapture`, `scrollIntoView` (in `basalt-app/setupTests.ts`).
- **Scrollable `pre`** needs `tabIndex={0}` (axe `scrollable-region-focusable`).
