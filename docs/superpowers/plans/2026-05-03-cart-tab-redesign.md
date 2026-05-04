# Cart Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the restaurant-owner cart tab to match the Anthropic-design template while binding to existing app data. No backend changes.

**Architecture:** Decompose `components/cart/` into single-responsibility pieces (`CartHeader`, `CartSectionTitle`, `CartLineCard`, `CartSwipeableLine`, `CartDisclaimer`, `CartSummaryFooter`, `CartEmptyState`) and rewrite `CartScreenComponent` as a thin orchestrator over existing TanStack Query hooks (`useCart`, `useClearCart`, `useAddToCart`, `useItems`, `useUserInfo`, `useRestaurant`, `useAdmin`). The single `FlatList` is replaced by a `ScrollView` of cards plus an absolutely-positioned blurred footer; the disclaimer pill is now inline above the footer. Existing reducer (`reducers/cartReducer.ts`), `EditQuantityModal`, swipe hook (`useSwipeToDelete`), and route file (`app/(tabs)/cart.tsx`) are unchanged.

**Tech Stack:** React Native (Expo SDK 54), Expo Router 6, TypeScript strict, `@expo/vector-icons` (Ionicons), `expo-blur` (~15.0.8 — already in deps, used by `TabBarBackground.ios.tsx`), `expo-linear-gradient` (~15.0.8), `expo-haptics`, `react-native-gesture-handler`, `react-native-reanimated` 4, `react-native-safe-area-context`, `@react-navigation/bottom-tabs`, TanStack Query.

**Verification gate:** This repo has **no test runner** (per `CLAUDE.md`). Each task's verification step is `npm run check-all` (typecheck + ESLint + Prettier). The final task adds manual visual checks against the design spec.

**Branch:** `feature/cart-tab-redesign` (already created off `preview` and checked out in this worktree). Spec: `docs/superpowers/specs/2026-05-03-cart-tab-redesign-design.md`. Local design reference: `.design-ref/` (gitignored, may not be present in this worktree).

---

## Heads-up — token name correction

The spec writes `colors.inputBg` but the actual token in `constants/Colors.ts` is **`colors.inputBackground`**. Use `colors.inputBackground` everywhere the spec says `inputBg`. This plan already uses the correct name in every code block below — do not propagate the spec's typo.

The other token names in the spec (`colors.surface`, `colors.background`, `colors.border`, `colors.text`, `colors.textSecondary`, `colors.textTertiary`, `colors.primary`, `colors.error`) all exist verbatim in `Colors.ts` and are correct.

## File layout (target end state)

```
components/cart/
  CartHeader.tsx           ← REWRITTEN (Task 7)
  CartSectionTitle.tsx     ← NEW (Task 1)
  CartLineCard.tsx         ← NEW (Task 2)
  CartSwipeableLine.tsx    ← NEW (Task 3)
  CartDisclaimer.tsx       ← NEW (Task 4)
  CartSummaryFooter.tsx    ← NEW (Task 5)
  CartEmptyState.tsx       ← NEW (Task 6)
  CartScreenComponent.tsx  ← REWRITTEN (Task 7)
  EditQuantityModal.tsx    ← UNCHANGED
  CartList.tsx             ← DELETED (Task 8)
  SwipeableRow.tsx         ← DELETED (Task 8)
  CartFooter.tsx           ← DELETED (Task 8)
```

## Task ordering rationale

We add all new components first (Tasks 1–6) without touching the existing orchestrator, so typecheck stays green at every commit. Task 7 is an atomic swap that rewrites `CartHeader.tsx` (its prop shape changes) and `CartScreenComponent.tsx` (its imports change) in one commit — doing them separately would break typecheck. Task 8 deletes the now-orphaned files. Task 9 is the final manual verification gate before merge.

---

## Task 1: Build `CartSectionTitle`

The "This order" row above the cards. Inline "Clear all" link replaces today's header trash button.

**Files:**

