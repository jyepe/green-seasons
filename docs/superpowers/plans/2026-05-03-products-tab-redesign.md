# Products Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the restaurant-owner Products tab (`app/(tabs)/explore.tsx` and everything under `components/products/`) to match the Anthropic-design template while binding to existing app data, with no backend changes.

**Architecture:** In-place restyle of `components/products/*` plus extraction of two new primitives (`Stepper`, `CartBar`) into `components/ui/`. Reducer in `ProductsScreenState.ts` extended with `sortBy`. `ProductCard` prop surface stays identical — internals change only — so the orchestrator and grid keep working between steps. Sticky `CartBar` is mounted absolutely at the screen level, anchored above the tab bar via `useBottomTabBarHeight()` + `useSafeAreaInsets()`.

**Tech Stack:** React Native (Expo, RN 0.81 / RN-Reanimated v4), Expo Router, TanStack Query, Ionicons, `expo-linear-gradient`, `@react-navigation/bottom-tabs`, `react-native-safe-area-context`. Styling = React Native `StyleSheet` (no NativeWind). No test runner — verification gate is `npm run check-all` (typecheck + lint + prettier).

**Source spec:** `docs/superpowers/specs/2026-05-03-products-tab-redesign-design.md`

**Pre-flight:** Branch `feature/products-tab-redesign` is already checked out in this worktree. Do NOT recreate it. Do NOT run `git checkout <other-branch>` — this is a worktree.

---

## Handoff Notes (added mid-execution)

These supersede or refine the original plan based on what was discovered during Tasks 1–4.

**Verification gate — narrowed.** `npm run check-all` is broken on `origin/preview`: `npm run prettier:check` fails on ~185 unrelated files (reducers, scripts, supabase functions, etc.) that pre-date this work. Running `npm run prettier:fix` would touch all of them and conflict with parallel branches. Use this gate instead until the baseline is repaired:

```bash
npm run typecheck
npm run lint
npx prettier --check <files-changed-in-this-task>
# If prettier fails: npx prettier --write <files-changed-in-this-task>
```

(`tsconfig.json` was updated in Task 1's prep to exclude `supabase/functions/**` so Deno-style edge functions don't break typecheck — see commit `1de75d5`.)

**Deferred items found during Task 4 review:**

- **Task 5:** When rewriting `ProductsSearchBar`, verify the horizontal-gutter alignment with the new `ProductsScreenHeader`. Header now uses `paddingHorizontal: 20` with no card background; search bar previously used `marginHorizontal: 16`. Pick one and apply consistently — otherwise the header text edge and search-field edge will visibly mis-align in the new flush layout.
- **Task 11:** Update `docs/components.md` lines 119 and 121 — line 119 still describes `ProductsScreenHeader` as `"Fresh Produce" title + subtitle` (now "Today's market" with eyebrow + folded disclaimer); line 121 still lists `ProductsDisclaimer` as a component (deleted in Task 4). Roll into Task 11's verification sweep.

---

## File Structure

| Path                                                  | Action  | Responsibility                                                         |
| ----------------------------------------------------- | ------- | ---------------------------------------------------------------------- |
| `components/ui/Stepper.tsx`                           | CREATE  | Reusable +/qty/− pill — primary green pill with white glyphs           |
| `components/ui/CartBar.tsx`                           | CREATE  | Sticky floating cart preview, anchored above tab bar                   |
| `components/products/ProductTile.tsx`                 | CREATE  | Image-or-gradient image area used by `ProductCard`                     |
| `components/products/ProductsSortMenu.tsx`            | CREATE  | Sort dropdown (Name A–Z / Price low→high / Price high→low)             |
| `components/products/index.ts`                        | CREATE  | Barrel export                                                          |
| `components/products/ProductsScreenState.ts`          | MODIFY  | Add `sortBy` field + `SET_SORT_BY` action                              |
| `components/products/ProductsScreenHeader.tsx`        | REWRITE | Date eyebrow + "Today's market" + cutoff subtitle + disclaimer note    |
| `components/products/ProductsSearchBar.tsx`           | REWRITE | Focus-ring input; renders `ProductsSortMenu` trigger inline            |
| `components/products/ProductCard.tsx`                 | REWRITE | Tile + heart + new typography + Stepper-replaces-Add + bump animation  |
| `components/products/ProductsGrid.tsx`                | REWRITE | `FlatList` (numColumns=2), conditional `paddingBottom` for cart bar    |
| `components/products/PaginationControls.tsx`          | REWRITE | Numbered bar with chevrons + ellipsis (no dot row)                     |
| `components/products/ProductsScreenComponent.tsx`     | REWRITE | Add sort, filter+sort pipeline, result-count row, mount `<CartBar>`    |
| `components/products/ProductsDisclaimer.tsx`          | DELETE  | Folded into the new header                                             |
| `app/(tabs)/explore.tsx`                              | UNCHANGED | One-line wrapper stays                                              |

---

## Task 1: Add `Stepper` primitive

Pure presentational primitive. No consumers yet — verifies that types and styling work in isolation before `ProductCard` depends on it.

**Files:**
- Create: `components/ui/Stepper.tsx`

- [ ] **Step 1: Write `components/ui/Stepper.tsx`**

