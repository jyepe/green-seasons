-- Migration: remove in_transit status filter from fn_employee_truck_load_summary

CREATE OR REPLACE FUNCTION public.fn_employee_truck_load_summary(
  p_delivery_date date DEFAULT ((now() AT TIME ZONE 'America/New_York'::text))::date,
  p_tz text DEFAULT 'America/New_York'::text
)
RETURNS TABLE(
  item_id uuid,
  item_name text,
  item_image_url text,
  total_quantity bigint,
  restaurants jsonb
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH per_restaurant AS (
    SELECT
      o.restaurant_id,
      r.name AS restaurant_name,
      oi.item_id,
      oi.item_name,
      COALESCE(oi.image_url, i.image_url) AS item_image_url,
      SUM(oi.quantity)::bigint AS quantity
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    JOIN public.restaurants r ON r.id = o.restaurant_id
    LEFT JOIN public.items i ON i.id = oi.item_id
    WHERE
      ((o.delivery_at AT TIME ZONE p_tz)::date = p_delivery_date)
      AND EXISTS (
        SELECT 1
        FROM public.employee_restaurant_relation err
        WHERE err.employee_id = auth.uid()
          AND err.restaurant_id = o.restaurant_id
      )
    GROUP BY
      o.restaurant_id, r.name,
      oi.item_id, oi.item_name,
      COALESCE(oi.image_url, i.image_url)
  )
  SELECT
    pr.item_id,
    pr.item_name,
    pr.item_image_url,
    SUM(pr.quantity)::bigint AS total_quantity,
    jsonb_agg(
      jsonb_build_object(
        'restaurant_id', pr.restaurant_id,
        'restaurant_name', pr.restaurant_name,
        'quantity', pr.quantity
      )
      ORDER BY pr.restaurant_name
    ) AS restaurants
  FROM per_restaurant pr
  GROUP BY pr.item_id, pr.item_name, pr.item_image_url
  ORDER BY total_quantity DESC, pr.item_name ASC;
$$;
