# Client-Side Error Logging — Design Spec

**Date:** 2026-05-04  
**Status:** Approved

## Goal

Capture client-side errors (crashes, unhandled rejections, failed queries/mutations) in production and store them in Supabase for admin review. No third-party dependency. Errors only — no analytics or user-behavior tracking.

---

## Database Schema

Table: `client_errors`

| Column          | Type          | Constraints                                        |
| --------------- | ------------- | -------------------------------------------------- |
| `id`            | `uuid`        | PK, default `gen_random_uuid()`                    |
| `created_at`    | `timestamptz` | default `now()`                                    |
| `user_id`       | `uuid`        | nullable, FK → `auth.users`                        |
| `user_role`     | `text`        | nullable (`admin`, `employee`, `restaurant_owner`) |
| `error_message` | `text`        | not null                                           |
| `error_stack`   | `text`        | nullable                                           |
| `context`       | `jsonb`       | nullable                                           |
| `platform`      | `text`        | `ios` or `android`                                 |
| `app_version`   | `text`        | nullable                                           |

**RLS policies:**

- Authenticated users may `INSERT` rows where `user_id = auth.uid()`
- Anon role may `INSERT` rows where `user_id IS NULL` (pre-login crashes)
- `SELECT` restricted to users where `fn_is_admin()` returns true

**Migration:** `supabase/migrations/<timestamp>_create_client_errors.sql`

---

## `lib/logger.ts`

Single exported async function:

```typescript
logError(error: unknown, context?: ErrorContext): Promise<void>
```

`ErrorContext` shape (all optional):

```typescript
type ErrorContext = {
  screen?: string;
  action?: string;
  userRole?: string;
  isFatal?: boolean;
  source?: 'global' | 'ErrorBoundary' | 'query' | 'mutation';
  [key: string]: unknown;
};
```

**Behavior:**

- In `__DEV__`: calls `console.error` and returns — no network calls
- In production:
  1. Calls `supabase.auth.getUser()` to get `user_id` (null if unauthenticated)
  2. Inserts one row into `client_errors`
  3. The entire function body is wrapped in `try/catch` that swallows failures silently — the logger must never throw

**No class, no context provider, no React dependency.** Plain module import.

---

## Integration Points

### 1. `components/AppErrorBoundary.tsx` (new)

Class component wrapping the app root. `componentDidCatch` calls:

```typescript
logError(error, {
  source: 'ErrorBoundary',
  componentStack: info.componentStack,
});
```

Renders a minimal plain-text fallback (no theme dependency) when `hasError` is true.

### 2. Global JS error handler — `app/_layout.tsx`

`useEffect` on mount registers via React Native's `ErrorUtils`:

```typescript
ErrorUtils.setGlobalHandler((error, isFatal) => {
  logError(error, { source: 'global', isFatal });
});
```

Catches unhandled JS exceptions and fatal errors outside the React tree. On Hermes, unhandled promise rejections surface through this same handler — no separate listener needed.

### 3. QueryClient error hooks — `app/_layout.tsx`

The existing `QueryClient` construction adds `queryCache` and `mutationCache` instances with `onError` callbacks — the TanStack Query v5 API for global error handling (`defaultOptions.queries.onError` was removed in v5):

```typescript
new QueryClient({
  queryCache: new QueryCache({
    onError: error => logError(error, { source: 'query' }),
  }),
  mutationCache: new MutationCache({
    onError: error => logError(error, { source: 'mutation' }),
  }),
  defaultOptions: { ... } // unchanged
})
```

---

## File Summary

| File                                                | Change                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| `supabase/migrations/<ts>_create_client_errors.sql` | New — table + RLS                                                       |
| `lib/logger.ts`                                     | New — `logError` function                                               |
| `components/AppErrorBoundary.tsx`                   | New — error boundary + fallback UI                                      |
| `app/_layout.tsx`                                   | Modified — wire ErrorBoundary, global handler, QueryCache/MutationCache |

**`lib/supabase.ts` is not modified.** Errors thrown there bubble up to one of the three nets above.

---

## Out of Scope

- Analytics, navigation tracking, user behavior
- Performance monitoring
- Web platform (app targets iOS and Android only)
- Admin UI for viewing errors (use Supabase dashboard directly)