```tsx
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type StepperProps = {
  qty: number;
  onInc: () => void;
  onDec: () => void;
  disabled?: boolean;
  busy?: boolean;
  decLabel?: string;
  incLabel?: string;
};

export function Stepper({
  qty,
  onInc,
  onDec,
  disabled = false,
  busy = false,
  decLabel = 'Decrease quantity',
  incLabel = 'Increase quantity',
}: StepperProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const isInert = disabled || busy;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.primary, shadowColor: colors.primary },
      ]}
    >
      <Pressable
        onPress={onDec}
        disabled={isInert}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          isInert && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={decLabel}
        accessibilityState={{ disabled: isInert }}
        hitSlop={6}
      >
        <Ionicons name="remove" size={18} color="white" />
      </Pressable>
      <View style={styles.qtyContainer}>
        {busy ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.qty}>{qty}</Text>
        )}
      </View>
      <Pressable
        onPress={onInc}
        disabled={isInert}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          isInert && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={incLabel}
        accessibilityState={{ disabled: isInert }}
        hitSlop={6}
      >
        <Ionicons name="add" size={18} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  qtyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
  },
  qty: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});
```

- [ ] **Step 2: Run `npm run check-all`**

Run: `npm run check-all`
Expected: PASS (typecheck + lint + prettier all clean).

- [ ] **Step 3: Commit**

```bash
git add components/ui/Stepper.tsx
git commit -m "feat(ui): add Stepper primitive for products tab redesign"
```

---

## Task 2: Add `CartBar` primitive

Sticky floating cart preview — the spec's signature design moment. No consumer yet; the final wiring task mounts it.

**Files:**
- Create: `components/ui/CartBar.tsx`

- [ ] **Step 1: Write `components/ui/CartBar.tsx`**

```tsx
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type CartBarProps = {
  itemCount: number;
  totalCents: number;
  onPress: () => void;
  bottomOffset?: number;
};

const formatCents = (cents: number) =>
  `$${(Math.max(0, cents) / 100).toFixed(2)}`;

export function CartBar({
  itemCount,
  totalCents,
  onPress,
  bottomOffset,
}: CartBarProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const tabBarHeight = useBottomTabBarHeight();
  const computedBottom = bottomOffset ?? tabBarHeight + 12;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  useEffect(() => {
    if (itemCount > 0) {
      opacity.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, { damping: 18 });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(40, { duration: 180 });
    }
  }, [itemCount, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (itemCount === 0) return null;

  const itemWord = itemCount === 1 ? 'item' : 'items';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, animatedStyle, { bottom: computedBottom }]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.bar,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View cart with ${itemCount} ${itemWord}, total ${formatCents(totalCents)}`}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="cart" size={20} color="white" />
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.total}>{formatCents(totalCents)}</Text>
          <Text style={styles.subtitle}>
            {itemCount} {itemWord}
          </Text>
        </View>
        <Text style={styles.cta}>View cart →</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  pressed: { opacity: 0.9 },
  iconWrap: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  textCol: { flex: 1 },
  total: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  cta: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
```

- [ ] **Step 2: Run `npm run check-all`**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/ui/CartBar.tsx
git commit -m "feat(ui): add sticky CartBar primitive"
```

---

## Task 3: Extend reducer with `sortBy` + `SET_SORT_BY`

Pure type/data change. No UI consumer yet — verifies reducer compiles and existing actions still work.

**Files:**
- Modify: `components/products/ProductsScreenState.ts`

- [ ] **Step 1: Edit `components/products/ProductsScreenState.ts`**

Add the `SortKey` export, the new state field, the new action variant, the initial value, and the new reducer case (which also resets `currentPage` to 1, mirroring `SET_SEARCH_QUERY`).

Apply these edits:

Replace the imports + interface block (lines 1–9):

```ts
import { CartItem } from '@/lib/supabase';

export type SortKey = 'name' | 'price-asc' | 'price-desc';

export interface ProductsScreenState {
  searchQuery: string;
  sortBy: SortKey;
  currentPage: number;
  pendingItemId: string | null;
  showToast: boolean;
  stepperItems: Record<string, number>;
}
```

Replace the action union (lines 11–26) by inserting the new variant after `SET_SEARCH_QUERY`:

```ts
export type ProductsScreenAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SORT_BY'; payload: SortKey }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SYNC_CART_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_TO_CART_START'; payload: string }
  | { type: 'ADD_TO_CART_SUCCESS' }
  | { type: 'ADD_TO_CART_ERROR' }
  | {
      type: 'UPDATE_QUANTITY_OPTIMISTIC';
      payload: { itemId: string; quantity: number };
    }
  | {
      type: 'UPDATE_QUANTITY_ERROR';
      payload: { itemId: string; quantity: number };
    }
  | { type: 'HIDE_TOAST' };
```

Replace `initialState` (lines 28–34):

```ts
export const initialState: ProductsScreenState = {
  searchQuery: '',
  sortBy: 'name',
  currentPage: 1,
  pendingItemId: null,
  showToast: false,
  stepperItems: {},
};
```

Inside the reducer `switch`, immediately after the `SET_SEARCH_QUERY` case, add:

