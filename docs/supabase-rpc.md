# Postgres RPCs and Functions

All functions are in the `public` schema. Call them from the client via `supabase.rpc('fn_name', params)` or through the wrappers in `lib/supabase.ts`.

---

## Admin Role Check

### `fn_is_admin()` → boolean

SQL STABLE. Returns `true` if `auth.uid()` exists in `admin_users`. Used by RLS policies and other functions as the admin gate — never bypass it.

---

## Admin Dashboard RPCs

### `fn_admin_dashboard_month_kpis(p_month_start, p_month_end)` → row

Requires admin. Counts orders and sums revenue in date range.

| Param           | Type        |
| --------------- | ----------- |
| `p_month_start` | timestamptz |
| `p_month_end`   | timestamptz |

Returns: `{ orders_count bigint, total_revenue numeric, final_total_revenue numeric }`

---

### `fn_admin_dashboard_top_items(p_month_start, p_month_end, p_limit)` → rows

Requires admin. Top items by revenue. Pass `p_limit = -1` for all.

| Param           | Type        | Default |
| --------------- | ----------- | ------- |
| `p_month_start` | timestamptz | —       |
| `p_month_end`   | timestamptz | —       |
| `p_limit`       | int         | 5       |

Returns rows: `{ item_id, item_name, unit, quantity numeric, revenue, final_revenue }`

---

### `fn_admin_chart_orders_by_day(p_from, p_to, p_limit)` → rows

Requires admin. Daily order counts for charts. Pass `p_limit = -1` for all rows.

Returns rows: `{ day date, orders_count bigint }`

---

### `fn_admin_chart_revenue_by_day(p_from, p_to, p_limit)` → rows

Requires admin. Daily revenue.

Returns rows: `{ day date, revenue numeric, final_revenue numeric }`

---

### `fn_admin_chart_revenue_by_restaurant(p_from, p_to, p_limit)` → rows

Requires admin. Top restaurants by revenue. Pass `p_limit = -1` for all.

| Param     | Default |
| --------- | ------- |
| `p_limit` | 10      |

Returns rows: `{ restaurant_id, restaurant_name, orders_count bigint, revenue, final_revenue }`

---

### `fn_admin_list_orders(p_from, p_to, p_limit, p_cursor_created_at, p_cursor_id, p_restaurant_id, p_status)` → rows

Requires admin. Cursor-based (keyset) pagination, DESC by `(created_at, id)`. Pass `p_cursor_*` from the last row to page forward. All filter params are optional.

| Param                 | Type         | Default |
| --------------------- | ------------ | ------- |
| `p_from`              | timestamptz  | —       |
| `p_to`                | timestamptz  | —       |
| `p_limit`             | int          | 50      |
| `p_cursor_created_at` | timestamptz  | NULL    |
| `p_cursor_id`         | uuid         | NULL    |
| `p_restaurant_id`     | uuid         | NULL    |
| `p_status`            | order_status | NULL    |

Returns rows: `{ order_id, status, created_at, delivery_at, restaurant_id, restaurant_name, created_by, buyer_first_name, buyer_last_name, total_amount, final_total_amount, items_count bigint }`

---

### `fn_admin_truck_load_summary(p_delivery_date, p_tz)` → rows

Requires admin. Shows items and whether final prices have been set for a delivery day.

| Param             | Default              |
| ----------------- | -------------------- |
| `p_delivery_date` | today (NY)           |
| `p_tz`            | `'America/New_York'` |

Returns rows: `{ item_id, item_name, item_image_url, finalized boolean, finalized_amount numeric }`

---

### `fn_admin_finalize_pricing_for_day(p_delivery_day, p_prices)` → row

SECURITY DEFINER. Requires admin. Creates a `pricing_batches` record and applies final prices to all matching `order_items`. **All items on orders for that day must have a price in `p_prices` or the function raises an exception.**

| Param            | Type                                                          |
| ---------------- | ------------------------------------------------------------- |
| `p_delivery_day` | date                                                          |
| `p_prices`       | jsonb — array of `{ item_id uuid, final_unit_price numeric }` |

Returns: `{ batch_id uuid, orders_updated int, order_items_updated int, items_updated int }`

---

## Employee RPCs

### `fn_employee_list_orders(p_limit, p_cursor_created_at, p_cursor_id)` → rows

SQL STABLE. Returns cursor-paginated orders for restaurants assigned to the calling employee via `employee_restaurant_relation`.

