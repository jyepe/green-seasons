# Dashboard Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the restaurant-owner dashboard tab (`app/(tabs)/index.tsx`) to match the Anthropic-design template's minimal landing state — greeting + 2 KPI tiles (Orders MTD + Spend MTD) + recent orders card with inline empty state. No backend changes.

**Architecture:** Decompose into small focused presentational pieces under `components/dashboard/` (`DashboardHeader`, `KpiTile`, `KpiRow`, `RecentOrderRow`, `RecentOrdersCard`, `EmptyOrdersInline`, `utils`) plus a thin orchestrator at `app/(tabs)/index.tsx` that wires existing TanStack Query hooks (`useUserInfo`, `useRestaurant`, `useOrders`, `useAdmin`) to those pieces. KPI sub-lines use computed prior-month comparison from `useOrders` data — no new RPCs, no schema changes.

**Tech Stack:** React Native (Expo 54), Expo Router 6, TypeScript strict, `@expo/vector-icons` (Ionicons), `react-native-safe-area-context`, TanStack Query.

**Verification gate:** This repo has **no test runner** (per `CLAUDE.md`). Each task's verification step is `npm run check-all` (typecheck + ESLint + Prettier). The final task adds manual visual checks against the design template.

**Branch:** `feature/dashboard-tab-redesign` (already created off `preview`). Spec: `docs/superpowers/specs/2026-05-03-dashboard-tab-redesign-design.md`. Local design reference: `.design-ref/` (gitignored).

---

## Task 1: Build dashboard utility helpers

**Files:**

- Create: `components/dashboard/utils.ts`

- [ ] **Step 1: Create the utils file**

```ts
// components/dashboard/utils.ts
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
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS (typecheck + lint + prettier all green).

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/utils.ts
git commit -m "feat(dashboard): add util helpers for greeting, MTD aggregation, and KPI formatting"
```

---

## Task 2: Build `DashboardHeader`

**Files:**

- Create: `components/dashboard/DashboardHeader.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/DashboardHeader.tsx
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { greetingForHour } from './utils';

type Props = {
  /**
   * The user's first name. Orchestrator should pass
   * `userInfo?.first_name || 'there'` so empty strings also fall back.
   */
  firstName: string;
  restaurantName?: string;
  /** When true, replaces firstName + storefront row with skeleton bars. */
  isLoading?: boolean;
};

export function DashboardHeader({
  firstName,
  restaurantName,
  isLoading,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const greeting = useMemo(() => greetingForHour(new Date()), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.titleBlock}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          {greeting},
        </Text>

        {isLoading ? (
          <View
            style={[styles.nameSkeleton, { backgroundColor: colors.border }]}
          />
        ) : (
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {firstName}
          </Text>
        )}

        {isLoading ? (
          <View
            style={[
              styles.restaurantSkeleton,
              { backgroundColor: colors.border },
            ]}
          />
        ) : restaurantName ? (
          <View style={styles.restaurantRow}>
            <Ionicons
              name="storefront-outline"
              size={13}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.restaurant, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {restaurantName}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  name: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.26,
    lineHeight: 30,
    marginTop: 1,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  restaurant: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
  nameSkeleton: {
    width: 160,
    height: 26,
    borderRadius: 6,
    marginTop: 1,
  },
  restaurantSkeleton: {
    width: 110,
    height: 13,
    borderRadius: 4,
    marginTop: 6,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/DashboardHeader.tsx
git commit -m "feat(dashboard): add DashboardHeader with time-of-day greeting and skeleton state"
```

---

## Task 3: Build `KpiTile`

**Files:**

