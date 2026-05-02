# Row Level Security Policies

All tables have RLS enabled. `items` additionally has `FORCE ROW LEVEL SECURITY` (applies even to table owner).

The admin gate is always `fn_is_admin()` — a SQL STABLE function that checks `admin_users`. Never replicate this check manually.

---

## `admin_users`

| Policy | Op | Condition |
|--------|----|-----------|
| `admin_users_read_own_row` | SELECT | `user_id = auth.uid()` |

Admins can only read their own row. Writes are service-role only (no user-facing INSERT policy).

---

## `profiles`

| Policy | Op | Condition |
|--------|----|-----------|
| `allow_admin_or_own_profile` | SELECT | `fn_is_admin() OR id = auth.uid()` |
| `update own profile` | UPDATE | `id = auth.uid()` (USING + WITH CHECK) |

Admins can read any profile. No user can write another user's profile.

---

## `restaurants`

| Policy | Op | Condition |
|--------|----|-----------|
| `restaurants_select_consolidated` | SELECT | `fn_is_admin() OR owner_id = auth.uid()` |
| `owner can update own restaurant` | UPDATE | `owner_id = auth.uid()` |
| `employees_read_assigned_restaurants` | SELECT | `EXISTS (employee_restaurant_relation WHERE employee_id = auth.uid() AND restaurant_id = restaurants.id)` |

Three separate SELECT policies — Postgres evaluates them with OR semantics (any match grants access).

---

## `items`

| Policy | Op | Condition |
|--------|----|-----------|
| `authenticated_select_items_consolidated` | SELECT | `true` (all authenticated users) |
| `admin insert items` | INSERT | `fn_is_admin()` |
| `admin update items` | UPDATE | `fn_is_admin()` |
| `admin delete items` | DELETE | `fn_is_admin()` |

All authenticated users can read items. Only admins can write.

---

## `orders`

| Policy | Op | Condition |
|--------|----|-----------|
| `authenticated_select_orders_consolidated` | SELECT | `fn_is_admin() OR created_by = auth.uid() OR EXISTS (employee_restaurant_relation WHERE employee_id = auth.uid() AND restaurant_id = orders.restaurant_id)` |
| `orders_buyer_insert` | INSERT | `created_by = auth.uid()` |
| `authenticated_update_orders_consolidated` | UPDATE | `fn_is_admin() OR created_by = auth.uid() OR EXISTS (employee_restaurant_relation)` |

Buyers see/update their own orders. Employees see/update orders for their assigned restaurants. Admins have full access.

---

## `order_items`

| Policy | Op | Condition |
|--------|----|-----------|
| `select_order_items_consolidated` | SELECT | `fn_is_admin() OR EXISTS (orders WHERE id = order_items.order_id AND created_by = auth.uid()) OR EXISTS (orders + employee_restaurant_relation join)` |
| `order_items_buyer_insert` | INSERT | `EXISTS (orders WHERE id = order_items.order_id AND created_by = auth.uid())` |
| `order_items_buyer_update` | UPDATE | `EXISTS (orders WHERE id = order_items.order_id AND created_by = auth.uid())` |
| `order_items_buyer_delete` | DELETE | `EXISTS (orders WHERE id = order_items.order_id AND created_by = auth.uid())` |

Write access is buyer-only (the owner of the parent order). Read access extends to employees on that restaurant.

---

## `carts` / `cart_items`

All operations (SELECT/INSERT/UPDATE/DELETE) are scoped to the current user's own data.

| Table | Condition |
|-------|-----------|
| `carts` | `profile_id = auth.uid()` |
| `cart_items` | `EXISTS (carts WHERE id = cart_items.cart_id AND profile_id = auth.uid())` |

---

## `employee_restaurant_relation`

| Policy | Op | Condition |
|--------|----|-----------|
| `employees_read_own_assignments` | SELECT | `employee_id = auth.uid()` |
| `Admin View Employee Restaurant Relations` | ALL | `fn_is_admin()` |

Employees can only read (not write) their own assignments. Only admins can manage the relation.

---

## `favorite_items`

| Policy | Op | Condition |
|--------|----|-----------|
| `favorite_items_select_own` | SELECT | `user_id = auth.uid()` |
| `favorite_items_insert_own` | INSERT | `user_id = auth.uid()` |
| `favorite_items_delete_own` | DELETE | `user_id = auth.uid()` |

---

## `pricing_batches` / `pricing_batch_item_prices`

| Policy | Condition |
|--------|-----------|
| `pricing_batches_admin_write` | `fn_is_admin()` (all ops, USING + WITH CHECK) |
| `pricing_batch_item_prices_admin_write` | `fn_is_admin()` (all ops, USING + WITH CHECK) |

Admins only. These tables have no public read policy — reads go through RPCs that use SECURITY DEFINER.
