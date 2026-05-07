# Order History Redesign

**Date:** 2026-05-07
**Status:** Approved
**Reference:** `V1 _ Refined classic.png`

---

## Overview

Redesign the user-facing order history screen (`app/orders.tsx`) to match the reference design. Adds a KPI summary row, search bar, date-grouped order list, improved order cards with delivery window display, and a Reorder action. No schema changes required.

---

## Scope

**In scope:**
- Redesign `app/orders.tsx` screen
- New `components/OrderHistoryCard.tsx` component
- New `components/OrderHistoryKPIRow.tsx` component
- Update `OrderFilterTabs` to display counts alongside labels
- Date-grouped `SectionList` with TODAY / YESTERDAY / older sections
- Client-side search filter over order ID
- Reorder button: fetch items → add to cart → toast feedback
- Delivery window inferred from `delivery_at` hour (no schema change)

**Out of scope:**
- Admin or employee order list screens (untouched)
- Delivery window schema migration
- Product avatar row on order cards
- Server-side search

---

## Architecture

### Component tree

```
app/orders.tsx  (screen orchestrator)
  ├── OrderHistoryHeader        (inline, simple)
  ├── OrderHistoryKPIRow        components/OrderHistoryKPIRow.tsx
  ├── ThemedSearchBar           existing component
  ├── OrderFilterTabs           existing component (updated with counts)
  └── SectionList
        ├── Section header      (inline render)
        └── OrderHistoryCard    components/OrderHistoryCard.tsx
              └── Reorder button (self-contained action)
```

### State & computed data (`app/orders.tsx`)

All derived values computed with `useMemo`:

| Name | Derivation |
|------|-----------|
| `searchQuery` | `useState('')` — controlled by `ThemedSearchBar` |
| `activeFilter` | `useState<FilterStatus>('all')` — existing pattern |
| `searchFiltered` | Full order list filtered by `order.id.includes(searchQuery.toLowerCase())` |
| `filteredOrders` | `searchFiltered` further filtered by `activeFilter` status |
| `kpiCounts` | Computed from **full unfiltered** list: `thisMonth` (current calendar month), `pending`, `inTransit` |
| `filterCounts` | Computed from `searchFiltered`: counts per status for tab labels |
| `groupedOrders` | `filteredOrders` bucketed into SectionList sections (see Date Grouping) |

---

## Components

### `OrderHistoryKPIRow` (`components/OrderHistoryKPIRow.tsx`)

Props: `thisMonth: number`, `pending: number`, `inTransit: number`

Three equal-width cards in a horizontal row with `Spacing.s3` (12px) gap.

| Card | Value prop | Left border color | Label |
|------|-----------|-------------------|-------|
| This Month | `thisMonth` | `colors.primary` | `THIS MONTH` |
| Pending | `pending` | `colors.warning` | `PENDING` |
| In Transit | `inTransit` | `colors.info` | `IN TRANSIT` |

Each card:
- Background: `colors.surface`
- Left border: 4px solid, status color, `Radius.md` (12px) on card
- Count: `FontSize.h2` (24px) bold, `colors.text`
- Label: `FontSize.small` (12px), `colors.textSecondary`
- Shadow: `Shadow.sm`
- Padding: `Spacing.s3` (12px)

---

### `OrderHistoryCard` (`components/OrderHistoryCard.tsx`)

Props: `order: Order`, `onPress: () => void`

```
┌─ 4px status color border ──────────────────────────────┐
│  #a91f0e22 · May 7, 2026              $184.50           │
│  Delivery Tomorrow · 6–9 AM    [In Transit] [Reorder]  │
└────────────────────────────────────────────────────────┘
```

**Row 1 (top):**
- Order ID: `#` + first 8 chars of `order.id`, `FontSize.body` semibold, `colors.text`
- Separator: `·` in `colors.textSecondary`
- Date: `order.created_at` formatted as "May 7, 2026", `FontSize.label`, `colors.textSecondary`
- Total (right-aligned): `FontSize.body` bold, `colors.primary`. If `final_total_amount` is null, show "Price not final" in `FontSize.small` `colors.textSecondary` below

**Row 2 (bottom):**
- Delivery line: "Delivery [relative day] · [window]" — `FontSize.label`, `colors.textSecondary`
  - Relative day: "Today" / "Tomorrow" / weekday name based on `delivery_at` date
  - Window: inferred from `new Date(delivery_at).getHours()` → 6 = "6–9 AM", 14 = "2–5 PM", else omitted
  - If `delivery_at` is null: show "No delivery date"