- Create: `components/cart/CartSectionTitle.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/cart/CartSectionTitle.tsx
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionDisabled?: boolean;
  actionBusy?: boolean;
};

export function CartSectionTitle({
  title,
  actionLabel,
  onActionPress,
  actionDisabled,
  actionBusy,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const showAction = !!actionLabel && !!onActionPress;

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {showAction && (
        <Pressable
          onPress={onActionPress}
          disabled={actionDisabled || actionBusy}
          accessibilityRole="button"
          accessibilityLabel="Clear cart"
          accessibilityState={{
            disabled: !!actionDisabled,
            busy: !!actionBusy,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            styles.action,
            (pressed || actionDisabled) && { opacity: 0.5 },
          ]}
        >
          {actionBusy ? (
            <ActivityIndicator size="small" color={colors.textTertiary} />
          ) : (
            <Text style={[styles.actionText, { color: colors.textTertiary }]}>
              {actionLabel}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  action: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS — typecheck + ESLint + Prettier all green.

- [ ] **Step 3: Commit**

```bash
git add components/cart/CartSectionTitle.tsx
git commit -m "feat(cart): add CartSectionTitle for 'This order' row"
```

---

## Task 2: Build `CartLineCard`

Card-style line item: image tile (or gradient + leaf-outline fallback), name + subtotal, `$X.XX/each`, stepper pill, "Remove" text button.

**Files:**

- Create: `components/cart/CartLineCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/cart/CartLineCard.tsx
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import type { CartItem } from '@/lib/supabase';

export type CartLineCardProps = {
  item: CartItem;
  imageUrl: string | null;
  isUpdating: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onPress: () => void;
};

