# Supabase Client API (`lib/supabase.ts`)

This is the **only** file that should import from `@supabase/supabase-js`. All components and hooks go through these exports.

For the underlying Postgres tables and RPC signatures, see `docs/supabase-schema.md` and `docs/supabase-rpc.md`.

---

## Types

```ts
type UserInfo = {
  id: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: 'restaurant_owner' | 'employee' | 'admin'
  owned_restaurant_id?: string
}

type Restaurant = {
  id: string; name: string; owner_id: string
  address_line1: string; address_line2: string
  city: string; postal_code: string; country: string
  created_at: string; updated_at: string
}

type Item = {
  id: string; name: string; description: string | null
  price: number; unit: string; image_url: string | null
  is_favorite: boolean
}

type CartItem = {
  cart_id: string; cart_created_at: string; cart_updated_at: string
  item_row_id: string; item_id: string; item_name: string
  item_price: number; quantity: number; line_subtotal: number
}

type OrderStatus = 'pending' | 'in_transit' | 'delivered'

type Order = {
  id: string; restaurant_id: string; status: OrderStatus
  created_at: string; updated_at: string
  delivery_at?: string; total_amount: number; final_total_amount?: number
}

type OrderDetailItem = {
  order_id: string; order_status: string
  placed_at: string; delivery_at: string
  customer_id: string; subtotal: number; total: number
  final_subtotal: number; final_total: number
  restaurant: Restaurant
  item_id: string; item_name: string; item_image_url: string
  quantity: number; unit_price: number; final_unit_price: number
  line_total: number; final_line_total: number
}

type AdminMonthKPIs = {
  orders_count: number
  total_revenue: number
  final_total_revenue?: number
}

type AdminOrder = {
  order_id: string; status: OrderStatus
  created_at: string; delivery_at?: string
  restaurant_id: string; restaurant_name: string
  created_by: string; buyer_first_name?: string; buyer_last_name?: string
  total_amount: number; final_total_amount: number; items_count: number
}

type AdminOrdersResult = { orders: AdminOrder[]; nextCursor: { created_at: string; id: string } | null }

type EmployeeTruckLoadRestaurant = { restaurant_id: string; restaurant_name: string; quantity: number }

type EmployeeTruckLoadItem = {
  item_id: string; item_name: string; item_image_url?: string
  total_quantity: number; restaurants: EmployeeTruckLoadRestaurant[]
}
```

---

## Auth

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `signUpUser` | `{ email, password, firstName?, lastName?, phone? }` | auth response | Magic-link flow on `preview` branch |
| `signInUser` | `{ email, password }` | auth session | |
| `signOutUser` | — | void | |
| `getCurrentUserInfo` | — | `UserInfo \| null` | Calls `auth.getUser()` + `me` view |
| `getUserInfoById` | `userId: string` | `UserInfo \| null` | Admin only; queries `profiles` |
| `updateUserPassword` | `password: string` | void | |
| `updateUserEmail` | `email: string` | void | |
| `updateUserProfile` | `{ first_name?, last_name?, phone? }` | profile | Updates `profiles` |
| `updateUserInfo` | `{ email?, first_name?, last_name?, phone? }` | profile | Combines email + profile update |
| `resetPassword` | `{ email }` | void | |
| `deleteAccount` | — | void | Calls edge function `delete-account` |

---

## Restaurants

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `createRestaurant` | `{ name, address_line1, address_line2?, city, postal_code, country? }` | `Restaurant` | RPC: `create_my_restaurant` |
| `getRestaurantById` | `restaurantId: string` | `Restaurant \| null` | |
| `getAllRestaurants` | — | `Restaurant[]` | Admin only |
| `getEmployeesAndRestaurants` | — | `EmployeesAndRestaurants` | Joins profiles + restaurants + employee_restaurant_relation |
| `assignRestaurantToEmployee` | `employeeId, restaurantId` | void | Inserts into `employee_restaurant_relation` |

`EmployeesAndRestaurants`: `{ employees, restaurants, employeeRestaurantNames, employeeRestaurantIds }`

