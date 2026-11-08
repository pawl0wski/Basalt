---
date: 2026-11-08
slug: typed-i18n-keys
type: lesson
status: active
tags: [i18n, typescript, react, app]
---

# Typed i18n keys (Phase 2a step 5)

## Setup

- `basalt-app/packages/app/src/i18n/locales/en.json` is the single resource file; `i18n/i18next.d.ts` augments `CustomTypeOptions` with `defaultNS: "translation"` and `resources: { translation: typeof en }`, so `t("...")` only accepts keys that exist in the JSON.
- `initI18n()` (global i18next instance, `lng`/`fallbackLng` `en`, static resources, `{name}` interpolation to match spec texts, `escapeValue: false` because React escapes) is awaited in `main.tsx` before rendering.
- `errors.<AppErrorCode>` has one entry per `APP_ERROR_CODES` value; a test compares the key set with core's list in both directions.
- Presentational components (`WelcomeScreen`) take typed text props; only containers (`WelcomeScreenContainer`) call `useTranslation`.

## Verified

- Changing `t("welcome.brand")` to `t("welcome.brandX")` makes `npm run typecheck` fail with TS2345 in `WelcomeScreenContainer.tsx`; reverted afterwards.

## Gotchas

- Keys built from template literals (`welcome.principles.${id}.title`) are still checked, as long as `id` is a literal union.
- Component tests need `import "@testing-library/jest-dom/vitest"`; it is not in the shared `setupTests.ts`.
