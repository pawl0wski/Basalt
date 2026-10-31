---
date: 2026-10-30
slug: run-app-e2e-after-shared-component-change
type: lesson
status: active
tags: [design-system, e2e, regression, process]
---

# Run the app e2e after changing a shared component

Stage 2 rewrote `Button` in `@basalt/ui` on token classes (`bg-action-primary`). `packages/app` still has its own shadcn CSS variables and does not generate those classes, so the welcome page button lost its background and `e2e/welcome.spec.ts` "applies the stylesheet" fails. The unit tests, Storybook tests, lint and typecheck were all green; the regression only showed when `npm run test:e2e` was finally run in Stage 5.

Rule: whenever a component exported from `@basalt/ui` changes, run `npm run test:e2e` (and look at the app) before calling the batch done, not only the Storybook checks. A decision to "leave the app untouched" and "rewrite the shared Button" cannot both hold; raise the conflict when the rewrite starts.

Resolution: the owner approved rewriting the app welcome page on the design system (`@basalt/ui/styles.css` imported in `packages/app/src/index.css`). Added an e2e test that compares the main button background with `--bs-action-primary`, which would have caught this regression.