```ts
    case 'SET_SORT_BY':
      return {
        ...state,
        sortBy: action.payload,
        currentPage: 1,
      };
```

- [ ] **Step 2: Run `npm run check-all`**

Run: `npm run check-all`
Expected: PASS — `ProductsScreenComponent` reads only existing fields from state, so the new field is non-breaking.

- [ ] **Step 3: Commit**

```bash
git add components/products/ProductsScreenState.ts
git commit -m "feat(products): extend reducer with sortBy field and SET_SORT_BY action"
```

---

## Task 4: Rewrite `ProductsScreenHeader` and delete `ProductsDisclaimer`

The disclaimer folds into the new header. Delete the standalone file and remove its import + usage from the orchestrator in the same commit so the screen keeps compiling.

**Files:**
- Rewrite: `components/products/ProductsScreenHeader.tsx`
- Modify: `components/products/ProductsScreenComponent.tsx` (remove the `ProductsDisclaimer` import + JSX node)
- Delete: `components/products/ProductsDisclaimer.tsx`

- [ ] **Step 1: Rewrite `components/products/ProductsScreenHeader.tsx`**

```tsx
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function formatEyebrow(d: Date): string {
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${weekday} · ${monthDay}`;
}

export default function ProductsScreenHeader() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const eyebrow = useMemo(() => formatEyebrow(new Date()), []);

  return (
    <View
      style={styles.header}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`Today's market. ${eyebrow}. Order by 6 PM for next-day delivery.`}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>
        {eyebrow}
      </Text>
      <Text style={[styles.title, { color: colors.text }]}>
        Today&apos;s market
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Order by 6 PM for next-day delivery.
      </Text>
      <View style={styles.disclaimerRow}>
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={colors.textSecondary}
        />
        <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
          Prices reflect the last finalized day and may change.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
});
```

- [ ] **Step 2: Remove `ProductsDisclaimer` import and JSX from `ProductsScreenComponent.tsx`**

In `components/products/ProductsScreenComponent.tsx`:

- Delete this import line (currently line 11):
  ```ts
  import ProductsDisclaimer from './ProductsDisclaimer';
  ```
- Delete the `<ProductsDisclaimer />` JSX node and its surrounding blank line (currently around lines 215–217), so `<ProductsScreenHeader />` is followed directly by `<ProductsSearchBar … />`.

- [ ] **Step 3: Delete `ProductsDisclaimer.tsx`**

```bash
git rm components/products/ProductsDisclaimer.tsx
```

- [ ] **Step 4: Run `npm run check-all`**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/products/ProductsScreenHeader.tsx components/products/ProductsScreenComponent.tsx
git commit -m "feat(products): rewrite header with date eyebrow + folded-in disclaimer"
```

(`git rm` already staged the deletion in step 3.)

---

## Task 5: Rewrite search bar and add sort menu

`ProductsSearchBar` becomes a 46-tall input with a focus ring; a 46×46 sort button sits to its right and opens `ProductsSortMenu` (a popover). The orchestrator hasn't passed `sortBy` yet — that wiring lives in Task 9, so for now `ProductsSearchBar` accepts the new props and `ProductsScreenComponent` is updated to pass placeholder defaults so it keeps compiling.

**Files:**
- Rewrite: `components/products/ProductsSearchBar.tsx`
- Create: `components/products/ProductsSortMenu.tsx`
- Modify: `components/products/ProductsScreenComponent.tsx` (pass new props with reducer-backed values)

- [ ] **Step 1: Create `components/products/ProductsSortMenu.tsx`**

