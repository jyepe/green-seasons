# Dashboard Tab Redesign — Restaurant Owner

**Date:** 2026-05-03
**Branch:** `feature/dashboard-tab-redesign` (off `preview`)
**Scope:** Redesign of `app/(tabs)/index.tsx` (the home/dashboard tab) for the restaurant owner role only. No backend changes, no admin/employee dashboard changes. The existing admin redirect at the top of `index.tsx` is preserved verbatim.

## Goal

Match the visual language of the Anthropic-design template (`Dashboard Tab.html` + `dashboard.jsx`) with its tweak defaults applied — the user's final landing state is **minimal**: greeting + 2 KPI tiles + recent orders card. Visual fidelity to the template is the success criterion. We bind to existing app data via existing hooks; sub-lines that have no backend source are replaced with honest alternatives, not faked.

## Source of truth

The handoff bundle is unpacked at `.design-ref/` (gitignored). Files of interest:

- `.design-ref/project/Dashboard Tab.html` — top-level tweak defaults; `EDITMODE-BEGIN` block represents the user's final landing state
- `.design-ref/project/dashboard.jsx` — full screen implementation (greeting, KPIs, recent rows, plus other sections that are off by default)
- `.design-ref/project/colors_and_type.css` — token names (already mirrored in `constants/Colors.ts`)
- `.design-ref/chats/chat3.md` — the design-iteration transcript for the dashboard