- Create: `components/dashboard/KpiTile.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/KpiTile.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  /** '24' | '$3.2K' | '…' */
  value: string;
  /** '↑ 12% vs Apr' | 'No orders yet' | undefined */
  sub?: string;
  /** When true, omits sub and renders a skeleton bar in its place. */
  isLoading?: boolean;
};

export function KpiTile({
  icon,
  iconColor,
  label,
  value,
  sub,
  isLoading,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        },
        !isDark && styles.tileShadow,
      ]}
    >
      <View style={[styles.iconChip, { backgroundColor: iconColor + '1F' }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      {isLoading ? (
        <View
          style={[styles.subSkeleton, { backgroundColor: colors.border }]}
        />
      ) : sub ? (
        <Text style={[styles.sub, { color: colors.textTertiary }]}>{sub}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    padding: 14,
  },
  tileShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
    lineHeight: 22,
    marginTop: 10,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  sub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  subSkeleton: {
    width: 80,
    height: 10,
    borderRadius: 4,
    marginTop: 4,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/KpiTile.tsx
git commit -m "feat(dashboard): add KpiTile presentational component"
```

---

## Task 4: Build `KpiRow`

**Files:**

- Create: `components/dashboard/KpiRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/KpiRow.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

/**
 * Horizontal row of KpiTile children. Lays out two tiles with 10px gap and
 * 20px horizontal screen padding; designed to live directly under the
 * DashboardHeader.
 */
export function KpiRow({ children }: Props) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/KpiRow.tsx
git commit -m "feat(dashboard): add KpiRow wrapper for KPI tiles"
```

---

## Task 5: Build `RecentOrderRow`

**Files:**

- Create: `components/dashboard/RecentOrderRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/RecentOrderRow.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import {
  STATUS_CONFIG,
  formatDate,
  getStatusColor,
} from '@/components/OrderListItem';
import { formatCurrency } from '@/utils/currency';
import type { Order } from '@/lib/supabase';

type Props = {
  order: Order;
  /** When true, suppresses the bottom hairline divider. */
  isLast: boolean;
  onPress: () => void;
};

export function RecentOrderRow({ order, isLast, onPress }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const statusColor = getStatusColor(order.status, colors);
  const total = order.final_total_amount ?? order.total_amount ?? 0;
  const dateLabel = formatDate(order.delivery_at ?? order.created_at);

  return (
    <TouchableOpacity
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.id.slice(0, 8)}, ${
        STATUS_CONFIG[order.status].label
      }, ${dateLabel}, ${formatCurrency(total)}`}
      activeOpacity={0.7}
    >
      <View style={[styles.iconTile, { backgroundColor: statusColor + '1F' }]}>
        <Ionicons
          name={STATUS_CONFIG[order.status].icon}
          size={18}
          color={statusColor}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.id, { color: colors.text }]} numberOfLines={1}>
            #{order.id.slice(0, 8)}
          </Text>
          <Text style={[styles.total, { color: colors.text }]}>
            {formatCurrency(total)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.meta, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {dateLabel}
          </Text>
          <Text style={[styles.reorder, { color: colors.primary }]}>
            Reorder
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  id: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  total: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
  reorder: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/RecentOrderRow.tsx
git commit -m "feat(dashboard): add RecentOrderRow with status-tinted icon tile"
```

---

## Task 6: Build `EmptyOrdersInline`

**Files:**

- Create: `components/dashboard/EmptyOrdersInline.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/EmptyOrdersInline.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  onBrowseProduce: () => void;
};

export function EmptyOrdersInline({ onBrowseProduce }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.wrapper}>
      <Ionicons name="leaf-outline" size={36} color={colors.textTertiary} />
      <Text style={[styles.title, { color: colors.text }]}>No orders yet</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Place your first order to see it here
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onBrowseProduce}
        accessibilityRole="button"
        accessibilityLabel="Browse produce"
        activeOpacity={0.85}
      >
        <Text style={styles.buttonLabel}>Browse produce</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  button: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  buttonLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/EmptyOrdersInline.tsx