```tsx
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SortKey } from './ProductsScreenState';

type SortOption = { key: SortKey; label: string };

export const SORT_OPTIONS: SortOption[] = [
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'price-asc', label: 'Price (low → high)' },
  { key: 'price-desc', label: 'Price (high → low)' },
];

export const SORT_LABELS: Record<SortKey, string> = {
  name: 'Name A–Z',
  'price-asc': 'Price low→high',
  'price-desc': 'Price high→low',
};

type ProductsSortMenuProps = {
  visible: boolean;
  sortBy: SortKey;
  onSelect: (next: SortKey) => void;
  onDismiss: () => void;
};

export default function ProductsSortMenu({
  visible,
  sortBy,
  onSelect,
  onDismiss,
}: ProductsSortMenuProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  if (!visible) return null;

  return (
    <>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View
        style={[
          styles.menu,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: '#000',
          },
        ]}
        accessibilityRole="menu"
      >
        {SORT_OPTIONS.map(opt => {
          const active = opt.key === sortBy;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                onSelect(opt.key);
                onDismiss();
              }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.inputBackground },
              ]}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Sort by ${opt.label}${active ? ', selected' : ''}`}
            >
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {opt.label}
              </Text>
              {active ? (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: 52,
    right: 0,
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
```

- [ ] **Step 2: Rewrite `components/products/ProductsSearchBar.tsx`**

```tsx
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ProductsSortMenu from './ProductsSortMenu';
import type { SortKey } from './ProductsScreenState';

interface ProductsSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortKey;
  onSortChange: (next: SortKey) => void;
}

export default function ProductsSearchBar({
  searchQuery,
  setSearchQuery,
  sortBy,
  onSortChange,
}: ProductsSearchBarProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const borderColor = focused ? colors.primary : colors.border;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surface,
            borderColor,
          },
          focused && {
            shadowColor: colors.primary,
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
            elevation: 0,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={colors.textSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search products..."
          placeholderTextColor={colors.textSecondary + '99'}
          style={[styles.input, { color: colors.text }]}
          accessibilityLabel="Search products"
          accessibilityRole="search"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.sortAnchor}>
        <Pressable
          onPress={() => setMenuOpen(o => !o)}
          style={({ pressed }) => [
            styles.sortBtn,
            {
              backgroundColor: colors.surface,
              borderColor: menuOpen ? colors.primary : colors.border,
            },
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sort products"
          accessibilityState={{ expanded: menuOpen }}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.text} />
        </Pressable>
        <ProductsSortMenu
          visible={menuOpen}
          sortBy={sortBy}
          onSelect={onSortChange}
          onDismiss={() => setMenuOpen(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
    zIndex: 10,
  },
  inputWrap: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  sortAnchor: {
    position: 'relative',
  },
  sortBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 3: Update `ProductsScreenComponent.tsx` to pass `sortBy` + `onSortChange`**

In `components/products/ProductsScreenComponent.tsx`:

a) Replace the destructure on line 23–24 to pull `sortBy`:

```ts
const { searchQuery, sortBy, currentPage, pendingItemId, showToast, stepperItems } =
  state;
```

b) Replace the `<ProductsSearchBar … />` JSX node (currently lines 218–223) with:

```tsx
<ProductsSearchBar
  searchQuery={searchQuery}
  setSearchQuery={query =>
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
  }
  sortBy={sortBy}
  onSortChange={next => dispatch({ type: 'SET_SORT_BY', payload: next })}
/>
```

(The actual filter/sort pipeline change comes in Task 9; here we just thread the prop.)

- [ ] **Step 4: Run `npm run check-all`**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/products/ProductsSortMenu.tsx components/products/ProductsSearchBar.tsx components/products/ProductsScreenComponent.tsx
git commit -m "feat(products): rewrite SearchBar with focus ring and add SortMenu popover"
```

---

## Task 6: Add `ProductTile` and rewrite `ProductCard`

`ProductCard`'s prop surface stays identical; the parent (`ProductsGrid`) keeps compiling. New: `ProductTile` (image-or-gradient), heart pill on top-right of the tile, ghost "+ Add" button, `Stepper` from Task 1, subtle translateY bump on quantity-increment.

**Files:**
- Create: `components/products/ProductTile.tsx`
- Rewrite: `components/products/ProductCard.tsx`

- [ ] **Step 1: Create `components/products/ProductTile.tsx`**

Hash function and palette inline per spec (warm produce-friendly band only).

```tsx
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

type ProductTileProps = {
  imageUrl: string | null;
  fallbackSeed: string;
  height?: number;
};

// Bands (start,width) chosen to skip greys / electric blues:
//   greens 80-150, oranges 20-50, reds-warm 0-15 + 350-360, purples 270-310.
// Pick band by hash, hue inside band by hash again.
const HUE_BANDS: Array<[number, number]> = [
  [80, 70],
  [20, 30],
  [350, 25],
  [270, 40],
];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seedToHue(seed: string): number {
  const h = hashSeed(seed || 'item');
  const [start, width] = HUE_BANDS[h % HUE_BANDS.length];
  return (start + (h % width)) % 360;
}

export default function ProductTile({
  imageUrl,
  fallbackSeed,
  height = 132,
}: ProductTileProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const gradient = useMemo(() => {
    const hue = seedToHue(fallbackSeed);
    const isDark = colorScheme === 'dark';
    const lightTop = isDark ? 38 : 78;
    const lightBottom = isDark ? 26 : 62;
    return [
      `hsl(${hue}, 60%, ${lightTop}%)`,
      `hsl(${hue}, 60%, ${lightBottom}%)`,
    ] as const;
  }, [fallbackSeed, colorScheme]);

  if (imageUrl) {
    return (
      <View style={[styles.tile, { height }]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessible
          accessibilityRole="image"
        />
      </View>
    );
  }

  return (
    <View style={[styles.tile, { height }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <Ionicons
          name="nutrition-outline"
          size={48}
          color={colors.surface}
          style={styles.glyph}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    opacity: 0.4,
  },
});
```

> The `start={{ x: 0, y: 0 }}` / `end={{ x: 1, y: 1 }}` gives a ~135° angle which reads as the spec's 155° within RN's coordinate system; `expo-linear-gradient` does not accept a CSS-style angle value.

- [ ] **Step 2: Rewrite `components/products/ProductCard.tsx`**

```tsx
import { Stepper } from '@/components/ui/Stepper';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import ProductTile from './ProductTile';

export type ProductItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  image_url: string | null;
  is_favorite: boolean;
};

interface ProductCardProps {
  item: ProductItem;
  quantityInCart: number;
  stepperQuantity: number;
  isStepperMode: boolean;
  isPending: boolean;
  onToggleFavorite: (itemId: string, currentlyFavorite: boolean) => void;
  onAddToCart: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
}

export function ProductCard({
  item,
  quantityInCart,
  stepperQuantity,
  isStepperMode,
  isPending,
  onToggleFavorite,
  onAddToCart,
  onUpdateQuantity,
}: ProductCardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const bumpY = useSharedValue(0);
  const prevQty = useRef(quantityInCart);
  useEffect(() => {
    if (quantityInCart > prevQty.current) {
      bumpY.value = withSequence(
        withTiming(-2, { duration: 110 }),
        withTiming(0, { duration: 110 })
      );
    }
    prevQty.current = quantityInCart;
  }, [quantityInCart, bumpY]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bumpY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.surface, shadowColor: '#000' },
        cardAnimStyle,
      ]}
    >
      <View style={styles.tileWrap}>
        <ProductTile imageUrl={item.image_url} fallbackSeed={item.name} />
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => onToggleFavorite(item.id, item.is_favorite)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityState={{ selected: item.is_favorite }}
          accessibilityLabel={
            item.is_favorite
              ? `Remove ${item.name} from favorites`
              : `Add ${item.name} to favorites`
          }
        >
          <Ionicons
            name={item.is_favorite ? 'heart' : 'heart-outline'}
            size={18}
            color={item.is_favorite ? '#EF4444' : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text
          style={[styles.name, { color: colors.text }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.text }]}>
            ${item.price.toFixed(2)}
          </Text>
          <Text style={[styles.unit, { color: colors.textSecondary }]}>
            {' '}
            / {item.unit}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {isStepperMode ? (
            <Stepper
              qty={stepperQuantity}
              busy={isPending}
              onInc={() => onUpdateQuantity(item.id, 1)}
              onDec={() => onUpdateQuantity(item.id, -1)}
              decLabel={`Decrease quantity of ${item.name}`}
              incLabel={`Increase quantity of ${item.name}`}
            />
          ) : (
            <Pressable
              onPress={() => onAddToCart(item.id)}
              disabled={isPending}
              style={({ pressed }) => [
                styles.addBtn,
                {
                  borderColor: colors.primary,
                  backgroundColor: pressed ? colors.primary : 'transparent',
                },
                isPending && styles.addBtnDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name} to cart`}
              accessibilityState={{ disabled: isPending, busy: isPending }}
            >
              {({ pressed }) =>
                isPending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.addBtnText,
                      { color: pressed ? 'white' : colors.primary },
                    ]}
                  >
                    + Add
                  </Text>
                )
              }
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  tileWrap: {
    position: 'relative',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  body: {
    padding: 12,
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  unit: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  actionRow: {
    marginTop: 4,
  },
  addBtn: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  addBtnDisabled: {
    opacity: 0.6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});
```

- [ ] **Step 3: Run `npm run check-all`**

Run: `npm run check-all`
Expected: PASS. The card prop surface is unchanged so `ProductsGrid` (still passing the same props) still type-checks.

- [ ] **Step 4: Commit**

```bash
git add components/products/ProductTile.tsx components/products/ProductCard.tsx
git commit -m "feat(products): rewrite ProductCard with tile, ghost add button, stepper, and bump animation"
```

---

## Task 7: Convert `ProductsGrid` to FlatList + new states

Switch from `ScrollView` + `.map` to `FlatList` (numColumns=2) for recycling. Keep the same prop surface; add `cartBarVisible` and `paddingBottom` props (parent passes them in Task 9). Improve empty state with a "Clear search" CTA (calls a new optional `onClearSearch` prop).

**Files:**
- Rewrite: `components/products/ProductsGrid.tsx`
- Modify: `components/products/ProductsScreenComponent.tsx` (pass `cartBarVisible` and `onClearSearch`; placeholders for now — full wiring in Task 9)

- [ ] **Step 1: Rewrite `components/products/ProductsGrid.tsx`**

```tsx
import { LoadingView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { ProductCard, ProductItem } from './ProductCard';

interface ProductsGridProps {
  products: ProductItem[];
  isLoading: boolean;
  error: unknown;
  cartBarVisible: boolean;
  searchActive: boolean;
  onClearSearch: () => void;
  getCartQuantity: (itemId: string) => number;
  getStepperQuantity: (itemId: string) => number;
  isStepperMode: (itemId: string) => boolean;
  pendingItemId: string | null;
  onToggleFavorite: (itemId: string, currentlyFavorite: boolean) => void;
  onAddToCart: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
}

const COLUMN_GAP = 12;

export default function ProductsGrid({
  products,
  isLoading,
  error,
  cartBarVisible,
  searchActive,
  onClearSearch,
  getCartQuantity,
  getStepperQuantity,
  isStepperMode,
  pendingItemId,
  onToggleFavorite,
  onAddToCart,
  onUpdateQuantity,
}: ProductsGridProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  if (isLoading) {
    return <LoadingView message="Loading products..." />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
        <Text style={[styles.bodyText, { color: colors.text }]}>
          Failed to load products. Please try again.
        </Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="basket-outline"
          size={36}
          color={colors.textTertiary}
        />
        <Text style={[styles.emptyHeadline, { color: colors.text }]}>
          No products found
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Try a different search.
        </Text>
        {searchActive ? (
          <Pressable
            onPress={onClearSearch}
            style={({ pressed }) => [
              styles.clearBtn,
              {
                borderColor: colors.primary,
                backgroundColor: pressed ? colors.primary : 'transparent',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            {({ pressed }) => (
              <Text
                style={[
                  styles.clearBtnText,
                  { color: pressed ? 'white' : colors.primary },
                ]}
              >
                Clear search
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    );
  }

  const renderItem: ListRenderItem<ProductItem> = ({ item }) => (
    <View style={styles.cell}>
      <ProductCard
        item={item}
        quantityInCart={getCartQuantity(item.id)}
        stepperQuantity={getStepperQuantity(item.id)}
        isStepperMode={isStepperMode(item.id)}
        isPending={pendingItemId === item.id}
        onToggleFavorite={onToggleFavorite}
        onAddToCart={onAddToCart}
        onUpdateQuantity={onUpdateQuantity}
      />
    </View>
  );

  return (
    <FlatList
      data={products}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: cartBarVisible ? 96 : 24 },
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  row: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  cell: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyHeadline: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  bodyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  clearBtn: {
    marginTop: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});
```

- [ ] **Step 2: Pass placeholder props in `ProductsScreenComponent.tsx`**

In `components/products/ProductsScreenComponent.tsx`, replace the existing `<ProductsGrid … />` JSX (currently lines 225–236) with:

```tsx
<ProductsGrid
  products={paginatedProducts}
  isLoading={isLoading}
  error={error}
  cartBarVisible={false}
  searchActive={searchQuery.length > 0}
  onClearSearch={() =>
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
  }
  getCartQuantity={getCartQuantity}
  getStepperQuantity={getStepperQuantity}
  isStepperMode={isStepperMode}
  pendingItemId={pendingItemId}
  onToggleFavorite={handleToggleFavorite}
  onAddToCart={handleAddToCart}
  onUpdateQuantity={handleUpdateCartQuantity}
/>
```

(Task 9 replaces the literal `false` with the real `cartItemCount > 0`.)

- [ ] **Step 3: Run `npm run check-all`**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/products/ProductsGrid.tsx components/products/ProductsScreenComponent.tsx
git commit -m "feat(products): convert grid to FlatList with new empty state and CTA"
```

---

## Task 8: Rewrite `PaginationControls` with numbered + chevron variant

Always-show first, last, current ±1, ellipses fill the gap. Active page = filled `colors.primary` with white text and primary-tinted shadow.

**Files:**
- Rewrite: `components/products/PaginationControls.tsx`

- [ ] **Step 1: Rewrite `components/products/PaginationControls.tsx`**

```tsx
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type Token = number | 'ellipsis-left' | 'ellipsis-right';

function buildTokens(current: number, total: number): Token[] {
  if (total <= 1) return [1];
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const tokens: Token[] = [1];
  if (current > 3) tokens.push('ellipsis-left');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) tokens.push(i);
  if (current < total - 2) tokens.push('ellipsis-right');
  tokens.push(total);
  return tokens;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const tokens = buildTokens(currentPage, totalPages);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Pagination, page ${currentPage} of ${totalPages}`}
    >
      <ChevronBtn
        direction="back"
        disabled={!hasPrevious}
        onPress={() => onPageChange(Math.max(currentPage - 1, 1))}
        colors={colors}
      />
      {tokens.map((tok, idx) => {
        if (tok === 'ellipsis-left' || tok === 'ellipsis-right') {
          return (
            <Text
              key={`${tok}-${idx}`}
              style={[styles.ellipsis, { color: colors.textSecondary }]}
            >
              …
            </Text>
          );
        }
        const active = tok === currentPage;
        return (
          <Pressable
            key={tok}
            onPress={() => onPageChange(tok)}
            disabled={active}
            style={({ pressed }) => [
              styles.pageBtn,
              {
                backgroundColor: active ? colors.primary : 'transparent',
                borderColor: active ? colors.primary : colors.border,
                shadowColor: active ? colors.primary : 'transparent',
              },
              pressed && !active && { backgroundColor: colors.inputBackground },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Page ${tok}${active ? ', current' : ''}`}
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.pageText,
                { color: active ? 'white' : colors.text },
              ]}
            >
              {tok}
            </Text>
          </Pressable>
        );
      })}
      <ChevronBtn
        direction="forward"
        disabled={!hasNext}
        onPress={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        colors={colors}
      />
    </View>
  );
}

