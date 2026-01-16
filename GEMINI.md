# Green Seasons Project Context

## Project Overview

**Green Seasons** is a modern React Native application built with Expo for local restaurants to order fresh produce. It features a complete ordering system, employee management, and an admin dashboard.

### Tech Stack

- **Framework:** React Native 0.81.5 with Expo 54
- **Routing:** Expo Router v6 (File-based routing in `app/`)
- **Language:** TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, RPC functions)
- **State/Data Fetching:** TanStack Query (React Query)
- **UI/Styling:**
  - `StyleSheet` for styling
  - `react-native-reanimated` for animations
  - `@expo/vector-icons` (Ionicons)
  - `victory-native` for charts
- **Fonts:** Inter (Google Fonts)

## Architecture & Core Concepts

### 1. Navigation Structure (`app/`)

The app uses Expo Router's file-based routing:

- **`_layout.tsx`**: Root provider setup (QueryClient, ThemeProvider, SafeArea).
- **`auth/`**: Authentication flow (Login, Signup, Forgot Password).
- **`(tabs)/`**: Main restaurant user interface (Dashboard, Explore, Cart, Profile).
- **`admin/`**: Admin dashboard (Analytics, Item Management, Orders).
- **`employee/`**: Employee interface (Orders, Truck Load).
- **`onboarding/`**: Initial setup flows.

### 2. Backend Integration (`lib/supabase.ts`)

- **Supabase Client:** Initialized with `AsyncStorage` for auth persistence.
- **Data Access:** All database interactions (queries, RPC calls) are encapsulated in `lib/supabase.ts`.
- **Logic:** Significant business logic (e.g., creating orders from cart, dashboard KPIs) is handled via Postgres functions (RPCs) rather than client-side logic.
- **Environment Variables:** Managed via `config/env.ts`.

### 3. State Management

- **Server State:** Handled by `TanStack Query`.
  - **Cart Logic:** `hooks/useCart.ts` uses a `staleTime` of 15 seconds. This is **not** a polling interval. It means data is cached for 15 seconds. If a component requests data within that window, the cached version is served without a network request. Refetches occur on window focus (via `useCartRefetchOnFocus`) or when data is explicitly invalidated (e.g., after adding an item).
- **Local State:** React `useState` and Context API for theming (`hooks/useTheme.tsx`).

### 4. Authorization & Roles

- **Admin Status:**
  - **Source of Truth:** Database RPC function `fn_is_admin`.
  - **State Tracking:** Managed via TanStack Query key `['admin-status']` in `hooks/useAdmin.ts`.
  - **Mechanism:** The `useAdmin` hook fetches status with `staleTime: Infinity` (effectively static for the session). Login flows manually prime this cache using `useSetAdminStatus`.
- **Employee Status:**
  - Checked via `isEmployee()` in `lib/supabase.ts` which inspects the user's role in the `userInfo` object.

### 5. Design System

- **Theming:** Supports Light/Dark modes.
- **Colors:** Defined in `constants/Colors.ts`.
- **Components:** Reusable UI components located in `components/`, organized by feature (e.g., `admin/`, `auth/`, `products/`) or utility (`ui/`).

## Key Directories

| Directory     | Purpose                                            |
| ------------- | -------------------------------------------------- |
| `app/`        | Screens and navigation structure (Expo Router).    |
| `components/` | Reusable UI components (Atomic design-ish).        |
| `constants/`  | Configuration constants (Colors, Routes).          |
| `hooks/`      | Custom React hooks (e.g., `useCart`, `useOrders`). |
| `lib/`        | External library configs (Supabase client).        |
| `scripts/`    | Utility scripts (e.g., project reset).             |
| `assets/`     | Static assets (Fonts, Images).                     |

## Development Conventions

- **Type Safety:** Strict TypeScript usage.
- **Linting:** ESLint with Expo config. `no-console` is warned against; use debuggers or remove logs before commit.
- **Formatting:** Prettier is enforced.
- **Imports:** Use absolute imports with `@/` alias (e.g., `import { Colors } from '@/constants/Colors'`).
- **Error Handling:** Fail fast in dev, degrade gracefully in prod.
- **Naming:** PascalCase for components, camelCase for functions/vars.

## Common Commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm start`         | Start the Expo development server.       |
| `npm run android`   | Run on Android emulator/device.          |
| `npm run ios`       | Run on iOS simulator/device.             |
| `npm run lint`      | Run ESLint.                              |
| `npm run typecheck` | Run TypeScript compiler check.           |
| `npm run check-all` | Run typecheck, lint, and prettier check. |