export function CartLineCard({
  item,
  imageUrl,
  isUpdating,
  onIncrement,
  onDecrement,
  onRemove,
  onPress,
}: CartLineCardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const isTrashMode = item.quantity === 1;

  const cardSurfaceStyle = [
    styles.card,
    {
      backgroundColor: colors.surface,
      ...(isDark
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }),
    },
  ];

  return (
    <Pressable
      onPress={onPress}
      accessibilityActions={[{ name: 'delete', label: 'Delete item' }]}
      onAccessibilityAction={e => {
        if (e.nativeEvent.actionName === 'delete') {
          onRemove();
        }
      }}
      style={({ pressed }) => [cardSurfaceStyle, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.row}>
        {/* Left tile */}
        <View style={styles.tile}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.tileImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[`${colors.primary}33`, `${colors.primary}1A`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tileGradient}
            >
              <Ionicons name="leaf-outline" size={24} color={colors.primary} />
            </LinearGradient>
          )}
        </View>

        {/* Right column */}
        <View style={styles.right}>
          <View style={styles.topRow}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.item_name}
            </Text>
            <Text style={[styles.subtotal, { color: colors.text }]}>
              ${item.line_subtotal.toFixed(2)}
            </Text>
          </View>

          <Text style={[styles.unitPrice, { color: colors.textSecondary }]}>
            ${item.item_price.toFixed(2)}/each
          </Text>

          <View style={styles.stepperRow}>
            <View
              style={[
                styles.stepperPill,
                {
                  backgroundColor: colors.inputBackground,
                  ...(isDark && {
                    borderWidth: 1,
                    borderColor: colors.border,
                  }),
                },
              ]}
            >
              <Pressable
                onPress={onDecrement}
                disabled={isUpdating}
                accessibilityRole="button"
                accessibilityLabel={
                  isTrashMode
                    ? `Remove ${item.item_name} from cart`
                    : `Decrease quantity of ${item.item_name}`
                }
                accessibilityState={{ disabled: isUpdating, busy: isUpdating }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  pressed && { opacity: 0.6 },
                ]}
              >
                {isTrashMode ? (
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={colors.error}
                  />
                ) : (
                  <Ionicons name="remove" size={16} color={colors.text} />
                )}
              </Pressable>

              <View style={styles.qtyValue}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.qtyText, { color: colors.text }]}>
                    {item.quantity}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={onIncrement}
                disabled={isUpdating}
                accessibilityRole="button"
                accessibilityLabel={`Increase quantity of ${item.item_name}`}
                accessibilityState={{ disabled: isUpdating, busy: isUpdating }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [
                  styles.stepperBtnPrimary,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            <Pressable
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.item_name} from cart`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.removeBtn,
                pressed && { opacity: 0.5 },
              ]}
            >
              <Text style={[styles.removeText, { color: colors.textTertiary }]}>
                Remove
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tile: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  unitPrice: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  stepperRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    padding: 2,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  stepperBtnPrimary: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    minWidth: 24,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  removeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  removeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/cart/CartLineCard.tsx
git commit -m "feat(cart): add CartLineCard with image tile, stepper, Remove"
```

---

## Task 3: Build `CartSwipeableLine`

Wraps `CartLineCard` with the existing `useSwipeToDelete` gesture and a red full-height delete action.

**Files:**

- Create: `components/cart/CartSwipeableLine.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/cart/CartSwipeableLine.tsx
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useSwipeToDelete } from '@/hooks/useSwipeToDelete';
import { CartLineCard, type CartLineCardProps } from './CartLineCard';

const DELETE_ACTION_WIDTH = 90;

export function CartSwipeableLine(props: CartLineCardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const {
    panGesture,
    animatedRowStyle,
    animatedDeleteStyle,
    translateX,
    isSwiping,
  } = useSwipeToDelete({
    onDelete: props.onRemove,
    deleteActionWidth: DELETE_ACTION_WIDTH,
  });

  // Block tap-to-edit while swiping or partially swiped.
  const handlePress = useCallback(() => {
    if (!isSwiping.value && Math.abs(translateX.value) < 1) {
      props.onPress();
    }
  }, [props, isSwiping, translateX]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedRowStyle}>
          <CartLineCard {...props} onPress={handlePress} />
        </Animated.View>
      </GestureDetector>
      <Animated.View
        style={[
          styles.deleteAction,
          { backgroundColor: colors.error },
          animatedDeleteStyle,
        ]}
      >
        <Pressable
          style={styles.deleteButton}
          onPress={() => {
            translateX.value = withSpring(0);
            props.onRemove();
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete item"
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_ACTION_WIDTH,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/cart/CartSwipeableLine.tsx
git commit -m "feat(cart): add CartSwipeableLine wrapping CartLineCard with swipe-to-delete"
```

---

## Task 4: Build `CartDisclaimer`

Inline pill that renders at the bottom of the ScrollView (NOT inside the absolute footer).

**Files:**

- Create: `components/cart/CartDisclaimer.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/cart/CartDisclaimer.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

export function CartDisclaimer() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons
        name="information-circle-outline"
        size={14}
        color={colors.textSecondary}
        importantForAccessibility="no-hide-descendants"
      />
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        This total does not reflect the final price. The final price will be
        determined when item prices are set on the scheduled delivery day.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 16,
  },
  text: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/cart/CartDisclaimer.tsx
git commit -m "feat(cart): add CartDisclaimer pill for inline final-price note"
```

---

## Task 5: Build `CartSummaryFooter`

Sticky footer absolutely positioned above the tab bar. `BlurView` over a solid `colors.surface` underlay so it degrades gracefully if the blur fails to render. Top hairline border, two-line layout (label + animated total above, full-width Checkout button below).

**Files:**

- Create: `components/cart/CartSummaryFooter.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/cart/CartSummaryFooter.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

export const CART_FOOTER_HEIGHT = 128;

type Props = {
  total: number;
  animatedTotalStyle: AnimatedStyle<TextStyle>;
  onCheckout: () => void;
};

export function CartSummaryFooter({
  total,
  animatedTotalStyle,
  onCheckout,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + tabBarHeight }]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <BlurView
          intensity={80}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <View style={styles.totalBlock}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Estimated total
            </Text>
            <Animated.Text
              style={[
                styles.totalValue,
                { color: colors.text },
                animatedTotalStyle,
              ]}
            >
              ${total.toFixed(2)}
            </Animated.Text>
          </View>

          <Pressable
            onPress={onCheckout}
            accessibilityRole="button"
            accessibilityLabel="Proceed to checkout"
            accessibilityHint="Reviews your order and payment details"
            style={({ pressed }) => [
              styles.checkoutBtn,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  container: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  totalBlock: {
    gap: 2,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '400',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.22, // ≈ -0.01em on 22pt
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/cart/CartSummaryFooter.tsx
git commit -m "feat(cart): add CartSummaryFooter sticky bar with blurred surface"
```

---

## Task 6: Build `CartEmptyState`

Centered empty-state block: tinted circle + basket icon, title, subtitle, "Browse produce" pill button.

**Files:**

- Create: `components/cart/CartEmptyState.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/cart/CartEmptyState.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = { onBrowse: () => void };

export function CartEmptyState({ onBrowse }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${colors.primary}24` /* ~14% alpha */ },
        ]}
      >
        <Ionicons name="basket-outline" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        Your cart is empty
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Browse this week&apos;s harvest and start filling up your kitchen.
      </Text>
      <Pressable
        onPress={onBrowse}
        accessibilityRole="button"
        accessibilityLabel="Browse produce"
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.ctaText}>Browse produce</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  cta: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.33,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/cart/CartEmptyState.tsx
git commit -m "feat(cart): add CartEmptyState with basket icon and Browse CTA"
```

---

## Task 7: Rewrite `CartHeader` and `CartScreenComponent` (atomic swap)

The old `CartHeader` props (`itemCount`, `onClearCart`, `isClearing`) are gone — replaced by `productCount`, `unitCount`, `restaurantName`. The orchestrator switches from `FlatList` to a `ScrollView` of `CartSwipeableLine` cards plus inline disclaimer plus absolutely-positioned `CartSummaryFooter`. Both files MUST change in the same commit so typecheck stays green.

**Files:**

- Modify (full rewrite): `components/cart/CartHeader.tsx`
- Modify (full rewrite): `components/cart/CartScreenComponent.tsx`

- [ ] **Step 1: Rewrite `CartHeader.tsx`**

Replace the entire file with:

```tsx
// components/cart/CartHeader.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  productCount: number;
  unitCount: number;
  restaurantName?: string;
};

