---
date: 2026-10-30
slug: window-shell-gotchas
type: lesson
status: active
tags: [design-system, storybook, a11y, focus, tabs]
---

# Window shell gotchas (TitleBar, ActivityBar, SidePanel)

- **`overflow-hidden` clips focus rings.** The tab strip of the title bar clips overflowing tabs, and with them the 2 px ring plus 2 px offset of the controls inside it. Give the clipping element room for the ring: `self-stretch` to the full 36 px bar height and `px-in-group` at its ends. Check focus visually in the frozen `focus` row of the state matrix.
- **Visually hidden text in a flex button gets a space in the accessible name.** `Sync` + `<span class="sr-only">, not saved</span>` is read as "Sync , not saved". Write the hidden text without punctuation ("not saved"), and put the name and the hidden text in the same inline `span`.
- **A state matrix repeats the component, and axe fails on repeated landmarks.** A matrix of `TitleBar` or `ActivityBar` triggers `landmark-unique` and `landmark-no-duplicate-banner`. Turn those rules off in that one story's `parameters.a11y.config.rules` and write the exception on the component page.
- **A scrollable region must be focusable (`scrollable-region-focusable`).** The slot of `SidePanel` and the main area of `AppShell` have `tabIndex={0}`; a slot whose content is already focusable (the note list) does not need it.
- **Without Tailwind preflight a `ul` keeps its bullets and padding.** Use `m-none list-none p-none` on lists in the shell.
- **Prettier on a folder reformats files you did not touch.** `prettier --write packages/ui/docs/screens` rewrote `MapOfStates.mdx`. Format only the files you changed, and check `git status` afterwards.
- **`pkill -f "storybook dev"` kills the shell that ran it** when the command line contains the same words. Kill by PID.
- **Curly braces in MDX prose are JavaScript.** `"Close {name}"` outside a code span builds, then fails when the page renders; `{note name}` fails the build. Put placeholders in backticks, and open the changed docs pages in a browser, because the build does not catch a runtime `ReferenceError`.
