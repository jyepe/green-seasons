# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Companion docs

`AGENTS.md` (repo style/structure conventions) and `GEMINI.md` (deeper architectural context — TanStack Query usage, role checks, theming) cover material that is not repeated here. Read both when starting non-trivial work. `.Jules/` contains short journal entries from prior agent passes (a11y patterns, layout DRY heuristics, reducer refactor notes) — useful when touching the same areas again.

## Commands

| Command                                                         | Purpose                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| `npm start` / `npm run android` / `npm run ios` / `npm run web` | Expo dev server / platform launchers                           |
| `npm run typecheck`                                             | `tsc --noEmit` (strict mode)                                   |
| `npm run lint` / `npm run lint:fix`                             | ESLint (Expo flat config)                                      |
| `npm run prettier:check` / `npm run prettier:fix`               | Formatting                                                     |
| `npm run check-all`                                             | Typecheck + lint + prettier — run before claiming work is done |
| `npm run reset-project`                                         | Wipes generated Expo state (`scripts/reset-project.js`)        |

There is **no test runner configured**. Treat `npm run check-all` as the verification gate. If you add tests, add a script and standardize on `*.test.ts(x)`.

## Release / CI

GitHub Actions (`.github/workflows/dev.yml`, `main.yml`) trigger EAS builds **only on tag push**. Tag intentionally:

- `dev-*`, `v*-dev*`, `v*-rc-dev*` → `eas build --profile development --platform android`
- `preview-*`, `v*-preview*`, `v*-rc*` → `eas build --profile preview --platform all`

`eas.json` defines `development` / `preview` / `production` profiles (`appVersionSource: remote`).

## Architecture

### Three role-based app sections

Expo Router file-based routing in `app/` mounts **entirely separate stacks per role** from `app/_layout.tsx`:

- `(tabs)/` — restaurant owner UI (dashboard, explore, cart, profile)
- `admin/` — admin dashboard (analytics, items, orders, employees, restaurants, KPI charts)
- `employee/` — employee UI (orders, truck load)
- `auth/`, `onboarding/` — pre-app flows
- `order/[id].tsx`, `favorites.tsx`, `orders.tsx`, `checkout.tsx`, `profile/edit.tsx` — shared modal-style screens

Role switching is done by navigating to one of `ROUTES.{ADMIN_DASHBOARD, EMPLOYEE_DASHBOARD, RESTAURANT_OWNER_DASHBOARD}` (`constants/Routes.ts`). User roles in `USER_ROLES`: `admin`, `employee`, `restaurant_owner`.

### Backend: `lib/supabase.ts` is the API surface

Single ~1500-line module that owns the Supabase client and **all** server interaction. Components/hooks should not import `@supabase/supabase-js` directly — go through the typed exports here (`getCartWithItems`, `createOrderFromCart`, `getAdminMonthKPIs`, `adminFinalizePricingForDay`, `getEmployeeTruckLoadSummary`, etc.).

**Significant business logic lives in Postgres RPCs**, not the client — order creation from cart, dashboard KPIs, truck-load summaries, pricing finalization, role checks (`fn_is_admin`). When adding a feature, check `supabase/migrations/` and `supabase/functions/` first; the right shape may be a new RPC, not client glue. Edge functions live under `supabase/functions/` (e.g. `delete-account`).

### State management

- **Server state → TanStack Query.** Query client is configured in `app/_layout.tsx` with `staleTime: 5min`, `gcTime: 10min` defaults. Per-feature hooks in `hooks/` override as needed.
- **Notable query-key conventions** (each hook owns its key as a constant):
  - `['admin-status']` — `staleTime: Infinity`, `gcTime: Infinity`, `retry: false`. Treated as static for the session. Login flows manually prime via `useSetAdminStatus`; logout clears via `useClearAdminStatus`. Don't refetch this — read `hooks/useAdmin.ts` before changing.
  - `['cart']` — `staleTime: 15s`. The 15s is **caching**, not polling. Use `useCartRefetchOnFocus` in screens that display cart data; mutations invalidate the key on success.
- **Local/UI state → reducers in `reducers/`.** Each file is a form or screen state reducer (`signupReducer`, `checkoutReducer`, `cartReducer`, `adminItemsReducer`, `truckLoadReducer`, `restaurantOnboardingReducer`, etc.) — not a global Redux store. When a screen has entangled `useState` calls or async submission state, lift them into a reducer here (see `.Jules/reducer-scout.md`).
- **Theming → React Context** (`hooks/useTheme.tsx`), with system colors in `constants/Colors.ts`. Root layout wires `NavigationThemeProvider` against these tokens and uses `expo-system-ui` to set the native root background to prevent white flashes during deep navigation.

### Auth and roles

- Supabase auth client uses `AsyncStorage` for session persistence (`lib/supabase.ts:23`). Email links use `Linking.createURL('auth/callback')` — see `app/auth/callback.tsx`.
- New-user signup flow uses **magic link** (recent change on `preview` branch — see commits `f9af9cb`, PR #143).
- Admin gate: `isAdmin()` calls the `fn_is_admin` RPC. Employee gate: `isEmployee()` inspects the user's role on `userInfo`.
- Anywhere you read `userInfo`, it comes from the `me` view (not raw `auth.users`); admin lookups for other users use the `profiles` table.

### Environment

Supabase env vars are required at startup:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Loaded via `config/env.ts`. `.env.local` for dev. `app.json` has placeholders under `expo.extra` for EAS builds. `lib/supabase.ts` warns (not throws) in dev if missing, to avoid splash crashes in prod builds.

## Conventions worth knowing

- **Path alias `@/*`** maps to repo root (`tsconfig.json`). Use it (`@/lib/supabase`, `@/hooks/useCart`, `@/constants/Colors`).
- **File naming:** components `PascalCase.tsx`, hooks `useThing.ts`, reducers `camelCaseReducer.ts`, route files in `app/` use **kebab-case** (e.g. `orders-by-day.tsx`).
- **Components are organized by feature area** (`components/admin`, `auth`, `employee`, `products`) plus `ui/` for primitives (`IconSymbol`, `TabBarBackground`, `Toast`, `GradientText`). Shared cross-feature components sit at the root of `components/`.
- **Lint quirks:** `no-console` is a warning — prefer guarding logs with `if (__DEV__)` or remove before commit. `no-debugger` is an error. `prefer-const` and `no-var` enforced.
- **Prettier is the formatting source of truth** (single quotes, semicolons, 2-space, 80-col, `arrowParens: avoid`). Don't hand-format against it.
- **TypeScript strict mode is on.** New Architecture is enabled (`app.json: newArchEnabled: true`) and typed routes are experimental-on (`experiments.typedRoutes`).
- **Fail fast in dev, degrade gracefully in prod** — match the pattern in `lib/supabase.ts` (warn-and-continue on missing env in non-`__DEV__`).