type ColorTokens = (typeof Colors)['light'];

function ChevronBtn({
  direction,
  disabled,
  onPress,
  colors,
}: {
  direction: 'back' | 'forward';
  disabled: boolean;
  onPress: () => void;
  colors: ColorTokens;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chevron,
        { borderColor: colors.border },
        disabled && styles.chevronDisabled,
        pressed && !disabled && { backgroundColor: colors.inputBackground },
      ]}
      accessibilityRole="button"
      accessibilityLabel={direction === 'back' ? 'Previous page' : 'Next page'}
      accessibilityState={{ disabled }}
    >
      <Ionicons
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={disabled ? colors.textTertiary : colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronDisabled: {
    opacity: 0.4,
  },
  pageBtn: {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  pageText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  ellipsis: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    paddingHorizontal: 4,
  },
});
```

- [ ] **Step 2: Run `npm run check-all`**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/products/PaginationControls.tsx
git commit -m "feat(products): rewrite PaginationControls with numbered + chevron + ellipsis"
```

---

## Task 9: Wire `CartBar`, sort pipeline, and result-count row in the orchestrator

Final integration in `ProductsScreenComponent.tsx`. Computes filtered+sorted products, item count, total cents, mounts `<CartBar>`, and wires `cartBarVisible` into the grid.