| Param                 | Default |
| --------------------- | ------- |
| `p_limit`             | 25      |
| `p_cursor_created_at` | NULL    |
| `p_cursor_id`         | NULL    |

Returns rows: `{ id, total_amount, status text, delivery_at, created_at, restaurant_name }`

---

### `fn_employee_truck_load_summary(p_delivery_date, p_tz)` → rows

SQL STABLE. Aggregated item quantities for the employee's assigned restaurants on a delivery date.

| Param             | Default              |
| ----------------- | -------------------- |
| `p_delivery_date` | today (NY)           |
| `p_tz`            | `'America/New_York'` |

Returns rows: `{ item_id, item_name, item_image_url, total_quantity bigint, restaurants jsonb }`

`restaurants` is a JSON array: `[{ restaurant_id, restaurant_name, quantity }]`

---

## Cart RPCs

### `fn_get_or_create_cart()` → carts row

PLPGSQL. Gets the current user's cart or creates one. Handles concurrent insert conflicts safely.

---

### `fn_get_cart_with_items()` → rows

PLPGSQL. Returns all items in the current user's cart with per-item pricing.

Returns rows: `{ cart_id, cart_created_at, cart_updated_at, item_row_id, item_id, item_name, item_price, quantity int, line_subtotal }`

---

### `fn_add_to_cart(p_item_id, p_quantity_delta)` → cart_items row

PLPGSQL. Upserts a cart item. Positive delta adds, negative reduces, result ≤ 0 deletes.

| Param              | Default |
| ------------------ | ------- |
| `p_quantity_delta` | 1       |

---

### `fn_clear_cart()` → void

PLPGSQL. Deletes all cart_items and the cart for the current user.

---

### `fn_update_cart_item_quantity(p_cart_item_id, p_new_quantity)` → cart_items row

PLPGSQL. Sets exact quantity or deletes if ≤ 0. Validates the item belongs to the caller's cart.

---

## Order RPCs

### `fn_create_order_from_cart(p_restaurant_id, p_delivery_at, p_payment_method)` → row

PLPGSQL SECURITY DEFINER. Atomically creates an order from the current user's cart. Locks cart, validates non-empty, copies `cart_items` → `order_items` with current prices, clears cart.

| Param              | Type        |
| ------------------ | ----------- |
| `p_restaurant_id`  | uuid        |
| `p_delivery_at`    | timestamptz |
| `p_payment_method` | text        |

Returns: `{ id, status, restaurant_id, created_by, created_at, updated_at, total_amount }`

---

### `fn_get_order_details(p_order_id)` → rows

SQL SECURITY DEFINER. Returns one row per order item with embedded restaurant object and window-function subtotals.

Returns rows: `{ order_id, order_status, placed_at, delivery_at, customer_id, subtotal, total, final_subtotal, final_total, restaurant restaurants, item_id, item_name, item_image_url, quantity, unit_price, final_unit_price, line_total, final_line_total }`

---

## Favorites RPCs

### `fn_add_favorite_item(p_item_id uuid)` → void

ON CONFLICT DO NOTHING — safe to call repeatedly.

### `fn_remove_favorite_item(p_item_id uuid)` → void

---

## Restaurant RPCs

### `create_my_restaurant(p_name, p_address_line1, p_address_line2, p_city, p_postal_code, p_country)` → restaurants row

PLPGSQL SECURITY DEFINER. Creates restaurant and sets `profiles.owned_restaurant_id` for the calling user.

| Param             | Default |
| ----------------- | ------- |
| `p_address_line2` | `''`    |
| `p_city`          | `''`    |
| `p_postal_code`   | `''`    |
| `p_country`       | `'US'`  |

---

## Internal / Trigger Functions

These are called by triggers, not directly from the client.

| Function                        | Purpose                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `handle_new_user()`             | Creates `profiles` row on `auth.users` INSERT                                                   |
| `set_updated_at()`              | Sets `updated_at = now()` (cart_items, carts)                                                   |
| `tg_set_updated_at()`           | Sets `updated_at = now()` (order_items, orders, restaurants)                                    |
| `tg_profiles_set_updated_at()`  | Sets `updated_at = now()` (profiles)                                                            |
| `fn_order_items_rollup_apply()` | Maintains `orders.total_amount` and `orders.items_count` on INSERT/UPDATE/DELETE of order_items |
