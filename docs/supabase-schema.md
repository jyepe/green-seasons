# Database Schema

All tables live in the `public` schema unless noted. `auth.users` is Supabase-managed.

---

## Enums

| Enum           | Values                                  |
| -------------- | --------------------------------------- |
| `user_role`    | `restaurant_owner`, `employee`, `admin` |
| `order_status` | `pending`, `in_transit`, `delivered`    |
| `payment_type` | `cash`, `card`                          |

---

## Tables

### `profiles`

Maps 1:1 with `auth.users`. Created automatically by the `on_auth_user_created` trigger.

| Column                | Type          | Notes                                                           |
| --------------------- | ------------- | --------------------------------------------------------------- |
| `id`                  | uuid PK       | FK → auth.users ON DELETE CASCADE                               |
| `phone`               | text NOT NULL |                                                                 |
| `first_name`          | text NOT NULL |                                                                 |
| `last_name`           | text NOT NULL |                                                                 |
| `role`                | user_role     | DEFAULT `restaurant_owner`                                      |
| `owned_restaurant_id` | uuid nullable | FK → restaurants ON DELETE SET NULL; unique (partial, non-null) |
| `created_at`          | timestamptz   |                                                                 |
| `updated_at`          | timestamptz   | auto-updated by trigger                                         |

---

### `restaurants`

| Column          | Type          | Notes                              |
| --------------- | ------------- | ---------------------------------- |
| `id`            | uuid PK       |                                    |
| `name`          | text NOT NULL |                                    |
| `owner_id`      | uuid nullable | FK → auth.users ON DELETE RESTRICT |
| `address_line1` | text NOT NULL |                                    |
| `address_line2` | text NOT NULL | DEFAULT `''`                       |
| `city`          | text NOT NULL |                                    |
| `postal_code`   | text NOT NULL |                                    |
| `country`       | text NOT NULL | DEFAULT `'US'`                     |
| `created_at`    | timestamptz   |                                    |
| `updated_at`    | timestamptz   | auto-updated by trigger            |

---

### `items`

Product catalog. RLS: `FORCE ROW LEVEL SECURITY`.

| Column                    | Type                   | Notes                                         |
| ------------------------- | ---------------------- | --------------------------------------------- |
| `id`                      | uuid PK                |                                               |
| `name`                    | text NOT NULL          |                                               |
| `description`             | text nullable          |                                               |
| `price`                   | numeric(10,2) NOT NULL | CHECK >= 0; updated when pricing is finalized |
| `unit`                    | text NOT NULL          | e.g. "lb", "each"                             |
| `image_url`               | text nullable          |                                               |
| `last_finalized_price_at` | timestamptz nullable   | set by pricing finalization                   |
| `last_pricing_batch_id`   | uuid nullable          | FK → pricing_batches ON DELETE SET NULL       |
| `created_at`              | timestamptz            |                                               |
| `updated_at`              | timestamptz            | auto-updated by trigger                       |

---

### `orders`

`total_amount` and `items_count` are denormalized — maintained by the `trg_order_items_rollup` trigger, never set directly.

| Column                       | Type                   | Notes                                   |
| ---------------------------- | ---------------------- | --------------------------------------- |
| `id`                         | uuid PK                |                                         |
| `status`                     | order_status NOT NULL  | DEFAULT `pending`                       |
| `restaurant_id`              | uuid NOT NULL          | FK → restaurants ON DELETE RESTRICT     |
| `created_by`                 | uuid nullable          | FK → profiles ON DELETE SET NULL        |
| `delivery_at`                | timestamptz nullable   | delivery date/time                      |
| `total_amount`               | numeric(20,2) NOT NULL | DEFAULT 0; **trigger-maintained**       |
| `items_count`                | integer NOT NULL       | DEFAULT 0; **trigger-maintained**       |
| `final_total_amount`         | numeric(20,2) nullable | set by pricing finalization             |
| `pricing_finalized_at`       | timestamptz nullable   |                                         |
| `pricing_batch_id`           | uuid nullable          | FK → pricing_batches ON DELETE SET NULL |
| `payment_method`             | payment_type nullable  |                                         |
| `confirmation_email_sent_at` | timestamptz nullable   |                                         |
| `created_at`                 | timestamptz NOT NULL   |                                         |
| `updated_at`                 | timestamptz            | auto-updated by trigger                 |