export function CartHeader({ productCount, unitCount, restaurantName }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const productLabel = productCount === 1 ? 'product' : 'products';
  const subtitleParts = [
    `${productCount} ${productLabel}`,
    `${unitCount} units`,
  ];
  if (restaurantName) subtitleParts.push(restaurantName);
  const subtitle = subtitleParts.join(' · ');

  const a11yLabel = restaurantName
    ? `Cart, ${productCount} ${productLabel}, ${unitCount} units, ${restaurantName}`
    : `Cart, ${productCount} ${productLabel}, ${unitCount} units`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text
        accessibilityRole="header"
        accessibilityLabel={a11yLabel}
        style={[styles.title, { color: colors.text }]}
      >
        Cart
      </Text>
      <Text
        style={[styles.subtitle, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.26, // ≈ -0.01em on 26pt
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '400',
  },
});
```

- [ ] **Step 2: Rewrite `CartScreenComponent.tsx`**

Replace the entire file with:

```tsx
// components/cart/CartScreenComponent.tsx
import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import {
  AccessibilityInfo,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import {
  useAddToCart,
  useCart,
  useCartRefetchOnFocus,
  useClearCart,
} from '@/hooks/useCart';
import { useItems } from '@/hooks/useItems';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAdmin } from '@/hooks/useAdmin';
import { LoadingView } from '@/components/ThemedView';
import type { CartItem } from '@/lib/supabase';
import { cartReducer, initialCartState } from '@/reducers/cartReducer';
import { EditQuantityModal, type EditingItem } from './EditQuantityModal';
import { CartHeader } from './CartHeader';
import { CartSectionTitle } from './CartSectionTitle';
import { CartSwipeableLine } from './CartSwipeableLine';
import { CartDisclaimer } from './CartDisclaimer';
import { CartSummaryFooter, CART_FOOTER_HEIGHT } from './CartSummaryFooter';
import { CartEmptyState } from './CartEmptyState';

