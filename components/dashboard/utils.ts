import type { Order } from '@/lib/supabase';

/**
 * Returns the greeting word for a given local time.
 * <12 → 'Good morning', <17 → 'Good afternoon', else → 'Good evening'.
 */
export function greetingForHour(
  d: Date
): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Returns the abbreviated previous-month label (e.g. 'Apr') for a reference
 * date. Handles year boundaries: previousMonthLabel(new Date(2026, 0, 5)) === 'Dec'.
 */
export function previousMonthLabel(now: Date): string {
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString(
    'en-US',
    { month: 'short' }
  );
}

export type Mtd = {
  ordersThisMonth: number;
  ordersLastMonth: number;
  spendThisMonthCents: number;
  spendLastMonthCents: number;
};

/**
 * Walks the order list once and aggregates counts + spend (in cents) for the
 * current calendar month and the previous calendar month.
 *
 * Spend uses `final_total_amount ?? total_amount`, rounded to cents.
 * Orders outside both buckets (e.g. older than last month) are ignored.
 */
export function aggregateMtd(orders: Order[], now: Date): Mtd {
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const prev = new Date(thisYear, thisMonth - 1, 1);
  const prevYear = prev.getFullYear();
  const prevMonth = prev.getMonth();

  const out: Mtd = {
    ordersThisMonth: 0,
    ordersLastMonth: 0,
    spendThisMonthCents: 0,
    spendLastMonthCents: 0,
  };

  for (const o of orders) {
    const d = new Date(o.created_at);
    const y = d.getFullYear();
    const m = d.getMonth();
    const amount = o.final_total_amount ?? o.total_amount ?? 0;
    const cents = Math.round(amount * 100);

    if (y === thisYear && m === thisMonth) {
      out.ordersThisMonth += 1;
      out.spendThisMonthCents += cents;
    } else if (y === prevYear && m === prevMonth) {
      out.ordersLastMonth += 1;
      out.spendLastMonthCents += cents;
    }
  }

  return out;
}

/**
 * Compact dollars formatter for KPI values.
 * 0          → '$0'
 * < 100000   → '$842'   (whole dollars, no decimal — input is cents)
 * >= 100000  → '$3.2K'  (one decimal)
 */
export function formatCompactDollars(cents: number): string {
  if (cents <= 0) return '$0';
  const dollars = Math.round(cents / 100);
  if (dollars < 1000) return `$${dollars}`;
  const k = (dollars / 1000).toFixed(1);
  return `$${k}K`;
}

/**
 * Sub-line for a KPI tile expressing month-over-month change.
 *  - now=0, prev=0       → 'No orders yet'
 *  - prev=0, now>0       → 'New this month'
 *  - both>0              → '↑ 12% vs Apr' or '↓ 4% vs Apr'
 */
export function formatChange(
  now: number,
  prev: number,
  prevMonthLabel: string
): string {
  if (now === 0 && prev === 0) return 'No orders yet';
  if (prev === 0) return 'New this month';
  const pct = Math.round(((now - prev) / prev) * 100);
  const arrow = pct >= 0 ? '↑' : '↓';
  return `${arrow} ${Math.abs(pct)}% vs ${prevMonthLabel}`;
}