**Files:**
- Modify: `components/products/ProductsScreenComponent.tsx`

- [ ] **Step 1: Update imports (top of file)**

Replace the import block (lines 1–15) with:

```ts
import { CartBar } from '@/components/ui/CartBar';
import { Toast } from '@/components/ui/Toast';
import { Colors } from '@/constants/Colors';
import { ROUTES } from '@/constants/Routes';
import { useAddToCart, useCart, useCartRefetchOnFocus } from '@/hooks/useCart';
import { useToggleFavorite } from '@/hooks/useFavorite';
import { useItems, useItemsRefetchOnFocus } from '@/hooks/useItems';
import { useAppColorScheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { AccessibilityInfo, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaginationControls from './PaginationControls';
import ProductsGrid from './ProductsGrid';
import { SORT_LABELS } from './ProductsSortMenu';
import ProductsScreenHeader from './ProductsScreenHeader';
import ProductsSearchBar from './ProductsSearchBar';
import { initialState, productsScreenReducer } from './ProductsScreenState';
```

- [ ] **Step 2: Replace the filter `useMemo` block**

Replace the `useMemo` block (currently lines 39–62) with the full filter+sort+paginate pipeline:

```ts
const { filteredProducts, paginatedProducts, totalPages, safePage } =
  useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let arr = (items ?? []).filter(
      i => !q || i.name.toLowerCase().includes(q)
    );

    if (sortBy === 'price-asc') {
      arr = [...arr].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      arr = [...arr].sort((a, b) => b.price - a.price);
    }
    // 'name' relies on server default ordering; no client sort needed.

    const total = Math.max(1, Math.ceil(arr.length / ITEMS_PER_PAGE));
    const safe = Math.min(Math.max(currentPage, 1), total);
    const page = arr.slice((safe - 1) * ITEMS_PER_PAGE, safe * ITEMS_PER_PAGE);

    return {
      filteredProducts: arr,
      paginatedProducts: page,
      totalPages: total,
      safePage: safe,
    };
  }, [items, searchQuery, sortBy, currentPage]);
```