---

### `order_items`

Item names, units, and image_url are denormalized at order time for historical accuracy.

| Column             | Type                   | Notes                                     |
| ------------------ | ---------------------- | ----------------------------------------- |
| `id`               | uuid PK                |                                           |
| `order_id`         | uuid NOT NULL          | FK → orders ON DELETE CASCADE             |
| `item_id`          | uuid NOT NULL          | FK → items ON DELETE RESTRICT             |
| `item_name`        | text NOT NULL          | **denormalized** from items at order time |
| `unit`             | text NOT NULL          | **denormalized** from items at order time |
| `image_url`        | text nullable          | **denormalized** from items at order time |
| `quantity`         | numeric(12,3) NOT NULL | CHECK > 0                                 |
| `unit_price`       | numeric(10,2) NOT NULL | CHECK >= 0; price at order time           |
| `final_unit_price` | numeric(10,2) nullable | set by pricing finalization               |
| `pricing_batch_id` | uuid nullable          | FK → pricing_batches ON DELETE SET NULL   |
| `created_at`       | timestamptz NOT NULL   |                                           |
| `updated_at`       | timestamptz            | auto-updated by trigger                   |

Unique constraint: `(order_id, item_id)`.

---

### `carts`

One cart per user (unique on `profile_id`).

| Column           | Type                 | Notes                                   |
| ---------------- | -------------------- | --------------------------------------- |
| `id`             | uuid PK              |                                         |
| `profile_id`     | uuid NOT NULL        | FK → profiles ON DELETE CASCADE; UNIQUE |
| `checked_out_at` | timestamptz nullable |                                         |
| `metadata`       | jsonb nullable       |                                         |
| `created_at`     | timestamptz NOT NULL |                                         |
| `updated_at`     | timestamptz          | auto-updated by trigger                 |

---

### `cart_items`

| Column       | Type                 | Notes                        |
| ------------ | -------------------- | ---------------------------- |
| `id`         | uuid PK              |                              |
| `cart_id`    | uuid NOT NULL        | FK → carts ON DELETE CASCADE |
| `item_id`    | uuid NOT NULL        | FK → items                   |
| `quantity`   | integer NOT NULL     | CHECK > 0                    |
| `created_at` | timestamptz NOT NULL |                              |
| `updated_at` | timestamptz          | auto-updated by trigger      |

Unique constraint: `(cart_id, item_id)`.

---

### `favorite_items`

| Column       | Type                 | Notes                             |
| ------------ | -------------------- | --------------------------------- |
| `user_id`    | uuid                 | FK → auth.users ON DELETE CASCADE |
| `item_id`    | uuid                 | FK → items ON DELETE CASCADE      |
| `created_at` | timestamptz NOT NULL |                                   |

PK: `(user_id, item_id)`.

---

### `employee_restaurant_relation`

| Column          | Type                 | Notes                           |
| --------------- | -------------------- | ------------------------------- |
| `id`            | uuid PK              |                                 |
| `employee_id`   | uuid NOT NULL        | FK → profiles ON DELETE CASCADE |
| `restaurant_id` | uuid NOT NULL        | FK → restaurants                |
| `created_at`    | timestamptz NOT NULL |                                 |

---

### `admin_users`

Allowlist of application admins. Rows inserted manually or via service role.

| Column       | Type                 | Notes                              |
| ------------ | -------------------- | ---------------------------------- |
| `user_id`    | uuid PK              | FK → auth.users ON DELETE CASCADE  |
| `created_at` | timestamptz NOT NULL |                                    |
| `created_by` | uuid nullable        | FK → auth.users ON DELETE SET NULL |

---

### `pricing_batches`

Immutable record of a pricing finalization event for a delivery day.

