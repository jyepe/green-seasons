# Green Seasons

A React Native app for restaurant produce ordering. Local restaurants browse and order fresh produce from Green Seasons; an admin team manages inventory, pricing, and fulfillment; employees handle truck loads and deliveries.

## Roles

| Role | App section | Key screens |
|------|-------------|-------------|
| Restaurant owner | `(tabs)/` | Dashboard, product catalog, cart, checkout, order history, favorites |
| Admin | `admin/` | Analytics, items, pricing, orders by day, restaurants, employees, KPI charts |
| Employee | `employee/` | Orders queue, truck load summary, profile |

## Stack

- **React Native + Expo** (New Architecture enabled)
- **Expo Router** — file-based routing, separate stacks per role
- **Supabase** — Postgres database, RLS, RPCs, Auth (magic link), Edge Functions
- **TanStack Query** — server state with per-feature stale times
- **React Native Reanimated** — animations and transitions
- **TypeScript** — strict mode throughout

## Getting started

```bash
npm install
npm start        # Expo dev server
```

Requires a `.env.local` with:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Dev commands

| Command | Purpose |
|---------|---------|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run prettier:check` / `npm run prettier:fix` | Formatting |
| `npm run check-all` | Typecheck + lint + prettier |

## Project structure

```
app/
├── (tabs)/          # Restaurant owner: dashboard, catalog, cart, profile
├── admin/           # Admin: analytics, items, pricing, orders, staff
├── employee/        # Employee: orders, truck load
├── auth/            # Login, signup, magic-link callback, password reset
├── onboarding/      # New restaurant onboarding flow
├── order/[id].tsx   # Order detail (shared)
├── checkout.tsx     # Checkout (shared)
└── favorites.tsx    # Favorites (shared)

lib/
└── supabase.ts      # All Supabase client calls — single API surface

hooks/               # TanStack Query hooks by feature
components/          # UI organized by feature area (admin/, auth/, employee/, products/, ui/)
reducers/            # Form and screen state reducers
constants/           # Colors, routes, role definitions
docs/                # Supabase schema, RPC, RLS, hook, component, and route reference
```

See `CLAUDE.md` for architecture details, branching conventions, and CI/release workflow.
