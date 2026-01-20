


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'in_transit',
    'delivered'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_type" AS ENUM (
    'cash',
    'card'
);


ALTER TYPE "public"."payment_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'restaurant_owner',
    'employee',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "address_line1" "text" NOT NULL,
    "address_line2" "text" DEFAULT ''::"text" NOT NULL,
    "city" "text" NOT NULL,
    "postal_code" "text" NOT NULL,
    "country" "text" DEFAULT 'US'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_my_restaurant"("p_name" "text", "p_address_line1" "text", "p_address_line2" "text" DEFAULT ''::"text", "p_city" "text" DEFAULT ''::"text", "p_postal_code" "text" DEFAULT ''::"text", "p_country" "text" DEFAULT 'US'::"text") RETURNS "public"."restaurants"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
  v_user uuid := auth.uid();
  v_rest public.restaurants;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.restaurants (
    name, owner_id,
    address_line1, address_line2, city, postal_code, country
  )
  values (
    p_name, v_user,
    p_address_line1, coalesce(p_address_line2, ''), p_city, p_postal_code, coalesce(p_country, 'US')
  )
  returning * into v_rest;

  update public.profiles
     set owned_restaurant_id = v_rest.id
   where id = v_user;

  return v_rest;
end;$$;


ALTER FUNCTION "public"."create_my_restaurant"("p_name" "text", "p_address_line1" "text", "p_address_line2" "text", "p_city" "text", "p_postal_code" "text", "p_country" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_add_favorite_item"("p_item_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.favorite_items (user_id, item_id)
  values (auth.uid(), p_item_id)
  on conflict do nothing;
end;
$$;


ALTER FUNCTION "public"."fn_add_favorite_item"("p_item_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cart_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cart_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_add_to_cart"("p_item_id" "uuid", "p_quantity_delta" integer DEFAULT 1) RETURNS "public"."cart_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_cart        public.carts;
  v_existing    public.cart_items;
  v_new_qty     integer;
begin
  perform set_config('search_path', 'public', true);

  -- No-op if delta is 0
  if p_quantity_delta = 0 then
    return null;
  end if;

  -- Get or create the cart for the current user
  select * into v_cart
  from public.fn_get_or_create_cart();

  -- Check if this item is already in the cart
  select *
  into v_existing
  from public.cart_items ci
  where ci.cart_id = v_cart.id
    and ci.item_id = p_item_id
  limit 1;

  -- Case 1: no existing row
  if v_existing.id is null then
    -- If delta is negative and there's no row, nothing to do
    if p_quantity_delta <= 0 then
      return null;
    end if;

    insert into public.cart_items (cart_id, item_id, quantity)
    values (v_cart.id, p_item_id, p_quantity_delta)
    returning * into v_existing;

    return v_existing;
  end if;

  -- Case 2: row exists, compute new quantity
  v_new_qty := v_existing.quantity + p_quantity_delta;

  -- If new quantity <= 0, delete the row and return NULL
  if v_new_qty <= 0 then
    delete from public.cart_items
    where id = v_existing.id;
    return null;
  end if;

  -- Otherwise update to the new quantity (which is > 0)
  update public.cart_items
  set quantity = v_new_qty
  where id = v_existing.id
  returning * into v_existing;

  return v_existing;
end;
$$;


ALTER FUNCTION "public"."fn_add_to_cart"("p_item_id" "uuid", "p_quantity_delta" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_admin_chart_orders_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer DEFAULT 5) RETURNS TABLE("day" "date", "orders_count" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'auth'
    AS $$begin
  if not public.fn_is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (date_trunc('day', o.created_at at time zone 'America/New_York'))::date,
    count(*) as orders_count
  from public.orders o
  where o.created_at >= p_from
    and o.created_at <  p_to
  group by 1
  order by 1 desc
  limit case
    when p_limit = -1 then null
    else greatest(p_limit, 1)
  end;
end;$$;


ALTER FUNCTION "public"."fn_admin_chart_orders_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_admin_chart_orders_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) IS 'Admin-only: daily order counts for a date range. Defaults to 5 rows; pass -1 to return all.';



CREATE OR REPLACE FUNCTION "public"."fn_admin_chart_revenue_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer DEFAULT 5) RETURNS TABLE("day" "date", "revenue" numeric, "final_revenue" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  if not public.fn_is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (date_trunc('day', o.created_at at time zone 'America/New_York'))::date,
    coalesce(round(sum(oi.quantity * oi.unit_price)::numeric, 2), 0)::numeric(20,2) as revenue,
    coalesce(round(sum(oi.quantity * oi.final_unit_price)::numeric, 2), 0)::numeric(20,2) as final_revenue
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where o.created_at >= p_from
    and o.created_at <  p_to
  group by 1
  order by 1 desc
  limit case
    when p_limit = -1 then null                 -- NULL means "no limit" in Postgres
    else greatest(p_limit, 1)
  end;
end;
$$;


ALTER FUNCTION "public"."fn_admin_chart_revenue_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_admin_chart_revenue_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) IS 'Admin-only: daily revenue for a date range. Defaults to 5 rows; pass -1 to return all.';



CREATE OR REPLACE FUNCTION "public"."fn_admin_chart_revenue_by_restaurant"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer DEFAULT 10) RETURNS TABLE("restaurant_id" "uuid", "restaurant_name" "text", "orders_count" bigint, "revenue" numeric, "final_revenue" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  if not public.fn_is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    r.id as restaurant_id,
    r.name as restaurant_name,
    count(distinct o.id) as orders_count,
    coalesce(round(sum(oi.quantity * oi.unit_price)::numeric, 2), 0)::numeric(20,2) as revenue,
    coalesce(round(sum(oi.quantity * oi.final_unit_price)::numeric, 2), 0)::numeric(20,2) as final_revenue
  from public.orders o
  join public.restaurants r on r.id = o.restaurant_id
  join public.order_items oi on oi.order_id = o.id
  where o.created_at >= p_from
    and o.created_at <  p_to
    -- Optional status filter:
    -- and o.status <> 'cancelled'
  group by r.id, r.name
  order by revenue desc
  limit greatest(p_limit, 1);
end;
$$;


ALTER FUNCTION "public"."fn_admin_chart_revenue_by_restaurant"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_admin_chart_revenue_by_restaurant"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) IS 'Admin-only: returns top restaurants by revenue in the provided date range (includes order count).';



CREATE OR REPLACE FUNCTION "public"."fn_admin_dashboard_month_kpis"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone) RETURNS TABLE("orders_count" bigint, "total_revenue" numeric, "final_total_revenue" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  if not public.fn_is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*)
     from public.orders o
     where o.created_at >= p_month_start
       and o.created_at <  p_month_end
    ) as orders_count,

    coalesce((
      select round(sum(oi.quantity * oi.unit_price)::numeric, 2)
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.created_at >= p_month_start
        and o.created_at <  p_month_end
      -- If you later add statuses like cancelled/refunded and want to exclude them,
      -- add something like: and o.status <> 'cancelled'
    ), 0)::numeric(20,2) as total_revenue,

    coalesce((
      select round(sum(oi.quantity * oi.final_unit_price)::numeric, 2)
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.created_at >= p_month_start
        and o.created_at <  p_month_end
      -- If you later add statuses like cancelled/refunded and want to exclude them,
      -- add something like: and o.status <> 'cancelled'
    ), 0)::numeric(20,2) as final_total_revenue;
end;
$$;


ALTER FUNCTION "public"."fn_admin_dashboard_month_kpis"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_admin_dashboard_month_kpis"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone) IS 'Admin-only: returns orders_count and total_revenue for a given month range.';



CREATE OR REPLACE FUNCTION "public"."fn_admin_dashboard_top_items"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone, "p_limit" integer DEFAULT 5) RETURNS TABLE("item_id" "uuid", "item_name" "text", "unit" "text", "quantity" numeric, "revenue" numeric, "final_revenue" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  if not public.fn_is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    oi.item_id,
    oi.item_name,
    oi.unit,
    sum(oi.quantity)::numeric(20,3) as quantity,
    round(sum(oi.quantity * oi.unit_price)::numeric, 2)::numeric(20,2) as revenue,
    round(sum(oi.quantity * oi.final_unit_price)::numeric, 2)::numeric(20,2) as final_revenue
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where o.created_at >= p_month_start
    and o.created_at <  p_month_end
  group by oi.item_id, oi.item_name, oi.unit
  order by revenue desc
  limit case
    when p_limit = -1 then null        -- NULL means "no limit" in Postgres
    else greatest(p_limit, 1)
  end;
end;
$$;


ALTER FUNCTION "public"."fn_admin_dashboard_top_items"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_admin_dashboard_top_items"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone, "p_limit" integer) IS 'Admin-only: top items by revenue for the range. Defaults to 5; pass -1 to return all.';



CREATE OR REPLACE FUNCTION "public"."fn_admin_finalize_pricing_for_day"("p_delivery_day" "date", "p_prices" "jsonb") RETURNS TABLE("batch_id" "uuid", "orders_updated" integer, "order_items_updated" integer, "items_updated" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_batch_id uuid;
  v_orders_updated int := 0;
  v_order_items_updated int := 0;
  v_items_updated int := 0;

  v_start timestamptz;
  v_end   timestamptz;
begin

  if not public.fn_is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_delivery_day is null then
    raise exception 'p_delivery_day is required';
  end if;

  if p_prices is null or jsonb_typeof(p_prices) <> 'array' then
    raise exception 'p_prices must be a JSON array';
  end if;

  -- Interpret the "day" in Miami/ET, but filter with an index-friendly timestamptz range
  v_start := (p_delivery_day::timestamp at time zone 'America/New_York');
  v_end   := ((p_delivery_day + 1)::timestamp at time zone 'America/New_York');

  if not exists (
    select 1
    from public.orders o
    where o.delivery_at is not null
      and o.delivery_at >= v_start
      and o.delivery_at <  v_end
  ) then
    raise exception 'No orders found with delivery_at on % (America/New_York)', p_delivery_day;
  end if;

  -- Create pricing batch (block reruns)
  insert into public.pricing_batches (delivery_day, status, finalized_at, finalized_by)
  values (p_delivery_day, 'finalized', now(), auth.uid())
  returning id into v_batch_id;

  -- Insert per-item final prices for this batch
  insert into public.pricing_batch_item_prices (batch_id, item_id, final_unit_price)
  select
    v_batch_id,
    (x->>'item_id')::uuid,
    (x->>'final_unit_price')::numeric(10,2)
  from jsonb_array_elements(p_prices) x;

  -- Apply final prices to order_items for orders delivering in that local day window
  -- FIX: do NOT reference "oi" in a JOIN ... ON. Put it in WHERE instead.
  update public.order_items oi
  set
    final_unit_price = pbip.final_unit_price,
    pricing_batch_id = v_batch_id,
    updated_at = now()
  from public.orders o,
       public.pricing_batch_item_prices pbip
  where oi.order_id = o.id
    and pbip.batch_id = v_batch_id
    and pbip.item_id = oi.item_id
    and o.delivery_at is not null
    and o.delivery_at >= v_start
    and o.delivery_at <  v_end;

  get diagnostics v_order_items_updated = row_count;

  -- Force completeness: every order_item for that day must have a final_unit_price
  if exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.delivery_at is not null
      and o.delivery_at >= v_start
      and o.delivery_at <  v_end
      and oi.final_unit_price is null
  ) then
    raise exception
      'Missing final prices for one or more items on % (provide prices for every item_id used that day).',
      p_delivery_day;
  end if;

  -- Update orders.final_total_amount from order_items.final_unit_price
  update public.orders o
  set
    final_total_amount = s.sum_total,
    pricing_finalized_at = now(),
    pricing_batch_id = v_batch_id,
    updated_at = now()
  from (
    select
      oi.order_id,
      round(sum(oi.quantity * oi.final_unit_price), 2) as sum_total
    from public.order_items oi
    join public.orders o2 on o2.id = oi.order_id
    where o2.delivery_at is not null
      and o2.delivery_at >= v_start
      and o2.delivery_at <  v_end
    group by oi.order_id
  ) s
  where o.id = s.order_id;

  get diagnostics v_orders_updated = row_count;

  -- Update items.price to latest finalized price
  update public.items i
  set
    price = pbip.final_unit_price,
    last_finalized_price_at = now(),
    last_pricing_batch_id = v_batch_id,
    updated_at = now()
  from public.pricing_batch_item_prices pbip
  where pbip.batch_id = v_batch_id
    and pbip.item_id = i.id;

  get diagnostics v_items_updated = row_count;

  return query
  select v_batch_id, v_orders_updated, v_order_items_updated, v_items_updated;
end;
$$;


ALTER FUNCTION "public"."fn_admin_finalize_pricing_for_day"("p_delivery_day" "date", "p_prices" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_admin_list_orders"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer DEFAULT 50, "p_cursor_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_cursor_id" "uuid" DEFAULT NULL::"uuid", "p_restaurant_id" "uuid" DEFAULT NULL::"uuid", "p_status" "public"."order_status" DEFAULT NULL::"public"."order_status") RETURNS TABLE("order_id" "uuid", "status" "public"."order_status", "created_at" timestamp with time zone, "delivery_at" timestamp with time zone, "restaurant_id" "uuid", "restaurant_name" "text", "created_by" "uuid", "buyer_first_name" "text", "buyer_last_name" "text", "total_amount" numeric, "final_total_amount" numeric, "items_count" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  if not public.fn_is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    o.id as order_id,
    o.status,
    o.created_at,
    o.delivery_at,
    r.id as restaurant_id,
    r.name as restaurant_name,
    o.created_by,
    p.first_name as buyer_first_name,
    p.last_name as buyer_last_name,
    o.total_amount,
    o.final_total_amount,
    o.items_count::bigint
  from public.orders o
  join public.restaurants r on r.id = o.restaurant_id
  left join public.profiles p on p.id = o.created_by
  where o.created_at >= p_from
    and o.created_at <  p_to
    and (p_restaurant_id is null or o.restaurant_id = p_restaurant_id)
    and (p_status is null or o.status = p_status)

    -- Keyset pagination: only fetch rows "after" the cursor for DESC ordering
    and (
      p_cursor_created_at is null
      or p_cursor_id is null
      or (o.created_at, o.id) < (p_cursor_created_at, p_cursor_id)
    )
  order by o.created_at desc, o.id desc
  limit greatest(p_limit, 1);
  end;
$$;


ALTER FUNCTION "public"."fn_admin_list_orders"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer, "p_cursor_created_at" timestamp with time zone, "p_cursor_id" "uuid", "p_restaurant_id" "uuid", "p_status" "public"."order_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_admin_truck_load_summary"("p_delivery_date" "date" DEFAULT (("now"() AT TIME ZONE 'America/New_York'::"text"))::"date", "p_tz" "text" DEFAULT 'America/New_York'::"text") RETURNS TABLE("item_id" "uuid", "item_name" "text", "item_image_url" "text", "finalized" boolean, "finalized_amount" numeric)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select
    oi.item_id,
    oi.item_name,
    coalesce(oi.image_url, i.image_url) as item_image_url,
    bool_or(oi.final_unit_price is not null) as finalized,
    oi.final_unit_price as finalized_amount
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  left join public.items i on i.id = oi.item_id
  where
    public.fn_is_admin()
    and o.delivery_at is not null
    and ((o.delivery_at at time zone p_tz)::date = p_delivery_date)
  group by
    oi.item_id,
    oi.item_name,
    coalesce(oi.image_url, i.image_url),
    oi.final_unit_price
  order by oi.item_name asc;
$$;


ALTER FUNCTION "public"."fn_admin_truck_load_summary"("p_delivery_date" "date", "p_tz" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_clear_cart"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_cart_id uuid;
begin
  perform set_config('search_path', 'public', true);

  select id into v_cart_id
  from public.carts
  where profile_id = auth.uid()
  limit 1;

  if v_cart_id is null then
    return;
  end if;

  delete from public.cart_items
  where cart_id = v_cart_id;

  return;
end;
$$;


ALTER FUNCTION "public"."fn_clear_cart"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_create_order_from_cart"("p_restaurant_id" "uuid", "p_delivery_at" timestamp with time zone, "p_payment_method" "text") RETURNS TABLE("id" "uuid", "status" "public"."order_status", "restaurant_id" "uuid", "created_by" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "total_amount" numeric, "delivery_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id uuid;
  v_cart_id uuid;
  v_order_id uuid;
  v_cart_item_count integer;
  v_items_inserted integer;
  v_total numeric(12, 2);
  v_order_row public.orders%rowtype;
begin
  -- Require authenticated user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authorized';
  end if;

  -- Find and lock the user's cart
  select c.id
  into v_cart_id
  from public.carts c
  where c.profile_id = v_user_id
  for update;

  if v_cart_id is null then
    raise exception 'Cart not found';
  end if;

  -- Ensure the cart has items
  select count(*)
  into v_cart_item_count
  from public.cart_items ci
  where ci.cart_id = v_cart_id;

  if v_cart_item_count = 0 then
    raise exception 'Cart is empty';
  end if;

  -- Create the order (including delivery_at)
  insert into public.orders (
    status,
    restaurant_id,
    created_by,
    delivery_at,
    payment_method
  )
  values (
    'pending'::public.order_status,
    p_restaurant_id,
    v_user_id,
    p_delivery_at,
    p_payment_method::public.payment_type
  )
  returning *
  into v_order_row;

  v_order_id     := v_order_row.id;
  id             := v_order_row.id;
  status         := v_order_row.status;
  restaurant_id  := v_order_row.restaurant_id;
  created_by     := v_order_row.created_by;
  created_at     := v_order_row.created_at;
  updated_at     := v_order_row.updated_at;
  delivery_at    := v_order_row.delivery_at;

  -- Insert order_items from cart_items + items
  insert into public.order_items (
    order_id,
    item_id,
    item_name,
    unit,
    quantity,
    unit_price,
    image_url
  )
  select
    v_order_id as order_id,
    ci.item_id,
    i.name as item_name,
    i.unit,
    ci.quantity,
    i.price as unit_price,
    i.image_url
  from public.cart_items ci
  join public.items i
    on i.id = ci.item_id
  where ci.cart_id = v_cart_id;

  get diagnostics v_items_inserted = row_count;

  -- Safety check: all cart items must have become order_items
  if v_items_inserted <> v_cart_item_count then
    raise exception 'Some items in the cart could not be added to the order. Please refresh your cart.';
  end if;

  -- Compute total from the newly created order_items
  select
    coalesce(
      round(sum(oi.quantity * oi.unit_price), 2),
      0::numeric
    )::numeric(12, 2)
  into v_total
  from public.order_items oi
  where oi.order_id = v_order_id;

  total_amount := v_total;

  -- Clear the cart: items then cart
  delete from public.cart_items
  where cart_id = v_cart_id;

  delete from public.carts c
  where c.id = v_cart_id;

  -- Return the order row + computed total
  return next;
end;
$$;


ALTER FUNCTION "public"."fn_create_order_from_cart"("p_restaurant_id" "uuid", "p_delivery_at" timestamp with time zone, "p_payment_method" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_employee_list_orders"("p_limit" integer DEFAULT 25, "p_cursor_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_cursor_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "total_amount" numeric, "status" "text", "delivery_at" timestamp with time zone, "created_at" timestamp with time zone, "restaurant_name" "text")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$select
    o.id,
    o.final_total_amount, 
    o.status,
    o.delivery_at,
    o.created_at,
    r.name as restaurant_name
  from public.orders o
  join restaurants r on r.id = o.restaurant_id
  where
    -- cursor (DESC pagination)
    (
      p_cursor_created_at is null
      or (o.created_at, o.id) < (p_cursor_created_at, p_cursor_id)
    )
  order by o.created_at desc, o.id desc
  limit p_limit;$$;


ALTER FUNCTION "public"."fn_employee_list_orders"("p_limit" integer, "p_cursor_created_at" timestamp with time zone, "p_cursor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_employee_truck_load_summary"("p_delivery_date" "date" DEFAULT (("now"() AT TIME ZONE 'America/New_York'::"text"))::"date", "p_tz" "text" DEFAULT 'America/New_York'::"text") RETURNS TABLE("item_id" "uuid", "item_name" "text", "item_image_url" "text", "total_quantity" bigint, "restaurants" "jsonb")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with per_restaurant as (
    select
      o.restaurant_id,
      r.name as restaurant_name,
      oi.item_id,
      oi.item_name,
      coalesce(oi.image_url, i.image_url) as item_image_url,
      sum(oi.quantity)::bigint as quantity
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    join public.restaurants r on r.id = o.restaurant_id
    left join public.items i on i.id = oi.item_id
    where
      o.status = 'in_transit'
      and ((o.delivery_at at time zone p_tz)::date = p_delivery_date)
      and exists (
        select 1
        from public.employee_restaurant_relation err
        where err.employee_id = auth.uid()
          and err.restaurant_id = o.restaurant_id
      )
    group by
      o.restaurant_id, r.name,
      oi.item_id, oi.item_name,
      coalesce(oi.image_url, i.image_url)
  )
  select
    pr.item_id,
    pr.item_name,
    pr.item_image_url,
    sum(pr.quantity)::bigint as total_quantity,
    jsonb_agg(
      jsonb_build_object(
        'restaurant_id', pr.restaurant_id,
        'restaurant_name', pr.restaurant_name,
        'quantity', pr.quantity
      )
      order by pr.restaurant_name
    ) as restaurants
  from per_restaurant pr
  group by pr.item_id, pr.item_name, pr.item_image_url
  order by total_quantity desc, pr.item_name asc;
$$;


ALTER FUNCTION "public"."fn_employee_truck_load_summary"("p_delivery_date" "date", "p_tz" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_get_cart_with_items"() RETURNS TABLE("cart_id" "uuid", "cart_created_at" timestamp with time zone, "cart_updated_at" timestamp with time zone, "item_row_id" "uuid", "item_id" "uuid", "item_name" "text", "item_price" numeric, "quantity" integer, "line_subtotal" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_cart public.carts;
begin
  -- keep search_path sane
  perform set_config('search_path', 'public', true);

  -- make sure the user has a cart
  select * into v_cart
  from public.fn_get_or_create_cart();

  -- return all items in that cart, joined with item details
  return query
  select
    v_cart.id as cart_id,
    v_cart.created_at as cart_created_at,
    v_cart.updated_at as cart_updated_at,
    ci.id as item_row_id,
    i.id as item_id,
    i.name as item_name,      -- adjust column names to your items table
    i.price as item_price,
    ci.quantity,
    (ci.quantity * i.price) as line_subtotal
  from public.cart_items ci
  join public.items i on i.id = ci.item_id
  where ci.cart_id = v_cart.id;

end;
$$;


ALTER FUNCTION "public"."fn_get_cart_with_items"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checked_out_at" timestamp with time zone,
    "metadata" "jsonb"
);


ALTER TABLE "public"."carts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_get_or_create_cart"() RETURNS "public"."carts"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_cart public.carts;
begin
  -- Make sure we always use the public schema
  perform set_config('search_path', 'public', true);

  -- Try to find an existing cart for this user
  select *
  into v_cart
  from public.carts
  where profile_id = auth.uid()
  limit 1;

  -- If none, create one
  if v_cart.id is null then
    begin
      insert into public.carts (profile_id)
      values (auth.uid())
      returning * into v_cart;
    exception
      when unique_violation then
        -- Another transaction created it concurrently; just fetch it
        select *
        into v_cart
        from public.carts
        where profile_id = auth.uid()
        limit 1;
    end;
  end if;

  return v_cart;
end;
$$;


ALTER FUNCTION "public"."fn_get_or_create_cart"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_get_order_details"("p_order_id" "uuid") RETURNS TABLE("order_id" "uuid", "order_status" "text", "placed_at" timestamp with time zone, "delivery_at" timestamp with time zone, "customer_id" "uuid", "subtotal" numeric, "total" numeric, "final_subtotal" numeric, "final_total" numeric, "restaurant" "public"."restaurants", "item_id" "uuid", "item_name" "text", "item_image_url" "text", "quantity" numeric, "unit_price" numeric, "final_unit_price" numeric, "line_total" numeric, "final_line_total" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    o.id                                as order_id,
    o.status::text                      as order_status,
    o.created_at                        as placed_at,
    o.delivery_at                       as delivery_at,
    o.created_by                        as customer_id,

    round(sum(oi.quantity * oi.unit_price) over (partition by o.id)::numeric, 2) as subtotal,
    round(sum(oi.quantity * oi.unit_price) over (partition by o.id)::numeric, 2) as total,

    round(sum(oi.quantity * oi.final_unit_price) over (partition by o.id)::numeric, 2) as final_subtotal,
    round(sum(oi.quantity * oi.final_unit_price) over (partition by o.id)::numeric, 2) as final_total,

    r                                  as restaurant,  -- <-- key change

    oi.item_id                          as item_id,
    oi.item_name                        as item_name,
    coalesce(oi.image_url, i.image_url) as item_image_url,
    oi.quantity                         as quantity,
    oi.unit_price                       as unit_price,
    oi.final_unit_price                 as final_unit_price,
    (oi.quantity * oi.unit_price)       as line_total,
    (oi.quantity * oi.final_unit_price) as final_line_total
  from public.orders o
  join public.restaurants r  on r.id = o.restaurant_id
  join public.order_items oi on oi.order_id = o.id
  left join public.items i   on i.id = oi.item_id
  where o.id = p_order_id

$$;


ALTER FUNCTION "public"."fn_get_order_details"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."fn_is_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_is_admin"() IS 'Returns true if the current auth user is in public.admin_users.';



CREATE OR REPLACE FUNCTION "public"."fn_order_items_rollup_apply"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  old_amount numeric(20,2);
  new_amount numeric(20,2);
begin
  -- Calculate row-level amounts (rounded to match orders.total_amount scale)
  old_amount := round(coalesce(old.quantity,0) * coalesce(old.unit_price,0), 2);
  new_amount := round(coalesce(new.quantity,0) * coalesce(new.unit_price,0), 2);

  if (tg_op = 'INSERT') then
    update public.orders
    set total_amount = total_amount + new_amount,
        items_count  = items_count + 1
    where id = new.order_id;

    return new;
  end if;

  if (tg_op = 'DELETE') then
    update public.orders
    set total_amount = total_amount - old_amount,
        items_count  = items_count - 1
    where id = old.order_id;

    return old;
  end if;

  -- UPDATE:
  -- If order_id changed, subtract from old order and add to new order.
  if (new.order_id is distinct from old.order_id) then
    update public.orders
    set total_amount = total_amount - old_amount,
        items_count  = items_count - 1
    where id = old.order_id;

    update public.orders
    set total_amount = total_amount + new_amount,
        items_count  = items_count + 1
    where id = new.order_id;

    return new;
  end if;

  -- Same order_id, just adjust by delta
  update public.orders
  set total_amount = total_amount + (new_amount - old_amount)
  where id = new.order_id;

  return new;
end;
$$;


ALTER FUNCTION "public"."fn_order_items_rollup_apply"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_order_items_rollup_apply"() IS 'Trigger function: maintains orders.total_amount and orders.items_count incrementally when order_items change.';



CREATE OR REPLACE FUNCTION "public"."fn_remove_favorite_item"("p_item_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.favorite_items
  where user_id = auth.uid()
    and item_id = p_item_id;
end;
$$;


ALTER FUNCTION "public"."fn_remove_favorite_item"("p_item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_cart_item_quantity"("p_cart_item_id" "uuid", "p_new_quantity" integer) RETURNS "public"."cart_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_item public.cart_items;
begin
  perform set_config('search_path', 'public', true);

  -- Ensure the item belongs to the current user's cart
  select ci.*
  into v_item
  from public.cart_items ci
  join public.carts c on c.id = ci.cart_id
  where ci.id = p_cart_item_id
    and c.profile_id = auth.uid()
  limit 1;

  if v_item.id is null then
    raise exception 'Cart item not found for current user';
  end if;

  if p_new_quantity <= 0 then
    delete from public.cart_items where id = v_item.id;
    return null;
  end if;

  update public.cart_items
  set quantity = p_new_quantity
  where id = v_item.id
  returning * into v_item;

  return v_item;
end;
$$;


ALTER FUNCTION "public"."fn_update_cart_item_quantity"("p_cart_item_id" "uuid", "p_new_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$BEGIN
  INSERT INTO public.profiles (id, phone, first_name, last_name, role)
  VALUES (
    NEW.id,
    TRIM(COALESCE(NEW.raw_user_meta_data->>'phone',
                  NEW.raw_user_meta_data->>'phone_number',
                  NEW.phone, '')),
    TRIM(COALESCE(NEW.raw_user_meta_data->>'firstName', '')),
    TRIM(COALESCE(NEW.raw_user_meta_data->>'lastName',  '')),
    'restaurant_owner'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_profiles_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END$$;


ALTER FUNCTION "public"."tg_profiles_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."tg_set_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_new_user_email_log" (
    "user_id" "uuid" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_new_user_email_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_users" IS 'Allowlist of application admins. Insert rows manually (or via service role).';



COMMENT ON COLUMN "public"."admin_users"."user_id" IS 'Auth user id for an admin user.';



CREATE TABLE IF NOT EXISTS "public"."employee_restaurant_relation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."employee_restaurant_relation" OWNER TO "postgres";


COMMENT ON TABLE "public"."employee_restaurant_relation" IS 'This table shows which employees are in charge of which restaurants';



CREATE TABLE IF NOT EXISTS "public"."favorite_items" (
    "user_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."favorite_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "unit" "text" NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_finalized_price_at" timestamp with time zone,
    "last_pricing_batch_id" "uuid",
    CONSTRAINT "items_price_check" CHECK (("price" >= (0)::numeric))
);

ALTER TABLE ONLY "public"."items" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "phone" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'restaurant_owner'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "owned_restaurant_id" "uuid"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."me" WITH ("security_invoker"='on') AS
 SELECT "id",
    "phone",
    "first_name",
    "last_name",
    "role",
    "owned_restaurant_id"
   FROM "public"."profiles" "p"
  WHERE ("id" = "auth"."uid"());


ALTER VIEW "public"."me" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "unit" "text" NOT NULL,
    "quantity" numeric(12,3) NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "final_unit_price" numeric(10,2),
    "pricing_batch_id" "uuid",
    CONSTRAINT "order_items_final_unit_price_check" CHECK ((("final_unit_price" IS NULL) OR ("final_unit_price" >= (0)::numeric))),
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "order_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status" NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "delivery_at" timestamp with time zone,
    "total_amount" numeric(20,2) DEFAULT 0 NOT NULL,
    "items_count" integer DEFAULT 0 NOT NULL,
    "confirmation_email_sent_at" timestamp with time zone,
    "final_total_amount" numeric(20,2),
    "pricing_finalized_at" timestamp with time zone,
    "pricing_batch_id" "uuid",
    "payment_method" "public"."payment_type",
    CONSTRAINT "orders_final_total_amount_check" CHECK ((("final_total_amount" IS NULL) OR ("final_total_amount" >= (0)::numeric)))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orders"."total_amount" IS 'Cached order total. Maintained by trigger on order_items. Avoids expensive sums at read time.';



COMMENT ON COLUMN "public"."orders"."items_count" IS 'Cached line-item count (number of order_items rows). Maintained by trigger on order_items.';



COMMENT ON COLUMN "public"."orders"."confirmation_email_sent_at" IS 'The time the order email was sent at';



CREATE TABLE IF NOT EXISTS "public"."pricing_batch_item_prices" (
    "batch_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "final_unit_price" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pricing_batch_item_prices_final_unit_price_check" CHECK (("final_unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."pricing_batch_item_prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_day" "date" NOT NULL,
    "status" "text" DEFAULT 'finalized'::"text" NOT NULL,
    "finalized_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finalized_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pricing_batches_status_check" CHECK (("status" = 'finalized'::"text"))
);


ALTER TABLE "public"."pricing_batches" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_items_with_favorite" WITH ("security_invoker"='on') AS
 SELECT "i"."id",
    "i"."name",
    "i"."description",
    "i"."price",
    "i"."unit",
    "i"."image_url",
    "i"."created_at",
    ("f"."item_id" IS NOT NULL) AS "is_favorite"
   FROM ("public"."items" "i"
     LEFT JOIN "public"."favorite_items" "f" ON ((("f"."user_id" = "auth"."uid"()) AND ("f"."item_id" = "i"."id"))));


ALTER VIEW "public"."v_items_with_favorite" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_new_user_email_log"
    ADD CONSTRAINT "admin_new_user_email_log_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_item_id_key" UNIQUE ("cart_id", "item_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."employee_restaurant_relation"
    ADD CONSTRAINT "employee_restaurant_relation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorite_items"
    ADD CONSTRAINT "favorite_items_pkey" PRIMARY KEY ("user_id", "item_id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_unique" UNIQUE ("order_id", "item_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_batch_item_prices"
    ADD CONSTRAINT "pricing_batch_item_prices_pkey" PRIMARY KEY ("batch_id", "item_id");



ALTER TABLE ONLY "public"."pricing_batches"
    ADD CONSTRAINT "pricing_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



CREATE INDEX "cart_items_cart_id_idx" ON "public"."cart_items" USING "btree" ("cart_id");



CREATE INDEX "cart_items_item_id_idx" ON "public"."cart_items" USING "btree" ("item_id");



CREATE INDEX "employee_restaurant_relation_restaurant_id_idx" ON "public"."employee_restaurant_relation" USING "btree" ("restaurant_id");



CREATE INDEX "favorite_items_user_created_at_idx" ON "public"."favorite_items" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_err_employee_restaurant" ON "public"."employee_restaurant_relation" USING "btree" ("employee_id", "restaurant_id");



CREATE INDEX "idx_orders_status_delivery_restaurant" ON "public"."orders" USING "btree" ("status", "delivery_at", "restaurant_id");



CREATE INDEX "idx_restaurants_owner_id" ON "public"."restaurants" USING "btree" ("owner_id");



CREATE INDEX "items_created_at_desc_idx" ON "public"."items" USING "btree" ("created_at" DESC);



CREATE INDEX "items_name_asc_idx" ON "public"."items" USING "btree" ("name");



CREATE INDEX "order_items_created_at_idx" ON "public"."order_items" USING "btree" ("created_at");



CREATE INDEX "order_items_item_id_idx" ON "public"."order_items" USING "btree" ("item_id");



CREATE INDEX "order_items_order_id_idx" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "orders_created_at_id_desc_idx" ON "public"."orders" USING "btree" ("created_at" DESC, "id" DESC);



CREATE INDEX "orders_created_at_idx" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "orders_created_by_idx" ON "public"."orders" USING "btree" ("created_by");



CREATE INDEX "orders_delivery_at_idx" ON "public"."orders" USING "btree" ("delivery_at");



CREATE INDEX "orders_restaurant_created_at_id_desc_idx" ON "public"."orders" USING "btree" ("restaurant_id", "created_at" DESC, "id" DESC);



CREATE INDEX "orders_restaurant_created_at_idx" ON "public"."orders" USING "btree" ("restaurant_id", "created_at");



CREATE INDEX "orders_restaurant_id_idx" ON "public"."orders" USING "btree" ("restaurant_id");



CREATE INDEX "orders_status_created_at_id_desc_idx" ON "public"."orders" USING "btree" ("status", "created_at" DESC, "id" DESC);



CREATE INDEX "orders_status_idx" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "pricing_batches_finalized_by_idx" ON "public"."pricing_batches" USING "btree" ("finalized_by");



CREATE UNIQUE INDEX "profiles_owned_restaurant_unique" ON "public"."profiles" USING "btree" ("owned_restaurant_id") WHERE ("owned_restaurant_id" IS NOT NULL);



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");


CREATE OR REPLACE TRIGGER "set_cart_items_updated_at" BEFORE UPDATE ON "public"."cart_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_carts_updated_at" BEFORE UPDATE ON "public"."carts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tg_order_items_set_updated_at" BEFORE UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "tg_orders_set_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "tg_profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."tg_profiles_set_updated_at"();



CREATE OR REPLACE TRIGGER "tg_restaurants_updated_at" BEFORE UPDATE ON "public"."restaurants" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_order_items_rollup" AFTER INSERT OR DELETE OR UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."fn_order_items_rollup_apply"();



ALTER TABLE ONLY "public"."admin_new_user_email_log"
    ADD CONSTRAINT "admin_new_user_email_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_restaurant_relation"
    ADD CONSTRAINT "employee_restaurant_relation_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_restaurant_relation"
    ADD CONSTRAINT "employee_restaurant_relation_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id");



ALTER TABLE ONLY "public"."favorite_items"
    ADD CONSTRAINT "favorite_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorite_items"
    ADD CONSTRAINT "favorite_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_last_pricing_batch_fk" FOREIGN KEY ("last_pricing_batch_id") REFERENCES "public"."pricing_batches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pricing_batch_fk" FOREIGN KEY ("pricing_batch_id") REFERENCES "public"."pricing_batches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pricing_batch_fk" FOREIGN KEY ("pricing_batch_id") REFERENCES "public"."pricing_batches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pricing_batch_item_prices"
    ADD CONSTRAINT "pricing_batch_item_prices_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."pricing_batches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pricing_batch_item_prices"
    ADD CONSTRAINT "pricing_batch_item_prices_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pricing_batches"
    ADD CONSTRAINT "pricing_batches_finalized_by_fkey" FOREIGN KEY ("finalized_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_owned_restaurant_id_fkey" FOREIGN KEY ("owned_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



CREATE POLICY "Admin View Employee Restaurant Relations" ON "public"."employee_restaurant_relation" TO "authenticated" USING ("public"."fn_is_admin"()) WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "Users can delete items from their cart" ON "public"."cart_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."carts" "c"
  WHERE (("c"."id" = "cart_items"."cart_id") AND ("c"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can delete their own cart" ON "public"."carts" FOR DELETE USING (("profile_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert items into their cart" ON "public"."cart_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."carts" "c"
  WHERE (("c"."id" = "cart_items"."cart_id") AND ("c"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can insert their own cart" ON "public"."carts" FOR INSERT WITH CHECK (("profile_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can select items in their cart" ON "public"."cart_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."carts" "c"
  WHERE (("c"."id" = "cart_items"."cart_id") AND ("c"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can select their own cart" ON "public"."carts" FOR SELECT USING (("profile_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update items in their cart" ON "public"."cart_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."carts" "c"
  WHERE (("c"."id" = "cart_items"."cart_id") AND ("c"."profile_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."carts" "c"
  WHERE (("c"."id" = "cart_items"."cart_id") AND ("c"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update their own cart" ON "public"."carts" FOR UPDATE USING (("profile_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("profile_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin delete items" ON "public"."items" FOR DELETE TO "authenticated" USING ("public"."fn_is_admin"());



CREATE POLICY "admin insert items" ON "public"."items" FOR INSERT TO "authenticated" WITH CHECK ("public"."fn_is_admin"());



CREATE POLICY "admin update items" ON "public"."items" FOR UPDATE TO "authenticated" USING ("public"."fn_is_admin"()) WITH CHECK ("public"."fn_is_admin"());



ALTER TABLE "public"."admin_new_user_email_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_users_read_own_row" ON "public"."admin_users" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "allow_admin_or_own_profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("public"."fn_is_admin"() OR (( SELECT "auth"."uid"() AS "uid") = "id")));



CREATE POLICY "authenticated_select_items_consolidated" ON "public"."items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_orders_consolidated" ON "public"."orders" FOR SELECT TO "authenticated" USING (("public"."fn_is_admin"() OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."employee_restaurant_relation" "err"
  WHERE (("err"."employee_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("err"."restaurant_id" = "orders"."restaurant_id"))))));



CREATE POLICY "authenticated_update_orders_consolidated" ON "public"."orders" FOR UPDATE TO "authenticated" USING (("public"."fn_is_admin"() OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."employee_restaurant_relation" "err"
  WHERE (("err"."employee_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("err"."restaurant_id" = "orders"."restaurant_id")))))) WITH CHECK (("public"."fn_is_admin"() OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."employee_restaurant_relation" "err"
  WHERE (("err"."employee_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("err"."restaurant_id" = "orders"."restaurant_id"))))));



ALTER TABLE "public"."cart_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_restaurant_relation" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employees_read_assigned_restaurants" ON "public"."restaurants" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employee_restaurant_relation" "err"
  WHERE (("err"."employee_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("err"."restaurant_id" = "restaurants"."id")))));



CREATE POLICY "employees_read_own_assignments" ON "public"."employee_restaurant_relation" FOR SELECT TO "authenticated" USING (("employee_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."favorite_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "favorite_items_delete_own" ON "public"."favorite_items" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "favorite_items_insert_own" ON "public"."favorite_items" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "favorite_items_select_own" ON "public"."favorite_items" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_buyer_delete" ON "public"."order_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND ("o"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "order_items_buyer_insert" ON "public"."order_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND ("o"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "order_items_buyer_update" ON "public"."order_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND ("o"."created_by" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND ("o"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_buyer_insert" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "owner can update own restaurant" ON "public"."restaurants" FOR UPDATE USING (("owner_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("owner_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."pricing_batch_item_prices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pricing_batch_item_prices_admin_write" ON "public"."pricing_batch_item_prices" TO "authenticated" USING ("public"."fn_is_admin"()) WITH CHECK ("public"."fn_is_admin"());



ALTER TABLE "public"."pricing_batches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pricing_batches_admin_write" ON "public"."pricing_batches" TO "authenticated" USING ("public"."fn_is_admin"()) WITH CHECK ("public"."fn_is_admin"());



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "restaurants_select_consolidated" ON "public"."restaurants" FOR SELECT TO "authenticated" USING (("public"."fn_is_admin"() OR ("owner_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "select_order_items_consolidated" ON "public"."order_items" FOR SELECT TO "authenticated" USING (("public"."fn_is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND ("o"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."employee_restaurant_relation" "err" ON (("err"."restaurant_id" = "o"."restaurant_id")))
  WHERE (("o"."id" = "order_items"."order_id") AND ("err"."employee_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TYPE "public"."order_status" TO "authenticated";





























































































































































































GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_my_restaurant"("p_name" "text", "p_address_line1" "text", "p_address_line2" "text", "p_city" "text", "p_postal_code" "text", "p_country" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_my_restaurant"("p_name" "text", "p_address_line1" "text", "p_address_line2" "text", "p_city" "text", "p_postal_code" "text", "p_country" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_my_restaurant"("p_name" "text", "p_address_line1" "text", "p_address_line2" "text", "p_city" "text", "p_postal_code" "text", "p_country" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_add_favorite_item"("p_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_add_favorite_item"("p_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_add_favorite_item"("p_item_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_add_to_cart"("p_item_id" "uuid", "p_quantity_delta" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_add_to_cart"("p_item_id" "uuid", "p_quantity_delta" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_add_to_cart"("p_item_id" "uuid", "p_quantity_delta" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_admin_chart_orders_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_admin_chart_orders_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_admin_chart_orders_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_admin_chart_orders_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_admin_chart_revenue_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_admin_chart_revenue_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_admin_chart_revenue_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_admin_chart_revenue_by_day"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_admin_chart_revenue_by_restaurant"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_admin_chart_revenue_by_restaurant"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_admin_chart_revenue_by_restaurant"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_admin_chart_revenue_by_restaurant"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_admin_dashboard_month_kpis"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_admin_dashboard_month_kpis"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_admin_dashboard_month_kpis"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_admin_dashboard_month_kpis"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_admin_dashboard_top_items"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone, "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_admin_dashboard_top_items"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_admin_dashboard_top_items"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_admin_dashboard_top_items"("p_month_start" timestamp with time zone, "p_month_end" timestamp with time zone, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_admin_finalize_pricing_for_day"("p_delivery_day" "date", "p_prices" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_admin_finalize_pricing_for_day"("p_delivery_day" "date", "p_prices" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_admin_finalize_pricing_for_day"("p_delivery_day" "date", "p_prices" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_admin_list_orders"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer, "p_cursor_created_at" timestamp with time zone, "p_cursor_id" "uuid", "p_restaurant_id" "uuid", "p_status" "public"."order_status") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_admin_list_orders"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer, "p_cursor_created_at" timestamp with time zone, "p_cursor_id" "uuid", "p_restaurant_id" "uuid", "p_status" "public"."order_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_admin_list_orders"("p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer, "p_cursor_created_at" timestamp with time zone, "p_cursor_id" "uuid", "p_restaurant_id" "uuid", "p_status" "public"."order_status") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_admin_truck_load_summary"("p_delivery_date" "date", "p_tz" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_admin_truck_load_summary"("p_delivery_date" "date", "p_tz" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_admin_truck_load_summary"("p_delivery_date" "date", "p_tz" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_admin_truck_load_summary"("p_delivery_date" "date", "p_tz" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_clear_cart"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_clear_cart"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_clear_cart"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_create_order_from_cart"("p_restaurant_id" "uuid", "p_delivery_at" timestamp with time zone, "p_payment_method" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_create_order_from_cart"("p_restaurant_id" "uuid", "p_delivery_at" timestamp with time zone, "p_payment_method" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_create_order_from_cart"("p_restaurant_id" "uuid", "p_delivery_at" timestamp with time zone, "p_payment_method" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_employee_list_orders"("p_limit" integer, "p_cursor_created_at" timestamp with time zone, "p_cursor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_employee_list_orders"("p_limit" integer, "p_cursor_created_at" timestamp with time zone, "p_cursor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_employee_list_orders"("p_limit" integer, "p_cursor_created_at" timestamp with time zone, "p_cursor_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_employee_truck_load_summary"("p_delivery_date" "date", "p_tz" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_employee_truck_load_summary"("p_delivery_date" "date", "p_tz" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_employee_truck_load_summary"("p_delivery_date" "date", "p_tz" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_employee_truck_load_summary"("p_delivery_date" "date", "p_tz" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_get_cart_with_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_get_cart_with_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_get_cart_with_items"() TO "service_role";



GRANT ALL ON TABLE "public"."carts" TO "anon";
GRANT ALL ON TABLE "public"."carts" TO "authenticated";
GRANT ALL ON TABLE "public"."carts" TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_get_or_create_cart"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_get_or_create_cart"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_get_or_create_cart"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_get_order_details"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_get_order_details"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_order_items_rollup_apply"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_order_items_rollup_apply"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_order_items_rollup_apply"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_remove_favorite_item"("p_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_remove_favorite_item"("p_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_remove_favorite_item"("p_item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_cart_item_quantity"("p_cart_item_id" "uuid", "p_new_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_cart_item_quantity"("p_cart_item_id" "uuid", "p_new_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_cart_item_quantity"("p_cart_item_id" "uuid", "p_new_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_profiles_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_profiles_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_profiles_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "service_role";
























GRANT ALL ON TABLE "public"."admin_new_user_email_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_new_user_email_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_new_user_email_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "service_role";
GRANT SELECT ON TABLE "public"."admin_users" TO "authenticated";



GRANT ALL ON TABLE "public"."employee_restaurant_relation" TO "anon";
GRANT ALL ON TABLE "public"."employee_restaurant_relation" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_restaurant_relation" TO "service_role";



GRANT ALL ON TABLE "public"."favorite_items" TO "anon";
GRANT ALL ON TABLE "public"."favorite_items" TO "authenticated";
GRANT ALL ON TABLE "public"."favorite_items" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."me" TO "anon";
GRANT ALL ON TABLE "public"."me" TO "authenticated";
GRANT ALL ON TABLE "public"."me" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_batch_item_prices" TO "anon";
GRANT ALL ON TABLE "public"."pricing_batch_item_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_batch_item_prices" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_batches" TO "anon";
GRANT ALL ON TABLE "public"."pricing_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_batches" TO "service_role";



GRANT ALL ON TABLE "public"."v_items_with_favorite" TO "anon";
GRANT ALL ON TABLE "public"."v_items_with_favorite" TO "authenticated";
GRANT ALL ON TABLE "public"."v_items_with_favorite" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































revoke delete on table "public"."admin_users" from "anon";

revoke insert on table "public"."admin_users" from "anon";

revoke references on table "public"."admin_users" from "anon";

revoke select on table "public"."admin_users" from "anon";

revoke trigger on table "public"."admin_users" from "anon";

revoke truncate on table "public"."admin_users" from "anon";

revoke update on table "public"."admin_users" from "anon";

revoke delete on table "public"."admin_users" from "authenticated";

revoke insert on table "public"."admin_users" from "authenticated";

revoke references on table "public"."admin_users" from "authenticated";

revoke trigger on table "public"."admin_users" from "authenticated";

revoke truncate on table "public"."admin_users" from "authenticated";

revoke update on table "public"."admin_users" from "authenticated";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


