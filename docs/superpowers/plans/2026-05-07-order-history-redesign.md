# Order History Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the user-facing order history screen with a KPI summary row, client-side search, date-grouped order list, improved order cards with inferred delivery windows, and a Reorder action.

**Architecture:** New focused components (`OrderHistoryCard`, `OrderHistoryKPIRow`) built alongside existing shared utilities in `OrderListItem.tsx`. The screen (`app/orders.tsx`) is fully rewritten to own all state and computed data via `useMemo`. No schema changes — delivery window is inferred from the `delivery_at` timestamp hour. Toast state lives in the screen to avoid absolute-positioning issues inside `SectionList`; `OrderHistoryCard` receives an `onReorderComplete` callback. Reorder fetches order items via `queryClient.fetchQuery` (cache-first) and adds them to cart via `useAddToCart`.

**Tech Stack:** React Native, Expo Router, TanStack Query v5, TypeScript

---

### Task 1: Create feature branch

**Files:** none (git only)

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout preview
git checkout -b feature/redesign-order-history
```

Expected: `Switched to a new branch 'feature/redesign-order-history'`

---

### Task 2: Create `components/OrderHistoryKPIRow.tsx`

**Files:**
- Create: `components/OrderHistoryKPIRow.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight } from '@/constants/Typography';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';

interface KPICardProps {
  value: number;
  label: string;
  accentColor: string;
}

function KPICard({ value, label, accentColor }: KPICardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  return (
    <View
      style={[
        styles.card,
        Shadow.sm,
        { backgroundColor: colors.surface, borderLeftColor: accentColor },
      ]}
    >
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export interface OrderHistoryKPIRowProps {
  thisMonth: number;
  pending: number;
  inTransit: number;
}

export function OrderHistoryKPIRow({ thisMonth, pending, inTransit }: OrderHistoryKPIRowProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  return (
    <View style={styles.row}>
      <KPICard value={thisMonth} label="THIS MONTH" accentColor={colors.primary} />
      <KPICard value={pending} label="PENDING" accentColor={colors.warning} />
      <KPICard value={inTransit} label="IN TRANSIT" accentColor={colors.info} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.s3,
    paddingHorizontal: Spacing.s5,
    paddingBottom: Spacing.s3,
  },
  card: {
    flex: 1,
    borderLeftWidth: 4,
    borderRadius: Radius.md,
    padding: Spacing.s3,
  },
  value: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
  },
  label: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.s1,
    letterSpacing: 0.5,
  },
});
```

- [ ] **Step 2: TypeScript check**

```
npx tsc --noEmit
```

Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add components/OrderHistoryKPIRow.tsx
git commit -m "feat: add OrderHistoryKPIRow component"
```

---

### Task 3: Update `OrderFilterTabs` to display counts

**Files:**
- Modify: `components/OrderListItem.tsx`

`counts` is optional — existing callers (admin screens) require no changes.

- [ ] **Step 1: Add `counts` to `OrderFilterTabsProps`**

Find the `OrderFilterTabsProps` interface (around line 120) and add the optional field:

```typescript
// Before:
interface OrderFilterTabsProps {
  activeFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
}

// After:
interface OrderFilterTabsProps {
  activeFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  counts?: Record<FilterStatus, number>;
}
```

- [ ] **Step 2: Accept `counts` in the function signature**

```tsx
// Before:
export function OrderFilterTabs({
  activeFilter,
  onFilterChange,
}: OrderFilterTabsProps) {

// After:
export function OrderFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: OrderFilterTabsProps) {
```

- [ ] **Step 3: Pass count-aware label to `OrderFilterChip`**

Inside the `ScrollView`, update the `OrderFilterChip` render:

```tsx
// Before:
<OrderFilterChip
  key={status}
  label={FILTER_LABELS[status]}
  isActive={activeFilter === status}
  onPress={() => onFilterChange(status)}
/>

// After:
<OrderFilterChip
  key={status}
  label={counts != null ? `${FILTER_LABELS[status]} ${counts[status]}` : FILTER_LABELS[status]}
  isActive={activeFilter === status}
  onPress={() => onFilterChange(status)}
/>
```

