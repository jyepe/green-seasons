# Hooks Reference

All hooks live in `hooks/`. Server state uses TanStack Query — default `staleTime: 5min`, `gcTime: 10min` unless noted below.

---

## Query Hooks

| Hook                  | File                  | Query Key                                   | staleTime    | gcTime       | Calls                             |
| --------------------- | --------------------- | ------------------------------------------- | ------------ | ------------ | --------------------------------- |
| `useAdmin`            | `useAdmin.ts`         | `['admin-status']`                          | **Infinity** | **Infinity** | `isAdmin()`                       |
| `useEmployee`         | `useEmployee.ts`      | `['employee-status']`                       | 5 min        | 10 min       | `isEmployee()`                    |
| `useUserInfo`         | `useUserInfo.ts`      | `['userInfo']`                              | 5 min        | 10 min       | `getCurrentUserInfo()`            |
| `useItems`            | `useItems.ts`         | `['items']`                                 | 5 min        | 10 min       | `getItems()`                      |
| `useAdminItems`       | `useAdminItems.ts`    | `['admin-items']`                           | **30s**      | **5 min**    | `getAllItemsForAdmin()`           |
| `useFavoriteItems`    | `useFavorite.ts`      | `['favoriteItems']`                         | 5 min        | 10 min       | `getFavoriteItems()`              |
| `useCart`             | `useCart.ts`          | `['cart']`                                  | **15s**      | **5 min**    | `getCartWithItems()`              |
| `useOrders`           | `useOrders.ts`        | `['orders', userId]`                        | 2 min        | 5 min        | `getOrdersForUser(userId)`        |
| `useOrderDetails`     | `useOrderDetails.ts`  | `['orderDetails', orderId]`                 | 5 min        | 10 min       | `getOrderDetails(orderId)`        |
| `useRestaurant`       | `useRestaurant.ts`    | `['restaurant', restaurantId]`              | 5 min        | 10 min       | `getRestaurantById(restaurantId)` |
| `useAnalyticsData<T>` | `useAnalyticsData.ts` | `[queryKey, dateRange.start.toISOString()]` | default      | default      | generic `queryFn` param           |

**Notes:**

- `useAdmin` — static for the session; login flows prime it via `useSetAdminStatus`, logout clears it via `useClearAdminStatus`. **Never refetch.**
- `useCart` — 15s is caching, not polling. Use `useCartRefetchOnFocus` on screens that show cart data.
- `useOrders`, `useOrderDetails`, `useRestaurant` — `enabled: false` when the ID param is undefined.
- `useUserInfo` — custom retry logic that fails fast on "not authenticated" errors.

---

## Mutation Hooks

| Hook                | File               | Invalidates                    | Calls                                       |
| ------------------- | ------------------ | ------------------------------ | ------------------------------------------- |
| `useCreateItem`     | `useAdminItems.ts` | `['admin-items']`, `['items']` | `createItem(params)`                        |
| `useUpdateItem`     | `useAdminItems.ts` | `['admin-items']`, `['items']` | `updateItem(itemId, params)`                |
| `useDeleteItem`     | `useAdminItems.ts` | `['admin-items']`, `['items']` | `deleteItem(itemId)`                        |
| `useToggleFavorite` | `useFavorite.ts`   | — (optimistic)                 | `toggleFavorite(itemId, isFav)`             |
| `useAddToCart`      | `useCart.ts`       | `['cart']`                     | `addToCart(params)`                         |
| `useClearCart`      | `useCart.ts`       | `['cart']`                     | `clearCart()`                               |
| `useCreateOrder`    | `useOrders.ts`     | `['cart']`, `['orders']`       | `createOrderFromCart(...)`                  |
| `useUpdateUserInfo` | `useUserInfo.ts`   | `['userInfo']`                 | `updateUserEmail()` + `updateUserProfile()` |

**Notes:**

- `useToggleFavorite` — full optimistic update pattern: snapshot `['items']` and `['favoriteItems']`, roll back on error, refetch both on settled.
- Item mutations invalidate both `['admin-items']` and `['items']` to keep both lists in sync.

---

## Cache Control Hooks

These manipulate the query cache directly — use them instead of triggering a network call where possible.

| Hook                     | File             | Purpose                                                      |
| ------------------------ | ---------------- | ------------------------------------------------------------ |
| `useSetAdminStatus`      | `useAdmin.ts`    | Prime `['admin-status']` after auth (login flow)             |
| `useClearAdminStatus`    | `useAdmin.ts`    | Remove `['admin-status']` (logout)                           |
| `useSetEmployeeStatus`   | `useEmployee.ts` | Prime `['employee-status']` after auth                       |
| `useClearEmployeeStatus` | `useEmployee.ts` | Remove `['employee-status']` (logout)                        |
| `useSetUserInfo`         | `useUserInfo.ts` | Prime `['userInfo']`                                         |
| `useClearUserInfo`       | `useUserInfo.ts` | Remove `['userInfo']`                                        |
| `useInvalidateUserInfo`  | `useUserInfo.ts` | Force refetch of `['userInfo']`                              |
| `useSignOut`             | `useUserInfo.ts` | Sign out + clear `['userInfo']` and `['admin-status']`       |
| `useDeleteAccount`       | `useUserInfo.ts` | Delete account + clear `['userInfo']` and `['admin-status']` |

---

## Focus-Refetch Hooks

Call these in screens that need fresh data when the user navigates back to them.

| Hook                     | File          | Invalidates |
| ------------------------ | ------------- | ----------- |
| `useItemsRefetchOnFocus` | `useItems.ts` | `['items']` |
| `useCartRefetchOnFocus`  | `useCart.ts`  | `['cart']`  |

---

## Theme / Color Hooks

| Hook                | File                | Returns                                                                                          |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `useTheme`          | `useTheme.tsx`      | `{ themeMode, effectiveTheme, setThemeMode(), isDark }` — throws if used outside `ThemeProvider` |
| `useAppColorScheme` | `useTheme.tsx`      | `'light' \| 'dark'` based on user pref + system                                                  |
| `useThemeColor`     | `useThemeColor.ts`  | Color value from palette for active theme; accepts optional per-theme overrides                  |
| `useColorScheme`    | `useColorScheme.ts` | Raw system color scheme; `.web.ts` variant adds SSR hydration check                              |

Theme preference is persisted to `AsyncStorage` with graceful fallback to `'system'`.

---

## Gesture / Animation Hooks

| Hook               | File                  | Returns                                                                                                     |
| ------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `useSwipeToDelete` | `useSwipeToDelete.ts` | `{ panGesture, animatedRowStyle, animatedDeleteStyle, sharedValues }` — powers swipe-to-delete in cart rows |