The template ships with extra sections (Today's delivery hero, Quick actions, "Reorder your usuals" rail, "Peak this week", Spring banner). All are toggled **off** in `EDITMODE-BEGIN`. They are **out of scope**; only the three sections below are implemented.

## Scope decisions

| Decision           | Choice                                                                                   | Rationale                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sections rendered  | Greeting, 2 KPIs (Orders MTD + Spend MTD), Recent orders (3 rows)                        | Match the template's `EDITMODE-BEGIN` defaults exactly. Other sections deferred to follow-up work.                                                                                                 |
| KPI sub-lines      | Computed prior-month comparison; **drop "of $4K budget"**                                | No `monthly_budget` field exists in the schema; faking it is a lie. Both tiles use the `↑/↓ x% vs <prevMonth>` shape, with `New this month` / `No orders yet` fallbacks.                           |
| Reorder action     | **Decorative**; row taps navigate to `/order/[id]`                                       | The mock's right-edge "Reorder" text is rendered as a visual tease, but the whole row is the tappable target. Real reorder flow deferred. The detail screen already exists for any reorder action. |
| Notifications bell | **Dropped**                                                                              | No `/notifications` screen and no notification backend. Mock's bell + red dot would be a fake affordance.                                                                                          |
| Greeting time      | Computed from local time (`Good morning` <12, `Good afternoon` <17, `Good evening` else) | Mock hardcodes "Good morning"; real users hit this any hour.                                                                                                                                       |
| Empty state        | Inline empty state inside the recent-orders card                                         | Avoids redirecting to a separate empty screen. Leaf icon + "No orders yet" + "Browse produce" CTA → `/(tabs)/explore`.                                                                             |
| Loading state      | `…` value + skeleton sub-line bar in KPI tiles; 3 placeholder rows in recent card        | No shimmer animation — matches existing project simplicity.                                                                                                                                        |
| Error state        | Folded into empty state (KPIs `0`, recent card empty)                                    | Matches the rest of the app, which doesn't surface React Query errors inline. Acceptable for a visual redesign.                                                                                    |
| Styling            | React Native `StyleSheet` only                                                           | Matches every other screen and the precedent set by the profile redesign.                                                                                                                          |
| Background         | Flat `colors.background` — no radial gradient                                            | Mock's body radial gradient is decorative; RN gradient overhead isn't worth it. Cart and other screens use flat backgrounds too.                                                                   |
| Safe-area handling | `useSafeAreaInsets()` in the header, no full `SafeAreaView` wrapper                      | Matches the profile-redesign pattern for tab screens; ScrollView gets `contentContainerStyle.paddingBottom: 24` for the tab bar.                                                                   |

## File layout

```
components/dashboard/
  DashboardHeader.tsx        — minimal greeting (no avatar, no bell)
  KpiTile.tsx                — icon tile + value + label + sub-line (skeleton-aware)
  KpiRow.tsx                 — flex row of two KpiTile children
  RecentOrderRow.tsx         — round status icon + id + total + meta + Reorder text
  RecentOrdersCard.tsx       — section header + card with rows OR EmptyOrdersInline
  EmptyOrdersInline.tsx      — leaf icon + "No orders yet" + "Browse produce" button
  utils.ts                   — greetingForHour(), monthBounds(), aggregateMtd()
  index.ts                   — barrel export
app/(tabs)/index.tsx         — rewritten orchestrator (~120 LOC)
```

`.design-ref/` and `.superpowers/` remain gitignored.

## Component contracts

### `DashboardHeader`

```ts
type Props = {
  firstName: string; // 'Tony' (fallback 'there' — orchestrator uses `userInfo?.first_name || 'there'` so empty strings also fall back)
  restaurantName?: string; // omitted when falsy
  isLoading?: boolean; // when true, replaces firstName + storefront row with skeleton bars
};
```

Layout: `paddingHorizontal: 20`, `paddingTop: insets.top + 10`, `paddingBottom: 8`, `flexDirection: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`. Right slot is empty (no bell). The title block fills the row.

| Element              | Style                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Good morning,` line | `fontSize: 13, fontFamily: 'Inter_500Medium', color: textSecondary`                                          |
| First name           | `fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.26, lineHeight: 30, marginTop: 1, color: text` |
| Storefront row       | `flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4`                                           |
| Storefront icon      | `Ionicons name="storefront-outline" size={13} color={textSecondary}`                                         |
| Restaurant name      | `fontSize: 13, fontFamily: 'Inter_400Regular', color: textSecondary` (numberOfLines={1})                     |

When `isLoading`: the `Good morning,` line still renders (greeting doesn't depend on profile), but firstName is replaced by a `width: 160, height: 26, borderRadius: 6, backgroundColor: border, marginTop: 1` skeleton bar, and the storefront row is replaced by a `width: 110, height: 13, borderRadius: 4, backgroundColor: border, marginTop: 6` bar.

Greeting word ("Good morning" / "Good afternoon" / "Good evening") is computed by `greetingForHour(new Date())` once on mount.

### `KpiTile`

```ts
type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string; // '24' | '$3.2K' | '…'
  sub?: string; // '↑ 12% vs Apr' | 'No orders yet' | 'New this month' | undefined
  isLoading?: boolean;
};
```

`flex: 1, backgroundColor: surface, borderRadius: 14, padding: 14, minWidth: 0`. Light: `shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: {width: 0, height: 2}, elevation: 2`. Dark: `borderWidth: 1, borderColor: border` (no shadow).

| Element   | Style                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Icon chip | `width: 30, height: 30, borderRadius: 9, backgroundColor: iconColor + '1F', alignItems/justifyContent: 'center'` |
| Icon      | `Ionicons size={16} color={iconColor}`                                                                           |
| Value     | `fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.2, lineHeight: 22, marginTop: 10, color: text`     |
| Label     | `fontSize: 11, fontFamily: 'Inter_500Medium', color: textSecondary, marginTop: 2`                                |
| Sub       | `fontSize: 10, fontFamily: 'Inter_400Regular', color: textTertiary, marginTop: 1`                                |

When `isLoading`: `value` shows `…`, `sub` is omitted, and a skeleton bar (`width: 80, height: 10, borderRadius: 4, backgroundColor: border, marginTop: 4`) renders in place of the sub-line. The icon chip and label always render (they don't depend on order data).

### `KpiRow`

`paddingHorizontal: 20, paddingTop: 16, flexDirection: 'row', gap: 10`. Children are two `KpiTile`s.

### `RecentOrdersCard`

```ts
type Props = {
  orders: Order[]; // pre-sliced to 3 by orchestrator
  isLoading: boolean;
  onSeeAll: () => void; // → /orders
  onBrowseProduce: () => void; // → /(tabs)/explore
  onPressRow: (id: string) => void; // → /order/[id]
};
```

Two-part structure:

1. **Section header** — `paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'`.
   - Title `Recent orders` — `fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.17, color: text`.
   - Action `History` — `TouchableOpacity` with `fontSize: 12, fontFamily: 'Inter_600SemiBold', color: primary`. `onPress = onSeeAll`. **Hidden when `orders.length === 0`** (no history to show).

2. **Card** — `marginHorizontal: 20, backgroundColor: surface, borderRadius: 14, overflow: 'hidden'` plus the same shadow/dark-border treatment as `KpiTile`. Inside:
   - If `isLoading` → 3 skeleton rows (36×36 rounded square + two stacked bars `130×11` then `90×9`, all `colors.border`, same row layout/spacing as a real row).
   - Else if `orders.length === 0` → `EmptyOrdersInline` with `onBrowseProduce`.
   - Else → 1–3 `RecentOrderRow` instances. Last row gets `isLast={true}` to suppress the bottom hairline.