- Status badge (right): existing `formatStatus` + `STATUS_CONFIG` pattern, color-coded background
- Reorder button (right of badge): see Reorder Action below

**Card shell:**
- Background: `colors.surface`
- Border radius: `Radius.md` (12px)
- Shadow: `Shadow.sm`
- Padding: `Spacing.s4` (16px)
- Left border: 4px solid, `getStatusColor(order.status, colors)`
- Pressable (outer): `TouchableOpacity` opacity 0.7, calls `onPress` to navigate to order detail
- Reorder button is nested with `onPress` + `event.stopPropagation()` to prevent card navigation

---

### Reorder Action (inside `OrderHistoryCard`)

Self-contained — no props needed beyond the `order`.

**Flow:**
1. User presses "Reorder"
2. Set local `isReordering = true` — button shows spinner and disables itself
3. Fetch items imperatively via `queryClient.fetchQuery(['orderDetails', order.id], ...)` — respects cache (instant if user previously viewed order detail), falls back to network fetch
4. For each item, call the cart add mutation with `{ productId, quantity }` — adds on top of any existing cart contents (does not replace)
5. On all success: show success toast "Items added to cart"
6. On any failure: show error toast "Some items could not be added"
7. Set `isReordering = false`

**Note for implementation:** verify exact cart mutation hook name (likely `useAddToCart` or similar in `hooks/useCart.ts`) before implementing step 4.

**Button style:** small outline variant — transparent background, `colors.primary` border (1px) and text, `FontSize.small`, `Radius.pill`, horizontal padding `Spacing.s3` (12px), height 28px.

---

### Filter Tabs (updated)

Update `OrderFilterTabs` to accept `counts: Record<FilterStatus, number>` prop and render labels as "All 10", "Pending 2", etc.

Counts are derived from `searchFiltered` (post-search, pre-status-filter) so they reflect the current search context.

---

## Date Grouping

Computed in `app/orders.tsx` as a `SectionList`-compatible array:

```typescript
type Section = { title: string; data: Order[] };
```

| Section title | Condition on `order.created_at` |
|--------------|--------------------------------|
| `TODAY · N` | Same calendar date as today |
| `YESTERDAY · N` | Yesterday's calendar date |
| `MON MAY 5 · N` | Older — formatted as `ddd MMM D` uppercase |

Orders within each section: sorted newest-first by `created_at`.

**Section header style:**
- `FontSize.small` (12px), `FontWeight.semibold`, `colors.textSecondary`, uppercase
- Horizontal padding: `Spacing.s5` (20px), vertical: `Spacing.s2` (8px)
- Thin `colors.border` divider line above (except first section)

---

## Delivery Window Inference

```typescript
function inferDeliveryWindow(deliveryAt: string | null): string | null {
  if (!deliveryAt) return null;
  const hour = new Date(deliveryAt).getHours();
  if (hour === 6) return '6–9 AM';
  if (hour === 14) return '2–5 PM';
  return null;
}
```

```typescript
function relativeDeliveryDay(deliveryAt: string | null): string | null {
  if (!deliveryAt) return null;
  const today = new Date();
  const delivery = new Date(deliveryAt);
  const diffDays = differenceInCalendarDays(delivery, today);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return format(delivery, 'EEEE'); // e.g., "Wednesday"
}
```

Combined display: `"Delivery Tomorrow · 6–9 AM"` or `"Delivery Wednesday"` (if window unknown).

---

## Files Changed

| File | Change |
|------|--------|
| `app/orders.tsx` | Full rewrite — new layout, state, SectionList, search, KPI |
| `components/OrderHistoryCard.tsx` | New file |
| `components/OrderHistoryKPIRow.tsx` | New file |
| `components/OrderListItem.tsx` | Update `OrderFilterTabs` to accept + display counts |

---

## Design Tokens Used

All from `DESIGN.md`:
- Colors: `primary`, `warning`, `info`, `surface`, `text`, `textSecondary`, `border`, `orderStatus.*`
- Spacing: `s2`, `s3`, `s4`, `s5`
- Radius: `md`, `pill`
- Shadow: `sm`
- FontSize: `h1`, `h2`, `body`, `label`, `small`
- FontWeight: `semibold`, `bold`
