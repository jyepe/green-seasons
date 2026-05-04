# Client-Side Error Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture client-side crashes, unhandled rejections, and failed queries/mutations in a Supabase `client_errors` table with no third-party dependency.

**Architecture:** A thin `lib/logger.ts` module writes error rows to Supabase. Three wiring points in `app/_layout.tsx` (React error boundary, global JS error handler, QueryClient cache hooks) catch errors automatically — no manual instrumentation required at call sites. The logger is silent in dev and swallows its own failures in prod to prevent error loops.

**Tech Stack:** React Native / Expo 54, Expo Router 6, TanStack Query v5, Supabase JS v2, TypeScript strict mode. No test runner — `npm run check-all` (typecheck + lint + prettier) is the verification gate.

---

## Before You Start

This repo requires all work on a dedicated branch. From `preview`:

```bash
git checkout preview
git checkout -b feature/client-side-logging
```

---

## File Map

| File | Action |
|---|---|
| `supabase/migrations/20260504000000_create_client_errors.sql` | Create — table + RLS |
| `lib/logger.ts` | Create — `logError` + `ErrorContext` type |
| `components/AppErrorBoundary.tsx` | Create — React error boundary + fallback UI |
| `app/_layout.tsx` | Modify — add imports, QueryCache/MutationCache, global handler, wrap with AppErrorBoundary |

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260504000000_create_client_errors.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260504000000_create_client_errors.sql` with this exact content:

```sql
create table public.client_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  user_role text,
  error_message text not null,
  error_stack text,
  context jsonb,
  platform text,
  app_version text
);

alter table public.client_errors enable row level security;

-- Authenticated users can insert their own errors
create policy "Authenticated users can insert own errors"
  on public.client_errors
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Anon role can insert pre-login crashes — user_id must be null
create policy "Anon users can insert errors without user_id"
  on public.client_errors
  for insert
  to anon
  with check (user_id is null);

-- Only admins can read errors
create policy "Admins can view all errors"
  on public.client_errors
  for select
  to authenticated
  using (public.fn_is_admin());
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applies cleanly, `client_errors` table visible in Supabase dashboard under Table Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260504000000_create_client_errors.sql
git commit -m "feat(db): add client_errors table with RLS"
```

---

### Task 2: Logger Module

**Files:**
- Create: `lib/logger.ts`

- [ ] **Step 1: Create `lib/logger.ts`**

```typescript
import Constants from 'expo-constants'
import { Platform } from 'react-native'

import { supabase } from '@/lib/supabase'

export type ErrorContext = {
  screen?: string
  action?: string
  userRole?: string
  isFatal?: boolean
  source?: 'global' | 'ErrorBoundary' | 'query' | 'mutation'
  [key: string]: unknown
}

export async function logError(
  error: unknown,
  context?: ErrorContext
): Promise<void> {
  if (__DEV__) {
    console.error('[logError]', error, context)
    return
  }

  try {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? (error.stack ?? null) : null

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('client_errors').insert({
      user_id: user?.id ?? null,
      user_role: context?.userRole ?? null,
      error_message: message,
      error_stack: stack,
      context: context ?? null,
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? null,
    })
  } catch {
    // intentionally silent — logger must never throw
  }
}
```

- [ ] **Step 2: Run check-all to verify no type errors**

```bash
npm run check-all
```

Expected: 0 errors, 0 warnings on the new file.

- [ ] **Step 3: Commit**

```bash
git add lib/logger.ts
git commit -m "feat(logger): add logError module writing to client_errors"
```

---

### Task 3: AppErrorBoundary Component

**Files:**
- Create: `components/AppErrorBoundary.tsx`

React error boundaries must be class components — hooks cannot implement `componentDidCatch`.

- [ ] **Step 1: Create `components/AppErrorBoundary.tsx`**

```tsx
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { logError } from '@/lib/logger'

type State = { hasError: boolean }

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(error, {
      source: 'ErrorBoundary',
      componentStack: info.componentStack ?? undefined,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>
            Something went wrong. Please restart the app.
          </Text>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
})
```

- [ ] **Step 2: Run check-all**

```bash
npm run check-all
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/AppErrorBoundary.tsx
git commit -m "feat(logger): add AppErrorBoundary component"
```

---

### Task 4: Wire Integration Points in `app/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

Three changes: (1) QueryClient gets `QueryCache`/`MutationCache` with `onError` callbacks, (2) a `useEffect` registers the global JS error handler, (3) the root return is wrapped in `AppErrorBoundary`.

- [ ] **Step 1: Update imports**

Replace the existing import block at the top of `app/_layout.tsx`. Add `MutationCache`, `QueryCache` to the TanStack import; add the three new local imports:

```typescript
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter'
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  Theme,
} from '@react-navigation/native'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SystemUI from 'expo-system-ui'
import { useEffect, useMemo } from 'react'
import { ThemeProvider, useAppColorScheme } from '@/hooks/useTheme'
import { Colors } from '@/constants/Colors'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { logError } from '@/lib/logger'
```

- [ ] **Step 2: Update QueryClient construction**

Replace the existing `queryClient` constant (lines 27–34 in the original file) with:

```typescript
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: error => logError(error, { source: 'query' }),
  }),
  mutationCache: new MutationCache({
    onError: error => logError(error, { source: 'mutation' }),
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
})
```

- [ ] **Step 3: Add global error handler useEffect and wrap return with AppErrorBoundary**

Replace the entire `RootLayout` function with:

```tsx
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  useEffect(() => {
    // ErrorUtils is a React Native global — catches unhandled JS errors and
    // fatal exceptions outside the React tree. On Hermes, unhandled promise
    // rejections surface through this same handler.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).ErrorUtils?.setGlobalHandler(
      (error: Error, isFatal: boolean) => {
        logError(error, { source: 'global', isFatal })
      }
    )
  }, [])

  if (!loaded) {
    return null
  }

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
```

- [ ] **Step 4: Run check-all**

```bash
npm run check-all
```

Expected: 0 errors. If the `global` cast triggers a lint warning, the inline cast above suppresses it without disabling the rule globally.

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(logger): wire ErrorBoundary, global handler, and QueryCache error hooks"
```

---

### Task 5: Final Verification + Branch Merge

- [ ] **Step 1: Run full check**

```bash
npm run check-all
```

Expected: clean pass across all four modified/created files.

- [ ] **Step 2: Confirm table exists in Supabase dashboard**

Open the Supabase project → Table Editor → verify `client_errors` table exists with all columns. Verify RLS is enabled (shield icon).

- [ ] **Step 3: Merge into preview**

```bash
git checkout preview
git merge feature/client-side-logging
```

Expected: fast-forward merge, no conflicts.