- [ ] **Step 3: Compute cart item count and total**

Insert this block immediately after the `useMemo` above:

```ts
const cartItemCount = useMemo(
  () => (cartItems ?? []).reduce((n, c) => n + c.quantity, 0),
  [cartItems]
);
const cartTotalCents = useMemo(
  () =>
    (cartItems ?? []).reduce(
      (sum, c) => sum + Math.round((c.line_subtotal ?? 0) * 100),
      0
    ),
  [cartItems]
);
const cartBarVisible = cartItemCount > 0;
```

- [ ] **Step 4: Replace the JSX returned from the component**

Replace the entire `return (...)` block (currently lines 203–246) with:

```tsx
return (
  <SafeAreaView
    style={[styles.container, { backgroundColor: colors.background }]}
    edges={['top']}
    accessibilityLabel="Explore Products Screen"
  >
    <Toast
      message="Item added to cart!"
      type="success"
      visible={showToast}
      onHide={handleToastHide}
    />
    <ProductsScreenHeader />

    <ProductsSearchBar
      searchQuery={searchQuery}
      setSearchQuery={query =>
        dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
      }
      sortBy={sortBy}
      onSortChange={next => dispatch({ type: 'SET_SORT_BY', payload: next })}
    />

    <View style={styles.metaRow}>
      <Text
        style={[styles.metaText, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {filteredProducts.length}{' '}
        {filteredProducts.length === 1 ? 'item' : 'items'} · sorted by{' '}
        {SORT_LABELS[sortBy]}
      </Text>
      {totalPages > 1 ? (
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          Page {safePage} of {totalPages}
        </Text>
      ) : null}
    </View>

    <ProductsGrid
      products={paginatedProducts}
      isLoading={isLoading}
      error={error}
      cartBarVisible={cartBarVisible}
      searchActive={searchQuery.length > 0}
      onClearSearch={() =>
        dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
      }
      getCartQuantity={getCartQuantity}
      getStepperQuantity={getStepperQuantity}
      isStepperMode={isStepperMode}
      pendingItemId={pendingItemId}
      onToggleFavorite={handleToggleFavorite}
      onAddToCart={handleAddToCart}
      onUpdateQuantity={handleUpdateCartQuantity}
    />

    {!isLoading && !error && filteredProducts.length > 0 && (
      <PaginationControls
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    )}

    <CartBar
      itemCount={cartItemCount}
      totalCents={cartTotalCents}
      onPress={() => router.push(ROUTES.RESTAURANT_OWNER_DASHBOARD + '/cart')}
    />
  </SafeAreaView>
);
```