git commit -m "feat(dashboard): add EmptyOrdersInline empty state for recent orders card"
```

---

## Task 7: Build `RecentOrdersCard`

**Files:**

- Create: `components/dashboard/RecentOrdersCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/RecentOrdersCard.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import type { Order } from '@/lib/supabase';
import { RecentOrderRow } from './RecentOrderRow';
import { EmptyOrdersInline } from './EmptyOrdersInline';

type Props = {
  /** Pre-sliced to at most 3 by the orchestrator. */
  orders: Order[];
  isLoading: boolean;
  onSeeAll: () => void;
  onBrowseProduce: () => void;
  onPressRow: (id: string) => void;
};

function SkeletonRow({
  isLast,
  borderColor,
}: {
  isLast: boolean;
  borderColor: string;
}) {
  return (
    <View
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={[styles.skeletonTile, { backgroundColor: borderColor }]} />
      <View style={styles.skeletonBody}>
        <View
          style={[styles.skeletonBarTop, { backgroundColor: borderColor }]}
        />
        <View
          style={[styles.skeletonBarBottom, { backgroundColor: borderColor }]}
        />
      </View>
    </View>
  );
}

export function RecentOrdersCard({
  orders,
  isLoading,
  onSeeAll,
  onBrowseProduce,
  onPressRow,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const showAction = isLoading || orders.length > 0;

  return (
    <View>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Recent orders
        </Text>
        {showAction ? (
          <TouchableOpacity
            onPress={onSeeAll}
            accessibilityRole="button"
            accessibilityLabel="View order history"
          >
            <Text style={[styles.action, { color: colors.primary }]}>
              History
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
          },
          !isDark && styles.cardShadow,
        ]}
      >
        {isLoading ? (
          [0, 1, 2].map(i => (
            <SkeletonRow key={i} isLast={i === 2} borderColor={colors.border} />
          ))
        ) : orders.length === 0 ? (
          <EmptyOrdersInline onBrowseProduce={onBrowseProduce} />
        ) : (
          orders.map((o, i, arr) => (
            <RecentOrderRow
              key={o.id}
              order={o}
              isLast={i === arr.length - 1}
              onPress={() => onPressRow(o.id)}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.17,
  },
  action: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // Skeleton row mirrors the live RecentOrderRow geometry
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  skeletonBody: {
    flex: 1,
    gap: 6,
  },
  skeletonBarTop: {
    width: 130,
    height: 11,
    borderRadius: 4,
  },
  skeletonBarBottom: {
    width: 90,
    height: 9,
    borderRadius: 4,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/RecentOrdersCard.tsx
git commit -m "feat(dashboard): add RecentOrdersCard with skeleton and empty states"
```

---

## Task 8: Add barrel export

**Files:**

- Create: `components/dashboard/index.ts`

- [ ] **Step 1: Create the barrel**

```ts
// components/dashboard/index.ts
export { DashboardHeader } from './DashboardHeader';
export { KpiTile } from './KpiTile';
export { KpiRow } from './KpiRow';
export { RecentOrderRow } from './RecentOrderRow';
export { RecentOrdersCard } from './RecentOrdersCard';
export { EmptyOrdersInline } from './EmptyOrdersInline';
export {
  greetingForHour,
  previousMonthLabel,
  aggregateMtd,
  formatCompactDollars,
  formatChange,
} from './utils';
export type { Mtd } from './utils';
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/index.ts
git commit -m "feat(dashboard): add barrel export for components/dashboard"
```

---

## Task 9: Rewrite `app/(tabs)/index.tsx` orchestrator

**Files:**

- Modify: `app/(tabs)/index.tsx` (full rewrite)

- [ ] **Step 1: Replace the file contents**

```tsx
// app/(tabs)/index.tsx
import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useOrders } from '@/hooks/useOrders';
import { useAdmin } from '@/hooks/useAdmin';
import {
  DashboardHeader,
  KpiRow,
  KpiTile,
  RecentOrdersCard,
  aggregateMtd,
  formatChange,
  formatCompactDollars,
  previousMonthLabel,
} from '@/components/dashboard';

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

  // Existing admin redirect — preserved verbatim from prior implementation.
  useEffect(() => {
    if (!isAdminLoading && isUserAdmin === true) {
      router.replace('/admin/(tabs)');
    }
  }, [isUserAdmin, isAdminLoading, router]);

  if (!isAdminLoading && isUserAdmin === true) {
    return null;
  }

  const now = useMemo(() => new Date(), []);
  const mtd = useMemo(() => aggregateMtd(orders, now), [orders, now]);
  const prevLabel = useMemo(() => previousMonthLabel(now), [now]);
  const recent = useMemo(() => orders.slice(0, 3), [orders]);

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
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            router.push({
              pathname: '/order/[id]',
              params: { id },
            })
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS. The biggest risk is an unused-import warning — if so, prune the unused import named in the warning and re-run. The `useEffect` and admin-redirect block must remain even if `isAdminLoading` is unused, because the redirect side effect is critical.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat(dashboard): rewrite restaurant-owner home tab as orchestrator over components/dashboard"
```

---

## Task 10: Manual visual verification

**Files:** none (verification only)

This is the visual gate before merging — there is no automated UI test suite.

- [ ] **Step 1: Boot the app on simulator/device**

Run (in a separate terminal, or whichever platform target the engineer is set up for):

```bash
npm run ios
# or
npm run android
```

Expected: app boots into the dashboard for a restaurant-owner account. No console errors on mount.

- [ ] **Step 2: Walk through the visual states for a populated user**

Confirm with a user that has at least one delivered, one in-transit, and one pending order this month:

1. Header renders `<Greeting>, <FirstName>` over a `<storefront-icon> <Restaurant name>` row. The right edge of the header is empty (no bell). Greeting word matches local time-of-day.
2. KPI row renders **Orders MTD** with the cube icon in green and **Spend MTD** with the cash icon in mango/orange. Each tile's sub-line shows either `↑ N% vs <prevMonth>`, `↓ N% vs <prevMonth>`, or `New this month` (when prev month was 0). Numbers match a hand-count of `useOrders` data filtered to current calendar month.
3. Recent orders card shows up to 3 rows with the correct status-tinted icon tile (green check / blue car / amber clock). Order id, total currency, and date all match the source data. Tapping a row navigates to `/order/[id]`. Tapping `History` navigates to `/orders`. Reorder text on each row is decorative and tapping it falls through to the row's nav.

- [ ] **Step 3: Walk through the empty state**

With a fresh user that has no orders (or by temporarily forcing `orders = []` in the orchestrator if a fresh user isn't available):

1. KPIs render `0` value with `No orders yet` sub-line.
2. Recent orders card section header still says `Recent orders` but the right-aligned `History` link is hidden.
3. Inside the card surface: leaf icon, `No orders yet`, `Place your first order to see it here`, and a green `Browse produce` pill button.
4. Tapping `Browse produce` navigates to `(tabs)/explore`.

- [ ] **Step 4: Walk through the loading state**

Force-clear the React Query cache (kill the app and re-launch on a slow connection, or temporarily comment out the `useOrders` `staleTime`/`gcTime` and reload) and observe before data arrives:

1. KPI tiles show `…` for value and a 80×10 grey skeleton bar where the sub-line would be.
2. Recent orders card shows 3 skeleton rows with a square tile and two stacked bars.
3. Header shows the greeting word and either real first name or a 160×26 grey skeleton bar (depending on `useUserInfo` state).

- [ ] **Step 5: Toggle dark mode**

Switch the device theme (or use the in-app theme toggle if available). Confirm that:

1. Surface cards switch to `colors.surface` (`#1A1F24`) with a 1px border instead of a shadow.
2. Text uses `colors.text` (light) instead of slate-900.
3. KPI icon chips and status tile tints still read clearly against the dark surface (the `+'1F'` alpha works fine on dark).

- [ ] **Step 6: No regression on adjacent tabs**

Tap each of the other tabs (Explore, Cart, Profile) and back to Home. Confirm:

1. The Home tab re-renders without errors.
2. The cart badge on the tab bar still works (this is owned by `(tabs)/_layout.tsx`, not our screen — should be untouched).

- [ ] **Step 7: Run check-all once more**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 8: Commit a no-op marker if needed**

If Step 7 surfaces any prettier/lint drift, fix and commit:

```bash
git add -u
git commit -m "chore(dashboard): apply prettier/lint fixes from final pass"
```

If everything is clean, skip the commit.

---

## Task 11: Merge into `preview`

**Files:** none (git only)

Per project workflow (see memory: `feedback_merge_workflow.md`): merge feature branches into `preview` directly via local git — **do not** open a PR. **On any merge conflict, stop and consult the user before resolving.** Other agents may have edited the same files in parallel.

- [ ] **Step 1: Make sure the feature branch is up to date and clean**

```bash
git status
```

Expected: `On branch feature/dashboard-tab-redesign`, `nothing to commit, working tree clean`. If not clean, stop and report.

- [ ] **Step 2: Sync `preview` with origin**

```bash
git checkout preview
git pull --ff-only origin preview
```

Expected: `Already up to date.` or a fast-forward summary. If `git pull` fails because the local `preview` has diverged, **stop and consult the user**.

- [ ] **Step 3: Merge the feature branch**

```bash
git merge --no-ff feature/dashboard-tab-redesign
```

Expected: a merge commit is created. If git reports conflicts (`CONFLICT (...)`):

1. Run `git status` to list the conflicted files.
2. **Stop. Do not resolve.** Report the conflicting files to the user and ask how to proceed. Other agents may be working on the same files.
3. If the user says "abort," run `git merge --abort` and return to a clean state.

- [ ] **Step 4: Run check-all on the merged tree**

```bash
npm run check-all
```

Expected: PASS. If FAIL, the merge surfaced an integration bug — stop and report to the user.

- [ ] **Step 5: Report**

Tell the user the merge is complete, what was merged (commit range), and that `preview` now contains the dashboard redesign. Do not push to origin unless the user explicitly asks. Do not delete the feature branch — leave it for reference.

---

## Self-review notes

This plan covers every section/requirement of the spec:

- **Greeting + 2 KPIs + Recent orders scope** → Tasks 2/3/4/7 + orchestrator (Task 9).
- **No bell, no "of $4K budget", no real reorder action** → reflected in component contracts (no bell prop in `DashboardHeader`; `formatChange` produces the prior-month sub-line; `RecentOrderRow.Reorder` text is decorative with no `onReorder` prop).
- **Greeting time-of-day computed locally** → `greetingForHour` (Task 1) + `useMemo` in `DashboardHeader`.
- **MTD comparison from `useOrders`** → `aggregateMtd` (Task 1) + orchestrator wiring (Task 9).
- **Loading/empty/error states** → KPI skeleton (Task 3), card skeleton + empty branch (Task 7), `EmptyOrdersInline` (Task 6). React Query errors fold into the empty branch because `data = []` default in the orchestrator handles `undefined`.
- **No `SafeAreaView` wrapper** → `DashboardHeader` uses `useSafeAreaInsets()`.
- **Flat background, light shadow / dark border treatment** → consistent in Tasks 3/7.
- **Token reuse, no new tokens** → all components import `Colors` and `useAppColorScheme`.
- **Verification gate (no test runner)** → every task ends with `npm run check-all`; Task 10 is the manual visual sweep.
- **Branch + merge workflow** → Task 11 follows the user's stated rule.

No placeholders, no TBDs, no "similar to Task N" references. Type names (`Mtd`, `Order`, `OrderStatus`) are consistent across all tasks. Method/prop names match between the contracts in the spec and the component code in the plan (`onPressRow`, `onBrowseProduce`, `onSeeAll`, `firstName`, `restaurantName`, `isLast`, `isLoading`).