| Column         | Type                 | Notes                            |
| -------------- | -------------------- | -------------------------------- |
| `id`           | uuid PK              |                                  |
| `delivery_day` | date NOT NULL        |                                  |
| `status`       | text NOT NULL        | DEFAULT/CHECK `'finalized'`      |
| `finalized_at` | timestamptz NOT NULL |                                  |
| `finalized_by` | uuid                 | FK → profiles ON DELETE RESTRICT |
| `created_at`   | timestamptz NOT NULL |                                  |

---

### `pricing_batch_item_prices`

Final unit price per item for a batch.

| Column             | Type                   | Notes                                  |
| ------------------ | ---------------------- | -------------------------------------- |
| `batch_id`         | uuid                   | FK → pricing_batches ON DELETE CASCADE |
| `item_id`          | uuid                   | FK → items ON DELETE RESTRICT          |
| `final_unit_price` | numeric(10,2) NOT NULL | CHECK >= 0                             |
| `created_at`       | timestamptz NOT NULL   |                                        |

PK: `(batch_id, item_id)`.

---

### `admin_new_user_email_log`

Tracks whether the welcome-email was sent for a new user (dedup guard).

| Column    | Type                 | Notes                             |
| --------- | -------------------- | --------------------------------- |
| `user_id` | uuid PK              | FK → auth.users ON DELETE CASCADE |
| `sent_at` | timestamptz NOT NULL |                                   |

---

## Views

### `me` (SECURITY INVOKER)

Returns the current user's profile row (`auth.uid() = id`). Fields: `id`, `phone`, `first_name`, `last_name`, `role`, `owned_restaurant_id`.

### `v_items_with_favorite` (SECURITY INVOKER)

`items` LEFT JOIN `favorite_items` on `user_id = auth.uid()`. Adds `is_favorite boolean` column.

---

## Triggers

| Trigger                         | Table         | Event                      | Function                                                                                   |
| ------------------------------- | ------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| `on_auth_user_created`          | `auth.users`  | AFTER INSERT               | `handle_new_user()` — creates `profiles` row                                               |
| `set_cart_items_updated_at`     | `cart_items`  | BEFORE UPDATE              | `set_updated_at()`                                                                         |
| `set_carts_updated_at`          | `carts`       | BEFORE UPDATE              | `set_updated_at()`                                                                         |
| `tg_order_items_set_updated_at` | `order_items` | BEFORE UPDATE              | `tg_set_updated_at()`                                                                      |
| `tg_orders_set_updated_at`      | `orders`      | BEFORE UPDATE              | `tg_set_updated_at()`                                                                      |
| `tg_profiles_set_updated_at`    | `profiles`    | BEFORE UPDATE              | `tg_profiles_set_updated_at()`                                                             |
| `tg_restaurants_updated_at`     | `restaurants` | BEFORE UPDATE              | `tg_set_updated_at()`                                                                      |
| `trg_order_items_rollup`        | `order_items` | AFTER INSERT/UPDATE/DELETE | `fn_order_items_rollup_apply()` — maintains `orders.total_amount` and `orders.items_count` |

---

## Cascade / Delete Behavior

| Parent            | Child                          | On Delete |
| ----------------- | ------------------------------ | --------- |
| `auth.users`      | `profiles`                     | CASCADE   |
| `auth.users`      | `admin_users`                  | CASCADE   |
| `auth.users`      | `favorite_items`               | CASCADE   |
| `profiles`        | `carts`                        | CASCADE   |
| `profiles`        | `employee_restaurant_relation` | CASCADE   |
| `profiles`        | `orders.created_by`            | SET NULL  |
| `profiles`        | `pricing_batches.finalized_by` | RESTRICT  |
| `restaurants`     | `orders`                       | RESTRICT  |
| `items`           | `order_items`                  | RESTRICT  |
| `items`           | `pricing_batch_item_prices`    | RESTRICT  |
| `orders`          | `order_items`                  | CASCADE   |
| `pricing_batches` | `pricing_batch_item_prices`    | CASCADE   |