- [ ] **Step 4: TypeScript check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/OrderListItem.tsx
git commit -m "feat: add optional counts display to OrderFilterTabs"
```

---

### Task 4: Create `components/OrderHistoryCard.tsx`

**Files:**
- Create: `components/OrderHistoryCard.tsx`

Verified types:
- `AddToCartParams = { itemId: string; quantityDelta?: number }` — `itemId` is the product ID
- `OrderDetailItem.item_id` is the product ID; `OrderDetailItem.quantity` is units ordered
- `ORDER_DETAILS_QUERY_KEY` exported from `hooks/useOrderDetails.ts` as `['orderDetails']`
- Toast renders at absolute screen position — lives in parent screen, card uses `onReorderComplete` callback

- [ ] **Step 1: Write the delivery window helper functions**

These go at the top of the file, before the component:

```typescript
function inferDeliveryWindow(deliveryAt: string | null | undefined): string | null {
  if (!deliveryAt) return null;
  const hour = new Date(deliveryAt).getHours();
  if (hour === 6) return '6–9 AM';
  if (hour === 14) return '2–5 PM';
  return null;
}

function relativeDeliveryDay(deliveryAt: string | null | undefined): string | null {
  if (!deliveryAt) return null;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const delivery = new Date(deliveryAt);
  const deliveryStart = new Date(
    delivery.getFullYear(),
    delivery.getMonth(),
    delivery.getDate()
  );
  const diffDays = Math.round(
    (deliveryStart.getTime() - todayStart.getTime()) / 86_400_000
  );
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return delivery.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatCardDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
```

- [ ] **Step 2: Write the full component**

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight } from '@/constants/Typography';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { getStatusColor, STATUS_CONFIG } from '@/components/OrderListItem';
import { useAddToCart } from '@/hooks/useCart';
import { getOrderDetails } from '@/lib/supabase';
import { ORDER_DETAILS_QUERY_KEY } from '@/hooks/useOrderDetails';
import { formatCurrency } from '@/utils/currency';
import type { Order } from '@/lib/supabase';

// helper functions from Step 1 go here

export interface OrderHistoryCardProps {
  order: Order;
  onPress: () => void;
  onReorderComplete: (success: boolean) => void;
}

export function OrderHistoryCard({ order, onPress, onReorderComplete }: OrderHistoryCardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();
  const { mutateAsync: addToCart } = useAddToCart();
  const [isReordering, setIsReordering] = useState(false);

  const statusColor = getStatusColor(order.status, colors);
  const { label: statusLabel } = STATUS_CONFIG[order.status];
  const deliveryDay = relativeDeliveryDay(order.delivery_at);
  const deliveryWindow = inferDeliveryWindow(order.delivery_at);
  const deliveryText = deliveryDay
    ? deliveryWindow
      ? `Delivery ${deliveryDay} · ${deliveryWindow}`
      : `Delivery ${deliveryDay}`
    : 'No delivery date';
  const displayId = `#${order.id.slice(0, 8)}`;
  const displayDate = formatCardDate(order.created_at);
  const displayTotal = formatCurrency(order.final_total_amount ?? order.total_amount);
  const priceNotFinal = order.final_total_amount == null;

  const handleReorder = async () => {
    setIsReordering(true);
    try {
      const items = await queryClient.fetchQuery({
        queryKey: [...ORDER_DETAILS_QUERY_KEY, order.id],
        queryFn: () => getOrderDetails(order.id),
        staleTime: 5 * 60 * 1000,
      });
      await Promise.allSettled(
        items.map(item => addToCart({ itemId: item.item_id, quantityDelta: item.quantity }))
      );
      onReorderComplete(true);
    } catch {
      onReorderComplete(false);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        Shadow.sm,
        { backgroundColor: colors.surface, borderLeftColor: statusColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Order ${displayId}, ${displayTotal}, ${statusLabel}`}
    >
      {/* Row 1: ID + date + total */}
      <View style={styles.row}>
        <View style={styles.idDateRow}>
          <Text style={[styles.orderId, { color: colors.text }]}>{displayId}</Text>
          <Text style={[styles.separator, { color: colors.textSecondary }]}> · </Text>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{displayDate}</Text>
        </View>
        <View style={styles.totalColumn}>
          <Text style={[styles.total, { color: colors.primary }]}>{displayTotal}</Text>
          {priceNotFinal && (
            <Text style={[styles.priceNotFinal, { color: colors.textSecondary }]}>
              Price not final
            </Text>
          )}
        </View>
      </View>

      {/* Row 2: delivery + status badge + reorder */}
      <View style={[styles.row, styles.bottomRow]}>
        <Text
          style={[styles.delivery, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {deliveryText}
        </Text>
        <View style={styles.actions}>
          <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <TouchableOpacity
            style={[styles.reorderBtn, { borderColor: colors.primary }]}
            onPress={handleReorder}
            disabled={isReordering}
            accessibilityRole="button"
            accessibilityLabel="Reorder"
          >
            {isReordering ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.reorderText, { color: colors.primary }]}>Reorder</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderRadius: Radius.md,
    padding: Spacing.s4,
    marginHorizontal: Spacing.s5,
    marginBottom: Spacing.s3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomRow: {
    marginTop: Spacing.s2,
  },
  idDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.s2,
  },
  orderId: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },
  separator: {
    fontSize: FontSize.label,
  },
  orderDate: {
    fontSize: FontSize.label,
  },
  totalColumn: {
    alignItems: 'flex-end',
  },
  total: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  priceNotFinal: {
    fontSize: FontSize.small,
    marginTop: 2,
  },
  delivery: {
    fontSize: FontSize.label,
    flex: 1,
    marginRight: Spacing.s2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
  },
  badge: {
    paddingHorizontal: Spacing.s2,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
  },
  reorderBtn: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.s3,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  reorderText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
  },
});
```

- [ ] **Step 3: TypeScript check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/OrderHistoryCard.tsx
git commit -m "feat: add OrderHistoryCard with delivery window and reorder action"
```

---

### Task 5: Rewrite `app/orders.tsx`

**Files:**
- Modify: `app/orders.tsx` (full rewrite)

- [ ] **Step 1: Replace the entire file contents**

```tsx
import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrders } from '@/hooks/useOrders';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import {
  FilterStatus,
  OrderFilterTabs,
  OrderListEmptyState,
} from '@/components/OrderListItem';
import { OrderHistoryKPIRow } from '@/components/OrderHistoryKPIRow';
import { OrderHistoryCard } from '@/components/OrderHistoryCard';
import { ThemedSearchBar, LoadingView } from '@/components/ThemedView';
import { Toast } from '@/components/ui/Toast';
import type { Order } from '@/lib/supabase';

type OrderSection = { title: string; data: Order[] };

function groupOrdersByDate(orders: Order[]): OrderSection[] {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

  const keys: string[] = [];
  const groups: Record<string, Order[]> = {};

  for (const order of orders) {
    const d = new Date(order.created_at);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let key: string;
    if (dayStart.getTime() === todayStart.getTime()) {
      key = 'TODAY';
    } else if (dayStart.getTime() === yesterdayStart.getTime()) {
      key = 'YESTERDAY';
    } else {
      key = d
        .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        .toUpperCase();
    }
    if (!groups[key]) {
      keys.push(key);
      groups[key] = [];
    }
    groups[key].push(order);
  }

  return keys.map(key => ({
    title: `${key} · ${groups[key].length}`,
    data: groups[key],
  }));
}

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { data: userInfo } = useUserInfo();
  const { data: orders = [], isLoading } = useOrders(userInfo?.id);
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const searchFiltered = useMemo(
    () =>
      searchQuery.trim()
        ? orders.filter(o => o.id.toLowerCase().includes(searchQuery.toLowerCase().trim()))
        : orders,
    [orders, searchQuery]
  );

  const filteredOrders = useMemo(
    () =>
      activeFilter === 'all'
        ? searchFiltered
        : searchFiltered.filter(o => o.status === activeFilter),
    [searchFiltered, activeFilter]
  );

  const kpiCounts = useMemo(() => {
    const now = new Date();
    return {
      thisMonth: orders.filter(o => {
        const d = new Date(o.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length,
      pending: orders.filter(o => o.status === 'pending').length,
      inTransit: orders.filter(o => o.status === 'in_transit').length,
    };
  }, [orders]);

  const filterCounts = useMemo(
    (): Record<FilterStatus, number> => ({
      all: searchFiltered.length,
      pending: searchFiltered.filter(o => o.status === 'pending').length,
      in_transit: searchFiltered.filter(o => o.status === 'in_transit').length,
      delivered: searchFiltered.filter(o => o.status === 'delivered').length,
    }),
    [searchFiltered]
  );

  const sections = useMemo(() => groupOrdersByDate(filteredOrders), [filteredOrders]);

  const handleReorderComplete = (success: boolean) => {
    setToast(
      success
        ? { message: 'Items added to cart', type: 'success' }
        : { message: 'Some items could not be added', type: 'error' }
    );
  };

  if (isLoading) return <LoadingView />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList<Order, OrderSection>
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <OrderHistoryCard
            order={item}
            onPress={() => router.push(`/order/${item.id}`)}
            onReorderComplete={handleReorderComplete}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Order History</Text>
            </View>
            <OrderHistoryKPIRow
              thisMonth={kpiCounts.thisMonth}
              pending={kpiCounts.pending}
              inTransit={kpiCounts.inTransit}
            />
            <View style={styles.searchContainer}>
              <ThemedSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search orders or items"
              />
            </View>
            <OrderFilterTabs
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={filterCounts}
            />
          </View>
        }
        ListEmptyComponent={
          <OrderListEmptyState
            activeFilter={activeFilter}
            onClearFilter={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}
          />
        }
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={!!toast}
          onHide={() => setToast(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.s5,
    paddingTop: Spacing.s4,
    paddingBottom: Spacing.s3,
  },
  title: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
  },
  searchContainer: {
    paddingHorizontal: Spacing.s5,
    paddingBottom: Spacing.s3,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.s5,
    paddingTop: Spacing.s3,
    paddingBottom: Spacing.s2,
  },
  sectionTitle: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    paddingBottom: Spacing.s8,
  },
});
```

- [ ] **Step 2: TypeScript check**

```
npx tsc --noEmit
```

Expected: no errors. Common fixes:
- If `Toast` import path differs, check `components/ui/` for the correct path
- If `OrderListEmptyState` doesn't accept `onClearFilter`, check its actual prop name in `components/OrderListItem.tsx` (look for the clear/reset prop) and update the call site

- [ ] **Step 3: ESLint check across all changed files**

```
npx eslint app/orders.tsx components/OrderHistoryCard.tsx components/OrderHistoryKPIRow.tsx components/OrderListItem.tsx --max-warnings 0
```

Expected: no errors or warnings.

- [ ] **Step 4: Commit**

```bash
git add app/orders.tsx
git commit -m "feat: rewrite order history screen with KPI row, search, date grouping, and reorder"
```

---

### Task 6: Validate and merge

**Files:** none (git only)

- [ ] **Step 1: Final TypeScript check**

```
npx tsc --noEmit
```

Expected: clean pass.

- [ ] **Step 2: Merge into preview**

```bash
git checkout preview
git merge --no-ff feature/redesign-order-history -m "feat: redesign order history screen"
```

Expected: clean merge. If conflicts occur, stop and consult the user.

- [ ] **Step 3: Delete feature branch**

```bash
git branch -d feature/redesign-order-history
```