### `RecentOrderRow`

```ts
type Props = {
  order: Order;
  isLast: boolean;
  onPress: () => void;
};
```

`TouchableOpacity` with `paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12`. When not `isLast`: `borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border`.

| Element            | Style                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status icon tile   | `width: 36, height: 36, borderRadius: 10, backgroundColor: orderStatus[status] + '1F', alignItems/justifyContent: 'center'`                          |
| Status icon        | `Ionicons name={STATUS_CONFIG[status].icon} size={18} color={orderStatus[status]}` (reuse `STATUS_CONFIG` already exported from `OrderListItem.tsx`) |
| Body               | `flex: 1, minWidth: 0`                                                                                                                               |
| Top row (id+total) | `flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8`                                                              |
| Order id           | `#${order.id.slice(0, 8)}` — `fontSize: 13, fontFamily: 'Inter_600SemiBold', color: text` (matches existing `BaseOrderListItem` convention)          |
| Total              | `formatCurrency(order.final_total_amount ?? order.total_amount)` — `fontSize: 13, fontFamily: 'Inter_700Bold', color: text`                          |
| Bottom row         | `flexDirection: 'row', justifyContent: 'space-between', marginTop: 2`                                                                                |
| Meta               | `${formatDate(order.delivery_at ?? order.created_at)}` — `fontSize: 11, fontFamily: 'Inter_400Regular', color: textSecondary`                        |
| Reorder text       | `fontSize: 11, fontFamily: 'Inter_600SemiBold', color: primary` — decorative; the whole row is the tap target                                        |

`formatCurrency` is imported from `@/utils/currency`. `formatDate` and `STATUS_CONFIG` are imported from `@/components/OrderListItem` (already exported). Item count is **not** rendered — `getOrdersForUser`'s row shape does not include items, and joining them per row is out of scope.

### `EmptyOrdersInline`

```ts
type Props = {
  onBrowseProduce: () => void;
};
```

Inside the recent-orders card surface:

- Wrapper: `paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center'`.
- Icon: `Ionicons name="leaf-outline" size={36} color={textTertiary}`.
- Title: `No orders yet` — `fontSize: 14, fontFamily: 'Inter_600SemiBold', color: text, marginTop: 10`.
- Subtitle: `Place your first order to see it here` — `fontSize: 12, fontFamily: 'Inter_400Regular', color: textSecondary, marginTop: 4, textAlign: 'center'`.
- Button: `Browse produce` — `TouchableOpacity` with `marginTop: 14, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: primary, borderRadius: 999`. Label: `fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff'`. `onPress = onBrowseProduce`.

### `utils.ts`

```ts
export function greetingForHour(
  d: Date
): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export type Mtd = {
  ordersThisMonth: number;
  ordersLastMonth: number;
  spendThisMonthCents: number;
  spendLastMonthCents: number;
};

export function aggregateMtd(orders: Order[], now: Date): Mtd;
// Walks orders once. For each, parses created_at, buckets into this/last
// calendar month (Y+M match for "this", Y+M of (now - 1 month) for "last").
// Spend uses Math.round((final_total_amount ?? total_amount) * 100).

export function previousMonthLabel(now: Date): string;
// new Date(now.getFullYear(), now.getMonth() - 1, 1)
//   .toLocaleString('en-US', { month: 'short' }) — e.g. 'Apr'.
// JS Date overflow handles January correctly: Date(2026, -1, 1) → Dec 1 2025.

export function formatCompactDollars(cents: number): string;
// < $1000 → '$842' (whole dollars)
// >= $1000 → '$3.2K' (one decimal)
// 0 → '$0'

export function formatChange(
  now: number,
  prev: number,
  prevMonthLabel: string
): string;
// (0, 0, _)        → 'No orders yet'
// (n, 0, _) n>0    → 'New this month'
// otherwise        → '↑ 12% vs Apr' or '↓ 4% vs Apr' (Math.round of pct)
```

## Data flow

```
useUserInfo()        → first_name, owned_restaurant_id, role gate
useRestaurant(id)    → name (storefront row)
useOrders(userId)    → full Order[] (sorted desc by created_at)
useAdmin()           → admin redirect (existing logic preserved)
```

No new hooks, no new RPCs, no schema changes.

The orchestrator (`app/(tabs)/index.tsx`):

