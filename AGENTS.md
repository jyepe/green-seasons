# Repository Guidelines

> **Single source of truth for all agents and AI tools.** See also: `docs/` for Supabase reference docs, `.Jules/` for prior agent pass notes.

## Project Overview

**Green Seasons** is a React Native app for restaurant produce ordering. Local restaurants browse and order fresh produce; an admin team manages inventory, pricing, and fulfillment; employees handle truck loads and deliveries.

### Tech Stack

- **Framework:** React Native 0.81.5 with Expo 54
- **Routing:** Expo Router v6 (file-based routing in `app/`)
- **Language:** TypeScript (strict mode, New Architecture enabled)
- **Backend:** Supabase (PostgreSQL, Auth, RPC functions, Edge Functions)
- **State/Data Fetching:** TanStack Query (React Query)
- **UI/Styling:** `StyleSheet`, `react-native-reanimated`, `@expo/vector-icons` (Ionicons), `victory-native` for charts
- **Fonts:** Inter (Google Fonts)

## Architecture

### Three role-based app sections

Expo Router file-based routing in `app/` mounts entirely separate stacks per role from `app/_layout.tsx`:

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
- **Theming → React Context** (`hooks/useTheme.tsx`), with system colors in `constants/Colors.ts`. Supports light/dark modes. Root layout wires `NavigationThemeProvider` against these tokens and uses `expo-system-ui` to set the native root background to prevent white flashes during deep navigation.

### Auth and roles

- Supabase auth client uses `AsyncStorage` for session persistence (`lib/supabase.ts:23`). Email links use `Linking.createURL('auth/callback')` — see `app/auth/callback.tsx`.
- New-user signup flow uses **magic link**.
- Admin gate: `isAdmin()` calls the `fn_is_admin` RPC. Employee gate: `isEmployee()` inspects the user's role on `userInfo`.
- Anywhere you read `userInfo`, it comes from the `me` view (not raw `auth.users`); admin lookups for other users use the `profiles` table.

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `app/` | Screens and navigation structure (Expo Router) |
| `components/` | Reusable UI, organized by area (`admin/`, `auth/`, `employee/`, `products/`) plus `ui/` for primitives |
| `hooks/` | Custom React hooks (`useX.ts` format) |
| `reducers/` | Form and screen state reducers |
| `lib/` | Supabase client and shared utilities (`lib/utils/`) |
| `constants/` | Design tokens (Colors, Routes) |
| `config/` | Environment helpers |
| `assets/` | Images and fonts |
| `scripts/` | Maintenance utilities |
| `supabase/` | Migrations, RPC functions, and Edge Functions |
| `docs/` | Reference docs for the Supabase layer (see below) |
| `.Jules/` | Journal entries from prior agent passes — check when touching the same areas |

### Reference docs in `docs/`

- `docs/supabase-schema.md` — all tables, columns, enums, views, triggers, cascade behavior
- `docs/supabase-rpc.md` — every Postgres function/RPC with params and return shapes
- `docs/supabase-rls.md` — all RLS policies by table
- `docs/supabase-client.md` — TypeScript types and the full `lib/supabase.ts` API surface
- `docs/hooks.md` — every custom hook: query keys, staleTime, what it calls, mutation invalidation patterns
- `docs/components.md` — all components by folder with purpose and key props
- `docs/routes.md` — every screen file, its role access, and all reducer state shapes

Read the relevant doc before making non-trivial changes to those areas.

## Commands

| Command | Purpose |
|---------|---------|
| `npm start` / `npm run android` / `npm run ios` / `npm run web` | Expo dev server / platform launchers |
| `npm run typecheck` | `tsc --noEmit` (strict mode) |
| `npm run lint` / `npm run lint:fix` | ESLint (Expo flat config) |
| `npm run prettier:check` / `npm run prettier:fix` | Formatting |
| `npm run check-all` | Typecheck + lint + prettier — run before claiming work is done |
| `npm run reset-project` | Wipes generated Expo state (`scripts/reset-project.js`) |

There is **no test runner configured**. Treat `npm run check-all` as the verification gate. If you add tests, add a script and standardize on `*.test.ts(x)`.

## CI & Release

GitHub Actions (`.github/workflows/dev.yml`, `main.yml`) trigger EAS builds **only on tag push**. Tag intentionally:

- `dev-*`, `v*-dev*`, `v*-rc-dev*` → `eas build --profile development --platform android`
- `preview-*`, `v*-preview*`, `v*-rc*` → `eas build --profile preview --platform all`
- `prod-*`, `v*-prod*` → `eas build --profile production --platform all`

`eas.json` defines `development` / `preview` / `production` profiles (`appVersionSource: remote`).

## Development Workflow

Never commit directly to `preview` or `master`. Before starting any fix or feature:

1. Ensure you are on `preview` and it is up to date with `origin/preview`
2. Create a new branch: `feature/<short-description>` or `fix/<short-description>`
3. Make all changes on that branch
4. When done, push the branch to `origin` and open a PR to merge into `preview`

## Privacy Review

Whenever a change introduces or alters data collection, transmission, storage, or sharing — new fields/tables, new logging, new third-party integrations, new analytics, anything that touches user data — review `PRIVACY.md` and update it in the same change set so the policy keeps matching the app's actual behavior.

## Coding Style & Naming Conventions

- **Path alias `@/*`** maps to repo root (`tsconfig.json`). Use it (`@/lib/supabase`, `@/hooks/useCart`, `@/constants/Colors`).
- **File naming:** components `PascalCase.tsx`, hooks `useThing.ts`, reducers `camelCaseReducer.ts`, route files in `app/` use **kebab-case** (e.g. `orders-by-day.tsx`).
- **Components are organized by feature area** (`components/admin`, `auth`, `employee`, `products`) plus `ui/` for primitives (`IconSymbol`, `TabBarBackground`, `Toast`, `GradientText`). Shared cross-feature components sit at the root of `components/`.
- **Prettier is the formatting source of truth** (single quotes, semicolons, 2-space, 80-col, `arrowParens: avoid`). Don't hand-format against it.
- **Lint quirks:** `no-console` is a warning — prefer guarding logs with `if (__DEV__)` or remove before commit. `no-debugger` is an error. `prefer-const` and `no-var` enforced.
- **TypeScript strict mode is on.** New Architecture enabled (`app.json: newArchEnabled: true`), typed routes experimental-on (`experiments.typedRoutes`).
- **Fail fast in dev, degrade gracefully in prod** — match the pattern in `lib/supabase.ts` (warn-and-continue on missing env in non-`__DEV__`).

## Testing Guidelines

No dedicated test runner is configured. Treat `npm run check-all` as the required verification gate. If you add tests, standardize on `*.test.ts(x)` or `__tests__/` and add matching npm scripts.

## Commit & PR Guidelines

- Use conventional prefixes: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
- Keep commits focused; update UI assets with related code changes.
- PRs should include a summary, testing notes, and screenshots or recordings for UI updates.
- Link related issues and call out any new env vars or migrations.

## Environment & Security

- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are required at startup. Loaded via `lib/env.ts`. Use `.env.local` for dev; `app.json` has placeholders under `expo.extra` for EAS builds.
- `lib/supabase.ts` warns (not throws) if env vars are missing, to avoid splash crashes in prod builds.
- Do not commit real keys.