> Routing note: `ROUTES.RESTAURANT_OWNER_DASHBOARD` is `'/(tabs)'`, so the concatenated path is `/(tabs)/cart` — the literal route registered in `app/(tabs)/_layout.tsx`.

- [ ] **Step 5: Update the bottom `StyleSheet.create` block**

Replace the styles block (currently the last `StyleSheet.create` at the bottom of the file, around lines 249–253) with:

```ts
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
```

- [ ] **Step 6: Run `npm run check-all`**

Run: `npm run check-all`
Expected: PASS — typecheck, lint, prettier all clean.

- [ ] **Step 7: Manual smoke (light + dark, iOS or Android)**

Run: `npm start` then open on simulator or device.
Verify per the spec's smoke checklist (see "Verification" below).

- [ ] **Step 8: Commit**

```bash
git add components/products/ProductsScreenComponent.tsx
git commit -m "feat(products): wire sort pipeline, result-count row, and sticky CartBar"
```

---

## Task 10: Add barrel export for `components/products/`

Optional convenience aligning with the spec's file layout. Low risk: existing imports keep using direct paths.

**Files:**
- Create: `components/products/index.ts`

- [ ] **Step 1: Create `components/products/index.ts`**

```ts
export { default as PaginationControls } from './PaginationControls';
export { ProductCard } from './ProductCard';
export type { ProductItem } from './ProductCard';
export { default as ProductsGrid } from './ProductsGrid';
export { default as ProductsScreenComponent } from './ProductsScreenComponent';
export { default as ProductsScreenHeader } from './ProductsScreenHeader';
export { default as ProductsSearchBar } from './ProductsSearchBar';
export { default as ProductsSortMenu, SORT_LABELS, SORT_OPTIONS } from './ProductsSortMenu';
export { default as ProductTile } from './ProductTile';
export {
  initialState,
  productsScreenReducer,
} from './ProductsScreenState';
export type {
  ProductsScreenAction,
  ProductsScreenState,
  SortKey,
} from './ProductsScreenState';
```

- [ ] **Step 2: Run `npm run check-all`**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/products/index.ts
git commit -m "chore(products): add barrel export"
```

---

## Task 11: Final verification and merge into `preview`

- [ ] **Step 1: Run `npm run check-all` one last time**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 2: Manual smoke checklist**

Tab loads, header eyebrow shows today's date (`WEDNESDAY · MAY 6` style), disclaimer note visible.
Search filters live; sort menu opens, switching reorders, page resets to 1.
Add an item — `Stepper` appears in the card, `CartBar` slides up with `1 item · $X.XX`.
Increment via stepper, total updates immediately (optimistic), remains correct after server roundtrip.
Decrement past 0 reverts to "+ Add" button; cart bar disappears when cart empties.
Tap cart bar → navigates to cart tab.
Favorite heart toggles and persists.
Pagination chevrons + numbered jumps work; ellipsis appears when totalPages > 5.
Toggle dark mode in profile → all colors flip on next products tab visit.
Empty search ("xyz") shows the new empty state with "Clear search" button that resets the query.

- [ ] **Step 3: Confirm `preview` is up to date**

Run:

```bash
git fetch origin preview
git log --oneline origin/preview ^HEAD
```

Expected: lists any commits on `preview` that aren't in this branch.

- [ ] **Step 4: Merge into `preview` locally**

> **STOP if there is any merge conflict.** Parallel Claude sessions are working on other redesign branches into the same `preview`. Consult the user before resolving.

```bash
git checkout preview
git pull --ff-only origin preview
git merge --no-ff feature/products-tab-redesign
```

If the merge succeeds cleanly, push:

```bash
git push origin preview
```

If `git merge` reports any conflict, abort and stop:

```bash
git merge --abort
```

Then notify the user with the conflicting filenames before proceeding.

- [ ] **Step 5: Return to feature branch in this worktree**

```bash
git checkout feature/products-tab-redesign
```

(Optional but keeps the worktree's branch state consistent.)

---

## Verification Summary

| Gate                                  | When                                           |
| ------------------------------------- | ---------------------------------------------- |
| `npm run check-all`                   | End of every task                              |
| Manual smoke (iOS sim / device)       | Task 9 (initial) and Task 11 (final)           |
| `git merge` clean (no conflicts)      | Task 11 step 4 — STOP and consult on conflict  |

## Risks (recap from spec)

- **CartBar tab-bar overlap.** Resolved via `useBottomTabBarHeight()` + a 12px breathing offset. Verify on iOS Pro Max (rounded), iPhone SE (no notch), and Android.
- **No `ROUTES.CART` constant.** Plan uses `ROUTES.RESTAURANT_OWNER_DASHBOARD + '/cart'` to keep the constant-driven style. If you'd rather hardcode, change the single `router.push(...)` line in Task 9 step 4.
- **`FlatList` vs `ScrollView`.** No pull-to-refresh exists today, so the conversion is no-op there. Watch for layout shift when the keyboard opens during search.
- **Hash-to-hue helper.** Lives inline in `ProductTile.tsx` per spec; do not pre-extract.
- **Cutoff time copy.** Hardcoded `Order by 6 PM for next-day delivery.` — flagged as future-driven.