---

## Items

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `getItems` | — | `Item[]` | Via `v_items_with_favorite` (includes `is_favorite`) |
| `getFavoriteItems` | — | `Item[]` | Filters `is_favorite = true` |
| `toggleFavorite` | `itemId, currentlyFavorite` | `boolean` | RPC: `fn_add_favorite_item` or `fn_remove_favorite_item` |
| `getAllItemsForAdmin` | — | `Item[]` | Queries `items` table directly |
| `createItem` | `{ name, description?, price, unit, image_url? }` | `Item` | Admin only |
| `updateItem` | `itemId, { name?, description?, price?, unit?, image_url? }` | `Item` | Admin only |
| `deleteItem` | `itemId` | void | Admin only |

---

## Cart

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `getCartWithItems` | — | `CartItem[]` | RPC: `fn_get_cart_with_items` |
| `addToCart` | `{ itemId, quantityDelta? }` | `cart_item \| null` | RPC: `fn_add_to_cart`; delta < 0 reduces; result ≤ 0 deletes |
| `clearCart` | — | void | RPC: `fn_clear_cart` |

---

## Orders

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `createOrderFromCart` | `restaurantId, deliveryAt: Date, paymentMethod` | `CreateOrderFromCartResult` | RPC: `fn_create_order_from_cart` |
| `getOrderDetails` | `orderId: string` | `OrderDetailItem[]` | RPC: `fn_get_order_details` |
| `getOrdersForUser` | `userId: string` | `Order[]` | Queries `orders` table |
| `updateOrderStatus` | `orderId, status: OrderStatus` | void | |
| `updateOrderDeliveryDate` | `orderId, deliveryDate: Date` | void | |

---

## Admin Dashboard

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `isAdmin` | — | `boolean` | RPC: `fn_is_admin` |
| `getAdminMonthKPIs` | `monthStart, monthEnd: Date` | `AdminMonthKPIs` | RPC: `fn_admin_dashboard_month_kpis` |
| `getAdminTopItems` | `monthStart, monthEnd, limit?` | `AdminTopItem[]` | RPC: `fn_admin_dashboard_top_items` |
| `getAdminOrders` | `from, to, limit?, cursor?, restaurantId?, status?` | `AdminOrdersResult` | RPC: `fn_admin_list_orders`; cursor: `{ created_at, id }` |
| `getAdminChartOrdersByDay` | `from, to, limit?` | `AdminChartOrdersByDay[]` | RPC: `fn_admin_chart_orders_by_day` |
| `getAdminChartRevenueByDay` | `from, to, limit?` | `AdminChartRevenueByDay[]` | RPC: `fn_admin_chart_revenue_by_day` |
| `getAdminChartRevenueByRestaurant` | `from, to, limit` | `AdminChartRevenueByRestaurant[]` | RPC: `fn_admin_chart_revenue_by_restaurant` |
| `adminFinalizePricingForDay` | `deliveryDay: Date, prices: { item_id, final_unit_price }[]` | void | RPC: `fn_admin_finalize_pricing_for_day`; throws if any item is missing a price |
| `getAdminTruckLoadSummary` | `deliveryDate?: Date, tz?` | `AdminTruckLoadItem[]` | RPC: `fn_admin_truck_load_summary` |

---

## Employee

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `isEmployee` | — | `boolean` | Checks `getCurrentUserInfo().role === 'employee'` |
| `getEmployeeOrders` | `limit?, cursor?` | `EmployeeOrdersResult` | RPC: `fn_employee_list_orders`; cursor: `{ created_at, id }` |
| `getEmployeeTruckLoadSummary` | `deliveryDate?: Date, tz?` | `EmployeeTruckLoadItem[]` | RPC: `fn_employee_truck_load_summary`; parses `restaurants` JSONB array |

---

## Edge Functions

### `delete-account` (POST)
Called by `deleteAccount()`. Validates auth header, then uses service role to delete the user from `auth.users`. All dependent data is removed via FK cascades. Returns `{ ok: true }`.