```tsx
export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const { data: userInfo } = useUserInfo();
  const { data: restaurant } = useRestaurant(userInfo?.owned_restaurant_id);
  const { data: orders = [], isLoading: ordersLoading } = useOrders(
    userInfo?.id
  );
  const { data: isUserAdmin, isLoading: isAdminLoading } = useAdmin();

  // Existing admin redirect — preserved verbatim
  useEffect(() => {
    if (!isAdminLoading && isUserAdmin === true) {
      router.replace('/admin/(tabs)');
    }
  }, [isUserAdmin, isAdminLoading, router]);
  if (!isAdminLoading && isUserAdmin === true) return null;

  const now = useMemo(() => new Date(), []);
  const mtd = useMemo(() => aggregateMtd(orders, now), [orders, now]);
  const prevLabel = useMemo(() => previousMonthLabel(now), [now]);
  const recent = orders.slice(0, 3);

  const ordersValue = ordersLoading ? '…' : String(mtd.ordersThisMonth);
  const ordersSub = ordersLoading
    ? undefined
    : formatChange(mtd.ordersThisMonth, mtd.ordersLastMonth, prevLabel);
  const spendValue = ordersLoading
    ? '…'
    : formatCompactDollars(mtd.spendThisMonthCents);
  const spendSub = ordersLoading
    ? undefined
    : formatChange(mtd.spendThisMonthCents, mtd.spendLastMonthCents, prevLabel);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <DashboardHeader
          firstName={userInfo?.first_name || 'there'}
          restaurantName={restaurant?.name}
          isLoading={!userInfo}
        />
        <KpiRow>
          <KpiTile
            icon="cube-outline"
            iconColor={colors.primary}
            label="Orders MTD"
            value={ordersValue}
            sub={ordersSub}
            isLoading={ordersLoading}
          />
          <KpiTile
            icon="cash-outline"
            iconColor={colors.accentWarm}
            label="Spend MTD"
            value={spendValue}
            sub={spendSub}
            isLoading={ordersLoading}
          />
        </KpiRow>
        <RecentOrdersCard
          orders={recent}
          isLoading={ordersLoading}
          onSeeAll={() => router.push('/orders')}
          onBrowseProduce={() => router.push('/(tabs)/explore')}
          onPressRow={id =>
            router.push({ pathname: '/order/[id]', params: { id } })
          }
        />
      </ScrollView>
    </View>
  );
}
```

## Visual structure summary

Vertical order on screen, top to bottom:

1. **Header** — `paddingTop: insets.top + 10`, `paddingBottom: 8`, paddingX 20.
2. **KPI row** — paddingTop 16, paddingX 20, gap 10.
3. **Section header** — paddingTop 24, paddingBottom 10, paddingX 20.
4. **Recent orders card** — marginX 20.
5. ScrollView paddingBottom: 24 (tab bar provides its own backdrop).

All surface cards use `borderRadius: 14`, light-mode shadow (`shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: {0, 2}, elevation: 2`), dark-mode 1px `colors.border`.

## Tokens used

All from `Colors[colorScheme]` — no new tokens.

- `primary` — KPI A icon chip, History link, Reorder text, "Browse produce" button.
- `accentWarm` — KPI B icon chip.
- `surface`, `background`, `border`, `text`, `textSecondary`, `textTertiary`.
- `orderStatus[status]` — round status icon tile per row.

## Verification gate

There is no test runner configured (per `CLAUDE.md`); the gate is typecheck + lint + manual UI walk-through.

1. `npm run check-all` — typecheck + lint + prettier. Must pass.
2. Manual visual on a real device or simulator at iPhone 15 Pro size in light **and** dark mode:
   - Greeting hour rotates correctly (force `now.getHours()` to 8/14/20 if needed).
   - KPI sub-line variants: positive change, negative change, `New this month`, `No orders yet`.
   - Recent rows: each status (`pending`/`in_transit`/`delivered`) renders the correct icon and tinted tile.
   - Empty state: log in as a fresh user with zero orders.
   - Tap targets: row → `/order/[id]`, History → `/orders`, Browse produce → `/(tabs)/explore`.
3. No new console warnings on mount.

## Out of scope (deferred)

- Today's delivery hero card (would require driver/truck/stop fields and progress logic that don't exist server-side).
- "Reorder your usuals" horizontal rail (needs derived "frequently ordered" list from history).
- Quick actions row, Spring promo banner, Peak this week section.
- A real reorder action (clone past order's items into cart). Today the row navigates to `/order/[id]`; the green Reorder text is decorative.
- Notifications bell + screen.
- Admin dashboard / employee dashboard redesigns. This spec touches the restaurant owner tab only.
- Monthly budget feature for the Spend tile sub-line.