export default function CartScreenComponent() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  useCartRefetchOnFocus();

  const { data: cartItems, isLoading, error } = useCart();
  const { data: items } = useItems();
  const { data: userInfo } = useUserInfo();
  const { data: isUserAdmin } = useAdmin();
  const { data: restaurant } = useRestaurant(userInfo?.owned_restaurant_id);
  const clearCartMutation = useClearCart();
  const addToCartMutation = useAddToCart();

  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const { isClearing, updatingItemId, editingItem, editQuantity } = state;

  const totalScale = useSharedValue(1);
  const totalOpacity = useSharedValue(1);
  const prevTotalRef = useRef(0);

  const itemImageMap = useMemo(() => {
    if (!items) return new Map<string, string | null>();
    const map = new Map<string, string | null>();
    items.forEach(item => {
      map.set(item.id, item.image_url);
    });
    return map;
  }, [items]);

  const productCount = cartItems?.length ?? 0;
  const unitCount =
    cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const total =
    cartItems?.reduce((sum, item) => sum + item.line_subtotal, 0) ?? 0;

  useEffect(() => {
    if (prevTotalRef.current !== total && prevTotalRef.current > 0) {
      totalScale.value = withSpring(1.1, { damping: 10 }, () => {
        totalScale.value = withSpring(1, { damping: 10 });
      });
      totalOpacity.value = withTiming(0.5, { duration: 100 }, () => {
        totalOpacity.value = withTiming(1, { duration: 200 });
      });
    }
    prevTotalRef.current = total;
  }, [total, totalScale, totalOpacity]);

  const animatedTotalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: totalScale.value }],
    opacity: totalOpacity.value,
  }));

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            dispatch({ type: 'START_CLEARING' });
            try {
              await clearCartMutation.mutateAsync();
              AccessibilityInfo.announceForAccessibility('Cart cleared');
            } catch (e) {
              const errorMessage =
                e instanceof Error
                  ? e.message
                  : 'Failed to clear cart. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              dispatch({ type: 'FINISH_CLEARING' });
            }
          },
        },
      ]
    );
  };

  const handleUpdateCartItem = async (
    itemId: string,
    quantityDelta: number
  ) => {
    if (updatingItemId) return;

    dispatch({ type: 'START_UPDATING_ITEM', payload: itemId });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await addToCartMutation.mutateAsync({ itemId, quantityDelta });
    } catch (e) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : 'Unable to update quantity. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      dispatch({ type: 'FINISH_UPDATING_ITEM' });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const item = cartItems?.find(i => i.item_id === itemId);
    if (item) {
      handleUpdateCartItem(itemId, -item.quantity);
      AccessibilityInfo.announceForAccessibility('Item removed from cart');
    }
  };

  const handleItemPress = (item: CartItem) => {
    const editing: EditingItem = {
      item_id: item.item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      item_price: item.item_price,
    };
    dispatch({ type: 'START_EDITING_ITEM', payload: editing });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const newQuantity = parseInt(editQuantity, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      Alert.alert(
        'Invalid Quantity',
        'Please enter a valid quantity (1 or more).'
      );
      return;
    }
    const delta = newQuantity - editingItem.quantity;
    if (delta !== 0) {
      handleUpdateCartItem(editingItem.item_id, delta);
      AccessibilityInfo.announceForAccessibility(
        `Quantity updated to ${newQuantity}`
      );
    }
    dispatch({ type: 'CLOSE_EDIT_MODAL' });
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleBrowse = () => {
    router.push(isUserAdmin ? '/admin/(tabs)/explore' : '/(tabs)/explore');
  };

  const renderBody = () => {
    if (isLoading) {
      return <LoadingView message="Loading cart..." />;
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
            style={styles.errorIcon}
          />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Failed to load cart. Please try again.
          </Text>
        </View>
      );
    }
    if (!cartItems || cartItems.length === 0) {
      return <CartEmptyState onBrowse={handleBrowse} />;
    }

    const scrollPaddingBottom =
      CART_FOOTER_HEIGHT + insets.bottom + tabBarHeight + 16;

    return (
      <>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
          showsVerticalScrollIndicator={false}
        >
          <CartHeader
            productCount={productCount}
            unitCount={unitCount}
            restaurantName={isUserAdmin ? undefined : restaurant?.name}
          />
          <CartSectionTitle
            title="This order"
            actionLabel="Clear all"
            onActionPress={handleClearCart}
            actionDisabled={isClearing || clearCartMutation.isPending}
            actionBusy={isClearing || clearCartMutation.isPending}
          />
          <View style={styles.cardsList}>
            {cartItems.map(item => (
              <CartSwipeableLine
                key={item.item_row_id}
                item={item}
                imageUrl={itemImageMap.get(item.item_id) ?? null}
                isUpdating={updatingItemId === item.item_id}
                onIncrement={() => handleUpdateCartItem(item.item_id, 1)}
                onDecrement={() =>
                  item.quantity === 1
                    ? handleDeleteItem(item.item_id)
                    : handleUpdateCartItem(item.item_id, -1)
                }
                onRemove={() => handleDeleteItem(item.item_id)}
                onPress={() => handleItemPress(item)}
              />
            ))}
          </View>
          <CartDisclaimer />
        </ScrollView>
        <CartSummaryFooter
          total={total}
          animatedTotalStyle={animatedTotalStyle}
          onCheckout={handleCheckout}
        />
      </>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        edges={['left', 'right']}
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLabel="Shopping Cart Screen"
      >
        {renderBody()}
        <EditQuantityModal
          editingItem={editingItem}
          editQuantity={editQuantity}
          updatingItemId={updatingItemId}
          onClose={() => dispatch({ type: 'CLOSE_EDIT_MODAL' })}
          onSave={handleSaveEdit}
          setEditQuantity={q =>
            dispatch({ type: 'SET_EDIT_QUANTITY', payload: q })
          }
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  cardsList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
```

Notes for the engineer:

- `SafeAreaView` here uses `edges={['left', 'right']}` so the top inset is consumed inside `CartHeader` (`paddingTop: insets.top + 8`) — this matches the spec's "scrollable big-title header". Bottom inset is consumed inside `CartSummaryFooter`.
- The `−` button in each card now goes through `onDecrement` from this orchestrator. When `quantity === 1` it routes to `handleDeleteItem` — that's the trash-mode behavior the spec describes, so the visual trash icon and the actual delete action stay aligned.
- The "Remove" text button and the swipe-to-delete action both call `handleDeleteItem` — the same handler the trash-mode `−` uses, so haptics and the screen-reader announcement are identical across all three delete paths.
- Hooks ordering: `useCartRefetchOnFocus` is called early to make the focus-invalidate behavior obvious at the top of the component.
- `useSafeAreaInsets` and `useBottomTabBarHeight` are duplicated in `CartSummaryFooter` — that's intentional (the footer is a leaf component and self-positions); the orchestrator only needs them for the ScrollView bottom padding.

- [ ] **Step 3: Run check-all**

Run: `npm run check-all`
Expected: PASS — typecheck + ESLint + Prettier all green. The old `CartList`, `CartFooter`, and `SwipeableRow` files are still on disk but are no longer imported anywhere; they will be deleted in Task 8.

- [ ] **Step 4: Smoke-run the dev server**

Run: `npm run web` (or `npm start` and pick a target). Open the cart tab. Quick smoke test only — full visual verification is in Task 9. Confirm the screen mounts without runtime errors. Then stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add components/cart/CartHeader.tsx components/cart/CartScreenComponent.tsx
git commit -m "refactor(cart): rewrite CartHeader + CartScreenComponent for redesign"
```

---

## Task 8: Delete obsolete cart files

`CartList.tsx`, `SwipeableRow.tsx`, and `CartFooter.tsx` are no longer imported. Remove them so the folder reflects the new layout.

**Files:**

- Delete: `components/cart/CartList.tsx`
- Delete: `components/cart/SwipeableRow.tsx`
- Delete: `components/cart/CartFooter.tsx`

- [ ] **Step 1: Confirm nothing imports these files**

Run (PowerShell):

```powershell
Select-String -Path "app","components","hooks","reducers","lib" -Pattern "from '@/components/cart/CartList'|from '@/components/cart/SwipeableRow'|from '@/components/cart/CartFooter'|from './CartList'|from './SwipeableRow'|from './CartFooter'" -Recurse
```

Expected: no matches. If anything matches, STOP and reconcile before deleting.

- [ ] **Step 2: Delete the files**

```bash
git rm components/cart/CartList.tsx components/cart/SwipeableRow.tsx components/cart/CartFooter.tsx
```

- [ ] **Step 3: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(cart): remove obsolete CartList, SwipeableRow, CartFooter"
```

---

## Task 9: Manual visual verification

This is the final gate before merging into `preview`. There is no test runner — only the typecheck/lint/prettier guard in `npm run check-all` and a hands-on UI walkthrough.

- [ ] **Step 1: Run the full check-all one more time**

Run: `npm run check-all`
Expected: PASS — typecheck + lint + prettier all green.

- [ ] **Step 2: Run the app and walk every state**

Start the dev server: `npm start`. For each row in the matrix below, check the cart tab in **light mode** and **dark mode** on **iOS** and (where the platform is available) **Android** simulators or a physical device.

Visual matrix:

- [ ] Cart with 1 product (verify subtitle reads `1 product · N units · {restaurant}`)
- [ ] Cart with 5 products
- [ ] Cart with ~15+ products (long scroll — confirm sticky footer never overlaps the last card)
- [ ] An item with `image_url` set — real photo renders in the 60×60 tile
- [ ] An item with no `image_url` — gradient + `leaf-outline` Ionicon renders
- [ ] Stepper at qty > 1 — `−` shows the `remove` icon, tapping decrements
- [ ] Stepper at qty === 1 — `−` shows the `trash-outline` icon in `colors.error`, tapping removes the item with medium haptic + "Item removed from cart" announcement
- [ ] Stepper `+` — adds 1 with light haptic, qty animates with the total flash
- [ ] Tap a card body (away from the stepper) → `EditQuantityModal` opens; Save with a new value updates qty; Cancel closes without changes
- [ ] Swipe a card left — red `Delete` action appears; tap it deletes the item; partial swipe snaps back
- [ ] "Remove" text button on a card — deletes the item
- [ ] "Clear all" link in the section title row — Alert appears; Clear empties the cart and announces "Cart cleared"; while clearing the link is replaced by a small spinner
- [ ] Empty state — circle + basket icon + "Browse produce" CTA; tapping the CTA navigates to `/(tabs)/explore` (or `/admin/(tabs)/explore` if you're testing as admin)
- [ ] Loading state — `LoadingView` with "Loading cart..." spinner; no header, no footer
- [ ] Error state — `alert-circle-outline` 48pt + "Failed to load cart. Please try again."; no footer
- [ ] Restaurant name present (restaurant owner with `owned_restaurant_id`) → name appears in subtitle
- [ ] Restaurant name absent (admin or owner without restaurant) → subtitle drops the trailing `· name`
- [ ] Tab bar inset — the absolutely positioned footer sits **above** the tab bar; nothing overlaps and the Checkout button is fully tappable
- [ ] Animated total flash — change a quantity and watch the total scale/opacity animation play once
- [ ] Frosted footer — the `BlurView` renders over a translucent surface; if the platform falls back to no blur, the solid `colors.surface` underlay still looks correct

- [ ] **Step 3: Decide on integration**

If everything passes:

```bash
git checkout preview
git pull origin preview
git merge feature/cart-tab-redesign
```

**STOP if `git merge` reports any conflict.** Other parallel agents may have edited overlapping files. Show the conflict file list to the user and wait for guidance — do not auto-resolve.

If the merge is clean, do **not** push to `origin` and do **not** delete the feature branch. The user controls when integrations get pushed.

If anything fails the visual matrix, return to the relevant earlier task and patch the affected component, then re-run Tasks 1–9 from where you patched.

---

## Self-review checklist (already performed by plan author)

1. **Spec coverage** — every numbered scope decision (Q1–Q6, plus pull-to-refresh, footer layout, omitted variations) is reflected: optional sections dropped (no Tasks 1–8 produce a "pairs well with" / picker / promo); tap-to-edit modal preserved (Task 7); template Remove button on every card (Task 2); real image with gradient fallback (Task 2); scrollable big-title header with rich subtitle (Tasks 7); "Clear all" moved into `CartSectionTitle` (Tasks 1, 7); summary card collapsed into footer + inline disclaimer (Tasks 4, 5); no density tweak (Tasks 1–6 ship "regular" only); no `RefreshControl` (Task 7 wires `useCartRefetchOnFocus` instead); two-line footer with full-width Checkout (Task 5); no vendor / season-note / `$/unit` variant — only `$X.XX/each` (Task 2).

2. **Component contracts** — props in Task 7's wiring exactly match the contracts defined in Tasks 1–6:
   - `CartSectionTitle` props (`title`, `actionLabel`, `onActionPress`, `actionDisabled`, `actionBusy`) match Task 7's call site.
   - `CartLineCardProps` (`item`, `imageUrl`, `isUpdating`, `onIncrement`, `onDecrement`, `onRemove`, `onPress`) is the exact shape `CartSwipeableLine` extends and the orchestrator passes.
   - `CartSummaryFooter` props (`total`, `animatedTotalStyle`, `onCheckout`) match the orchestrator's call.
   - `CartEmptyState` props (`onBrowse`) match.
   - `CartHeader` props (`productCount`, `unitCount`, `restaurantName`) match.

3. **Token names** — every color reference uses an existing key in `constants/Colors.ts`. The spec's `colors.inputBg` was a typo; the plan corrects it to `colors.inputBackground` inline and calls it out in the heads-up section.

4. **Order safety** — Tasks 1–6 are additive; Task 7 atomically swaps API + caller; Task 8 deletes orphans; check-all stays green at every commit boundary.

5. **No placeholders** — every step contains the actual code or the actual command. No "TODO", no "fill in", no cross-references to undefined types.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-03-cart-tab-redesign.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
