# Checkout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-page restaurant-owner checkout with a 4-step wizard (Delivery → Payment → Review → Confirmed) that visually matches the Claude-design template at `.design-ref/project/checkout.jsx`.

**Architecture:** A new `components/checkout/` directory holds per-step screen components plus shared primitives (top bar, stepper, sticky footer, section label). `app/checkout.tsx` becomes a thin orchestrator (~200 LOC) that wires hooks → reducer → step components. `reducers/checkoutReducer.ts` is rewritten: dead form fields (`restaurantName`, `deliveryAddress`, `contactPerson`, `phoneNumber`, `email`, `dropdownVisible`) are removed because the new design reads those values directly from `useRestaurant()` / `useUserInfo()`; new fields (`step`, `agreed`, `selectedSlotId`, `selectedCardId`, `placedOrderId`, `placedTotal`, `toastMessage`) are added. Backend payload is unchanged — `paymentMethod: 'cash'` is still what hits `createOrderFromCart`, regardless of which UI chip is selected.

**Tech Stack:** React Native, Expo Router, TypeScript (strict), TanStack Query, `@react-native-community/datetimepicker`, `expo-blur` (for footer), `Ionicons`, existing `components/ui/Toast.tsx`, existing `Colors` tokens, existing `useAppColorScheme` / `useUserInfo` / `useRestaurant` / `useAdmin` / `useCart` / `useCreateOrder` hooks.

---

## Conventions for every task

- **No test runner exists in this repo.** Per `CLAUDE.md`, the verification gate is `npm run check-all` (typecheck + lint + prettier). This plan does **not** add unit tests; verification at task boundaries is `npm run check-all` plus, where relevant, a visual smoke check.
- **Branch:** all work is on `feature/checkout-redesign` (already checked out — this is a worktree, do not switch branches).
- **Imports:** use the `@/*` path alias for non-relative imports (`@/constants/Colors`, `@/hooks/useTheme`, etc.).
- **Styling:** `StyleSheet.create` only. No NativeWind/Tailwind. Theme-aware values come from `Colors[colorScheme]` via `useAppColorScheme()` and are passed in as a `colors` prop where the spec calls for it.
- **Type for `colors` prop:** `(typeof Colors)['light']`. The light and dark shapes are structurally identical; this typing avoids needing to construct a union manually.
- **Commits:** one commit per task at the end. Use Conventional Commits prefixes (`feat`, `refactor`, `chore`).
- **Design reference files** are at `.design-ref/project/Checkout.html` and `.design-ref/project/checkout.jsx`. The directory is gitignored — do not commit it.

---

## File structure

Files this plan creates or modifies:

| Path                                                     | Action          | Purpose                                                          |
| -------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `components/checkout/SectionLabel.tsx`                   | Create          | Section heading with optional right-aligned action button.       |
| `components/checkout/CheckoutTopBar.tsx`                 | Create          | Back chevron + centered step title.                              |
| `components/checkout/CheckoutStepper.tsx`                | Create          | 3-node progress indicator with labels and connecting bars.       |
| `components/checkout/CheckoutFooter.tsx`                 | Create          | Sticky frosted footer (BlurView) with running total + CTA.       |
| `components/checkout/StepDelivery.tsx`                   | Create          | Step 0 — deliver-to card, slot grid, "Pick another date", notes. |
| `components/checkout/StepPayment.tsx`                    | Create          | Step 1 — method chips, saved-card stubs, billing stub.           |
| `components/checkout/StepReview.tsx`                     | Create          | Step 2 — order lines, delivery summary, payment summary, totals. |
| `components/checkout/StepConfirmed.tsx`                  | Create          | Step 3 — celebration hero, order card, Track / Keep-shopping.    |
| `components/checkout/index.ts`                           | Create          | Barrel exports for the new module.                               |
| `components/checkout/slots.ts`                           | Create          | `generateDeliverySlots(now)` helper + `Slot` type.               |
| `reducers/checkoutReducer.ts`                            | Rewrite         | New state shape, new actions; remove dead fields/actions.        |
| `app/checkout.tsx`                                       | Rewrite         | Thin orchestrator: hooks → reducer → step components → footer.   |
| `docs/superpowers/plans/2026-05-03-checkout-redesign.md` | Already created | This file.                                                       |

`SectionLabel` and `slots.ts` are not in the spec's file list. They are added because (a) `SectionLabel` appears in 4 step components with identical styling — extracting prevents duplication, and (b) the slot generator is screen-local pure logic and benefits from sitting in its own typed file rather than inside `app/checkout.tsx`.

---

## Reducer migration summary (reference for Task 10)

**Removed fields:** `restaurantName`, `dropdownVisible`, `contactPerson`, `phoneNumber`, `email`, `deliveryAddress`. The redesign reads these from `useRestaurant()` / `useUserInfo()` directly — there is no longer a form to mirror them into reducer state.

**Removed actions:** `TOGGLE_DROPDOWN`, `SET_DROPDOWN_VISIBLE`, `SET_EMAIL`, `SYNC_RESTAURANT_DATA`, `SYNC_CONTACT_DATA`. `SELECT_ADMIN_RESTAURANT` is kept but reduced to setting `selectedRestaurantId` only (no address formatting).

**Kept fields/actions:** `selectedRestaurantId`, `deliveryDate`, `specialInstructions`, `iosPickerVisible`, `iosTempDate`, `paymentMethod` (union widened), and their associated actions: `SET_SELECTED_RESTAURANT_ID`, `SET_DELIVERY_DATE`, `SET_SPECIAL_INSTRUCTIONS`, `SET_PAYMENT_METHOD`, `OPEN_IOS_PICKER`, `SET_IOS_TEMP_DATE`, `CONFIRM_IOS_DATE`, `CANCEL_IOS_DATE`, `SELECT_ADMIN_RESTAURANT`.

**New fields:** `step`, `agreed`, `selectedSlotId`, `selectedCardId`, `placedOrderId`, `placedTotal`, `toastMessage`.

**New actions:** `NEXT_STEP`, `PREV_STEP`, `GO_TO_STEP`, `SET_SLOT`, `TOGGLE_AGREEMENT`, `SET_SELECTED_CARD`, `SHOW_TOAST`, `DISMISS_TOAST`, `ORDER_PLACED`.

**Type widening:** `PaymentMethod = 'card' | 'ach' | 'invoice' | 'cash'` (was `'net30' | 'credit' | 'cash'`). Initial value is `'card'` (UI default). The string literal `'cash'` is still what gets passed to `createOrderFromCart` regardless of UI selection.

---

## Task 1: SectionLabel primitive

**Files:**

- Create: `components/checkout/SectionLabel.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/checkout/SectionLabel.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';

type Props = {
  colors: (typeof Colors)['light'];
  children: string;
  action?: string;
  onAction?: () => void;
};

export function SectionLabel({ colors, children, action, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text
        style={[styles.title, { color: colors.text }]}
        accessibilityRole="header"
      >
        {children}
      </Text>
      {action && (
        <TouchableOpacity
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={action}
        >
          <Text style={[styles.action, { color: colors.primary }]}>
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.075,
  },
  action: {
    fontSize: 12,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-all`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add components/checkout/SectionLabel.tsx
git commit -m "feat(checkout): add SectionLabel primitive for redesigned checkout"
```

---

## Task 2: CheckoutTopBar

**Files:**

- Create: `components/checkout/CheckoutTopBar.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/checkout/CheckoutTopBar.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type Props = {
  colors: (typeof Colors)['light'];
  step: 0 | 1 | 2 | 3;
  onBack: () => void;
};

const TITLES = ['Delivery', 'Payment', 'Review', 'Confirmed'] as const;

export function CheckoutTopBar({ colors, step, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const showBack = step < 3;

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      {showBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.backButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text
        style={[styles.title, { color: colors.text }]}
        accessibilityRole="header"
      >
        {TITLES[step]}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.075,
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/CheckoutTopBar.tsx
git commit -m "feat(checkout): add CheckoutTopBar for stepped checkout"
```

---

## Task 3: CheckoutStepper

**Files:**

- Create: `components/checkout/CheckoutStepper.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/checkout/CheckoutStepper.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export type StepperStep = { id: string; label: string };

type Props = {
  colors: (typeof Colors)['light'];
  step: 0 | 1 | 2;
  steps: StepperStep[];
};

export function CheckoutStepper({ colors, step, steps }: Props) {
  return (
    <View
      style={styles.container}
      accessibilityRole="header"
      accessibilityLabel={`Step ${step + 1} of ${steps.length}, ${steps[step]?.label ?? ''}`}
    >
      {steps.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const filled = done || active;
        const isLast = i === steps.length - 1;
        return (
          <React.Fragment key={s.id}>
            <View style={styles.node}>
              <View
                style={[
                  styles.circle,
                  filled
                    ? { backgroundColor: colors.primary }
                    : {
                        backgroundColor: colors.inputBackground,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.number,
                      { color: filled ? '#fff' : colors.textTertiary },
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: filled ? colors.text : colors.textTertiary },
                ]}
                numberOfLines={1}
              >
                {s.label}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: i < step ? colors.primary : colors.border,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 6,
  },
  node: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  bar: {
    flex: 1,
    height: 2,
    borderRadius: 999,
    marginTop: -16, // align bar with circle midline (label sits below)
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/CheckoutStepper.tsx
git commit -m "feat(checkout): add CheckoutStepper progress indicator"
```

---

## Task 4: CheckoutFooter

**Files:**

- Create: `components/checkout/CheckoutFooter.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/checkout/CheckoutFooter.tsx
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  colors: (typeof Colors)['light'];
  step: 0 | 1 | 2;
  total: number;
  ctaLabel: string;
  ctaDisabled: boolean;
  placing: boolean;
  onPress: () => void;
};

export function CheckoutFooter({
  colors,
  step,
  total,
  ctaLabel,
  ctaDisabled,
  placing,
  onPress,
}: Props) {
  const scheme = useAppColorScheme();
  const tint = scheme === 'dark' ? 'dark' : 'light';
  const showTotal = step !== 2;
  const buttonBackground = ctaDisabled ? colors.textSecondary : colors.primary;

  return (
    <BlurView
      intensity={18}
      tint={tint}
      style={[styles.container, { borderTopColor: colors.border }]}
    >
      <View
        style={[
          styles.surface,
          {
            backgroundColor:
              scheme === 'dark'
                ? 'rgba(11,15,18,0.92)'
                : 'rgba(255,255,255,0.94)',
          },
        ]}
      >
        {showTotal && (
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Estimated total
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              ${total.toFixed(2)}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onPress}
          disabled={ctaDisabled || placing}
          activeOpacity={0.9}
          style={[
            styles.button,
            {
              backgroundColor: buttonBackground,
              opacity: ctaDisabled ? 0.7 : 1,
              shadowColor: ctaDisabled ? 'transparent' : colors.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          accessibilityState={{ disabled: ctaDisabled, busy: placing }}
        >
          {placing ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonLabel}>Placing order…</Text>
            </>
          ) : (
            <>
              <Text style={styles.buttonLabel}>{ctaLabel}</Text>
              <Ionicons
                name={step === 2 ? 'lock-closed' : 'arrow-forward'}
                size={16}
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>
        {step === 2 && (
          <View style={styles.footnoteRow}>
            <Ionicons
              name="lock-closed"
              size={10}
              color={colors.textTertiary}
            />
            <Text style={[styles.footnote, { color: colors.textTertiary }]}>
              Secure checkout · Encrypted end-to-end
            </Text>
          </View>
        )}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  surface: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.075,
  },
  footnoteRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footnote: {
    fontSize: 10,
    fontWeight: '400',
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-all`
Expected: PASS. `expo-blur` is already installed (`~15.0.8`).

- [ ] **Step 3: Commit**

```bash
git add components/checkout/CheckoutFooter.tsx
git commit -m "feat(checkout): add sticky frosted CheckoutFooter with running total"
```

---

## Task 5: Slot generator helper

**Files:**

- Create: `components/checkout/slots.ts`

- [ ] **Step 1: Create the file**

```ts
// components/checkout/slots.ts

export type DeliverySlot = {
  id: string;
  day: string;
  window: string;
  note: string | null;
  date: Date;
};

const WEEKDAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

function atHour(base: Date, daysAhead: number, hour: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * Returns four preset delivery windows starting tomorrow.
 * Order: tomorrow 6–9 AM (recommended), tomorrow 2–5 PM, +2d 6–9 AM, +3d 6–9 AM.
 */
export function generateDeliverySlots(now: Date): DeliverySlot[] {
  return [
    {
      id: 'tomorrow-am',
      day: 'Tomorrow',
      window: '6–9 AM',
      note: 'Recommended',
      date: atHour(now, 1, 6),
    },
    {
      id: 'tomorrow-pm',
      day: 'Tomorrow',
      window: '2–5 PM',
      note: null,
      date: atHour(now, 1, 14),
    },
    {
      id: 'plus2-am',
      day: WEEKDAY_FORMAT.format(atHour(now, 2, 6)),
      window: '6–9 AM',
      note: null,
      date: atHour(now, 2, 6),
    },
    {
      id: 'plus3-am',
      day: WEEKDAY_FORMAT.format(atHour(now, 3, 6)),
      window: '6–9 AM',
      note: null,
      date: atHour(now, 3, 6),
    },
  ];
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/slots.ts
git commit -m "feat(checkout): add generateDeliverySlots helper"
```

---

## Task 6: StepDelivery

**Files:**

- Create: `components/checkout/StepDelivery.tsx`

This component covers the spec's "Deliver to" card (owner: read-only; admin: tap-to-expand list), the slot grid, the "Pick another date" link, the optional Custom slot card, and the driver-notes textarea. It does NOT own the date-picker modal; that stays in the orchestrator (`app/checkout.tsx`).

- [ ] **Step 1: Create the file**

```tsx
// components/checkout/StepDelivery.tsx
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { Restaurant } from '@/lib/supabase';
import type { DeliverySlot } from './slots';
import { SectionLabel } from './SectionLabel';

type Props = {
  colors: (typeof Colors)['light'];
  isAdmin: boolean;
  restaurant: Restaurant | null;
  allRestaurants: Restaurant[];
  selectedRestaurantId: string | null;
  dropdownVisible: boolean;
  onToggleDropdown: () => void;
  onSelectRestaurant: (rest: Restaurant) => void;
  slots: DeliverySlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: DeliverySlot) => void;
  onPickOtherDate: () => void;
  customDate: Date | null;
  onSelectCustomDate: () => void;
  notes: string;
  onChangeNotes: (text: string) => void;
};

function formatAddressLine(rest: Restaurant | null): string {
  if (!rest) return '';
  return [
    rest.address_line1,
    rest.address_line2,
    [rest.city, rest.postal_code].filter(Boolean).join(', '),
    rest.country,
  ]
    .filter(part => part && part.trim().length > 0)
    .join(', ');
}

const CUSTOM_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

export function StepDelivery({
  colors,
  isAdmin,
  restaurant,
  allRestaurants,
  selectedRestaurantId,
  dropdownVisible,
  onToggleDropdown,
  onSelectRestaurant,
  slots,
  selectedSlotId,
  onSelectSlot,
  onPickOtherDate,
  customDate,
  onSelectCustomDate,
  notes,
  onChangeNotes,
}: Props) {
  const addressLine = formatAddressLine(restaurant);
  const customSelected = !selectedSlotId && !!customDate;

  return (
    <View>
      <SectionLabel colors={colors}>Deliver to</SectionLabel>
      <View style={styles.padded}>
        <TouchableOpacity
          activeOpacity={isAdmin ? 0.85 : 1}
          onPress={isAdmin ? onToggleDropdown : undefined}
          disabled={!isAdmin}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          accessibilityRole={isAdmin ? 'button' : undefined}
          accessibilityLabel={
            restaurant ? `Deliver to ${restaurant.name}` : 'Select a restaurant'
          }
          accessibilityState={
            isAdmin ? { expanded: dropdownVisible } : undefined
          }
        >
          <View
            style={[
              styles.iconTile,
              { backgroundColor: colors.inputBackground },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <Text
                style={[styles.cardTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {restaurant?.name ?? 'Select a restaurant'}
              </Text>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: colors.inputBackground },
                ]}
              >
                <Text
                  style={[styles.pillText, { color: colors.textSecondary }]}
                >
                  Restaurant
                </Text>
              </View>
            </View>
            {!!addressLine && (
              <Text
                style={[styles.cardSubtitle, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {addressLine}
              </Text>
            )}
          </View>
          {isAdmin && (
            <Ionicons
              name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          )}
        </TouchableOpacity>

        {isAdmin && dropdownVisible && (
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
              {allRestaurants.map(rest => {
                const selected = rest.id === selectedRestaurantId;
                return (
                  <TouchableOpacity
                    key={rest.id}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.border },
                      selected && {
                        backgroundColor: colors.primary + '14',
                      },
                    ]}
                    onPress={() => onSelectRestaurant(rest)}
                    accessibilityRole="radio"
                    accessibilityLabel={rest.name}
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        { color: selected ? colors.primary : colors.text },
                        selected && { fontWeight: '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {rest.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <SectionLabel colors={colors}>Delivery window</SectionLabel>
      <View style={[styles.padded, styles.slotGrid]}>
        {slots.map(s => {
          const active = !customSelected && s.id === selectedSlotId;
          return (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.85}
              onPress={() => onSelectSlot(s)}
              style={[
                styles.slot,
                active
                  ? {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                    }
                  : {
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
              ]}
              accessibilityRole="radio"
              accessibilityLabel={`${s.day} ${s.window}`}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.slotDay,
                  {
                    color: active
                      ? 'rgba(255,255,255,0.85)'
                      : colors.textSecondary,
                  },
                ]}
              >
                {s.day}
              </Text>
              <Text
                style={[
                  styles.slotWindow,
                  { color: active ? '#fff' : colors.text },
                ]}
              >
                {s.window}
              </Text>
              {s.note && (
                <Text
                  style={[
                    styles.slotNote,
                    {
                      color: active
                        ? 'rgba(255,255,255,0.85)'
                        : colors.textTertiary,
                    },
                  ]}
                >
                  {s.note}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
        {customSelected && customDate && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onSelectCustomDate}
            style={[
              styles.slot,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
            accessibilityRole="radio"
            accessibilityLabel={`Custom date ${CUSTOM_DATE_FORMAT.format(customDate)}`}
            accessibilityState={{ selected: true }}
          >
            <Text style={[styles.slotDay, { color: 'rgba(255,255,255,0.85)' }]}>
              Custom
            </Text>
            <Text style={[styles.slotWindow, { color: '#fff' }]}>
              {CUSTOM_DATE_FORMAT.format(customDate)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.padded, styles.pickAnotherRow]}>
        <TouchableOpacity
          onPress={onPickOtherDate}
          accessibilityRole="button"
          accessibilityLabel="Pick another date"
        >
          <Text style={[styles.pickAnother, { color: colors.primary }]}>
            Pick another date →
          </Text>
        </TouchableOpacity>
      </View>

      <SectionLabel colors={colors}>Driver notes</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.notesCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={notes}
            onChangeText={onChangeNotes}
            placeholder="Buzz back door, leave with line cook…"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            style={[styles.notesInput, { color: colors.text }]}
            accessibilityLabel="Driver notes"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.07,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownText: {
    fontSize: 14,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 0,
  },
  slot: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 0,
  },
  slotDay: {
    fontSize: 11,
    fontWeight: '500',
  },
  slotWindow: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.07,
  },
  slotNote: {
    fontSize: 10,
    marginTop: 4,
  },
  pickAnotherRow: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  pickAnother: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notesInput: {
    fontSize: 13,
    minHeight: 64,
    textAlignVertical: 'top',
    padding: 0,
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/StepDelivery.tsx
git commit -m "feat(checkout): add StepDelivery (address, slot grid, driver notes)"
```

---

## Task 7: StepPayment

**Files:**

- Create: `components/checkout/StepPayment.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/checkout/StepPayment.tsx
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SectionLabel } from './SectionLabel';

type PaymentMethodId = 'card' | 'ach' | 'invoice';

type SavedCard = {
  id: string;
  brand: 'Visa' | 'Mastercard';
  last4: string;
  exp: string;
  primary: boolean;
};

const CARDS: SavedCard[] = [
  { id: 'c1', brand: 'Visa', last4: '4242', exp: '08/27', primary: true },
  {
    id: 'c2',
    brand: 'Mastercard',
    last4: '8841',
    exp: '02/26',
    primary: false,
  },
];

const PAY_METHODS: {
  id: PaymentMethodId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'card', label: 'Card', icon: 'card-outline' },
  { id: 'ach', label: 'ACH bank', icon: 'business-outline' },
  { id: 'invoice', label: 'Net-30 invoice', icon: 'receipt-outline' },
];

const BRAND_BACKGROUND: Record<SavedCard['brand'], string> = {
  Visa: '#1A1F71',
  Mastercard: '#000000',
};

type Props = {
  colors: (typeof Colors)['light'];
  paymentMethod: 'card' | 'ach' | 'invoice' | 'cash';
  onSelectMethod: (method: PaymentMethodId) => void;
  selectedCardId: string;
  onSelectCard: (cardId: string) => void;
  email: string;
  onShowToast: (message: string) => void;
};

export function StepPayment({
  colors,
  paymentMethod,
  onSelectMethod,
  selectedCardId,
  onSelectCard,
  email,
  onShowToast,
}: Props) {
  return (
    <View>
      <SectionLabel colors={colors}>Pay with</SectionLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {PAY_METHODS.map(p => {
          const active = p.id === paymentMethod;
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.85}
              onPress={() => onSelectMethod(p.id)}
              style={[
                styles.chip,
                active
                  ? {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                    }
                  : {
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
              ]}
              accessibilityRole="radio"
              accessibilityLabel={p.label}
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={p.icon}
                size={14}
                color={active ? '#fff' : colors.text}
              />
              <Text
                style={[
                  styles.chipLabel,
                  { color: active ? '#fff' : colors.text },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {paymentMethod === 'card' && (
        <>
          <SectionLabel
            colors={colors}
            action="Add card"
            onAction={() => onShowToast('Coming soon')}
          >
            Saved cards
          </SectionLabel>
          <View style={styles.padded}>
            {CARDS.map((c, idx) => {
              const selected = c.id === selectedCardId;
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.85}
                  onPress={() => onSelectCard(c.id)}
                  style={[
                    styles.cardRow,
                    idx > 0 && styles.cardRowSpacing,
                    {
                      backgroundColor: colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                      borderWidth: selected ? 2 : 1,
                      shadowColor: selected ? colors.primary : 'transparent',
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityLabel={`${c.brand} ending in ${c.last4}`}
                  accessibilityState={{ selected }}
                >
                  <View
                    style={[
                      styles.brandTile,
                      { backgroundColor: BRAND_BACKGROUND[c.brand] },
                    ]}
                  >
                    <Text style={styles.brandText}>
                      {c.brand.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardCenter}>
                    <View style={styles.cardCenterRow}>
                      <Text style={[styles.cardLast4, { color: colors.text }]}>
                        •••• {c.last4}
                      </Text>
                      {c.primary && (
                        <View
                          style={[
                            styles.defaultPill,
                            { backgroundColor: colors.primary + '1F' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.defaultPillText,
                              { color: colors.primary },
                            ]}
                          >
                            Default
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.cardExp, { color: colors.textSecondary }]}
                    >
                      Expires {c.exp}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tick,
                      selected
                        ? { backgroundColor: colors.primary }
                        : {
                            borderWidth: 1.5,
                            borderColor: colors.border,
                          },
                    ]}
                  >
                    {selected && (
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {paymentMethod === 'ach' && (
        <View style={[styles.padded, styles.stubWrap]}>
          <View
            style={[
              styles.stubCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.stubTile, { backgroundColor: colors.info + '1F' }]}
            >
              <Ionicons name="business-outline" size={18} color={colors.info} />
            </View>
            <View style={styles.stubBody}>
              <Text style={[styles.stubTitle, { color: colors.text }]}>
                Chase Business ••5821
              </Text>
              <Text
                style={[styles.stubSubtitle, { color: colors.textSecondary }]}
              >
                Settles in 2–3 business days
              </Text>
            </View>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={colors.success}
            />
          </View>
        </View>
      )}

      {paymentMethod === 'invoice' && (
        <View style={[styles.padded, styles.stubWrap]}>
          <View
            style={[
              styles.stubCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.stubTile,
                { backgroundColor: colors.accentWarm + '1F' },
              ]}
            >
              <Ionicons
                name="receipt-outline"
                size={18}
                color={colors.accentWarm}
              />
            </View>
            <View style={styles.stubBody}>
              <Text style={[styles.stubTitle, { color: colors.text }]}>
                Net-30 invoicing
              </Text>
              <Text
                style={[styles.invoiceBody, { color: colors.textSecondary }]}
              >
                We&apos;ll email an invoice to{' '}
                <Text style={[styles.invoiceEmail, { color: colors.text }]}>
                  {email || 'your billing email'}
                </Text>{' '}
                after delivery. Payment due within 30 days.
              </Text>
            </View>
          </View>
        </View>
      )}

      <SectionLabel colors={colors}>Billing</SectionLabel>
      <View style={styles.padded}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onShowToast('Coming soon')}
          style={[
            styles.billingCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Billing entity"
        >
          <Ionicons
            name="business-outline"
            size={16}
            color={colors.textSecondary}
          />
          <View style={styles.billingBody}>
            <Text style={[styles.billingTitle, { color: colors.text }]}>
              Olivetta LLC
            </Text>
            <Text
              style={[styles.billingSubtitle, { color: colors.textSecondary }]}
            >
              EIN ••3412 · Tax-exempt resale
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: 20,
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  cardRowSpacing: {
    marginTop: 10,
  },
  brandTile: {
    width: 44,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardCenter: {
    flex: 1,
  },
  cardCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLast4: {
    fontSize: 13,
    fontWeight: '600',
  },
  defaultPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  defaultPillText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardExp: {
    fontSize: 11,
    marginTop: 2,
  },
  tick: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stubWrap: {
    marginTop: 4,
  },
  stubCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  stubTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stubBody: {
    flex: 1,
  },
  stubTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  stubSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  invoiceBody: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  invoiceEmail: {
    fontWeight: '600',
  },
  billingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  billingBody: {
    flex: 1,
  },
  billingTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  billingSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/StepPayment.tsx
git commit -m "feat(checkout): add StepPayment with method chips and stub cards"
```

---

## Task 8: StepReview

**Files:**

- Create: `components/checkout/StepReview.tsx`

`CartItem` (from `lib/supabase.ts`) has fields `item_name`, `item_price`, `quantity`, `line_subtotal`. It does **not** carry `unit`, `vendor`, or glyph metadata that the design template uses. The Review order list therefore renders a colored circle (using `colors.primary`) as the swatch and shows `{quantity} × ${item_price}` as the sub-line — explicitly accepting the visual gap. Tax / Delivery / Discount totals are stub `0` per the spec; the Delivery line shows "Free" with a green sub-label.

- [ ] **Step 1: Create the file**

```tsx
// components/checkout/StepReview.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { CartItem } from '@/lib/supabase';
import { SectionLabel } from './SectionLabel';

type AddressSummary = {
  label: string;
  line: string;
  iconName: keyof typeof Ionicons.glyphMap;
};

type SlotSummary = {
  day: string;
  window: string;
};

type SavedCardSummary = {
  brand: string;
  last4: string;
  exp: string;
} | null;

type Totals = {
  subtotal: number;
  delivery: number;
  tax: number;
  discount: number;
  total: number;
};

type Props = {
  colors: (typeof Colors)['light'];
  items: CartItem[];
  address: AddressSummary;
  slot: SlotSummary;
  paymentMethod: 'card' | 'ach' | 'invoice' | 'cash';
  savedCard: SavedCardSummary;
  totals: Totals;
  agreed: boolean;
  onToggleAgree: () => void;
};

function paymentTitle(
  method: Props['paymentMethod'],
  card: SavedCardSummary
): string {
  if (method === 'card' && card) return `${card.brand} •••• ${card.last4}`;
  if (method === 'ach') return 'ACH bank';
  if (method === 'invoice') return 'Net-30 invoice';
  return 'Cash on delivery';
}

function paymentSubtitle(
  method: Props['paymentMethod'],
  card: SavedCardSummary
): string {
  if (method === 'card' && card) return `Expires ${card.exp}`;
  if (method === 'ach') return 'Chase Business ••5821';
  if (method === 'invoice') return 'Net-30 terms';
  return 'Pay driver on arrival';
}

function paymentIcon(
  method: Props['paymentMethod']
): keyof typeof Ionicons.glyphMap {
  if (method === 'ach') return 'business-outline';
  if (method === 'invoice') return 'receipt-outline';
  if (method === 'cash') return 'cash-outline';
  return 'card-outline';
}

export function StepReview({
  colors,
  items,
  address,
  slot,
  paymentMethod,
  savedCard,
  totals,
  agreed,
  onToggleAgree,
}: Props) {
  return (
    <View>
      <SectionLabel colors={colors}>Order</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {items.length === 0 && (
            <View style={styles.emptyRow}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Your cart is empty.
              </Text>
            </View>
          )}
          {items.map((it, i) => (
            <View
              key={it.item_row_id}
              style={[
                styles.itemRow,
                i < items.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View
                style={[
                  styles.itemSwatch,
                  { backgroundColor: colors.primary + '26' },
                ]}
              >
                <Ionicons
                  name="leaf-outline"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={styles.itemBody}>
                <Text
                  style={[styles.itemName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {it.item_name}
                </Text>
                <Text
                  style={[styles.itemMeta, { color: colors.textSecondary }]}
                >
                  {it.quantity} × ${it.item_price.toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: colors.text }]}>
                ${it.line_subtotal.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <SectionLabel colors={colors}>Delivery</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.card,
            styles.cardPadded,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.iconRow}>
            <Ionicons
              name={address.iconName}
              size={18}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                {address.label}
              </Text>
              {!!address.line && (
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {address.line}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.iconRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                {slot.day} · {slot.window}
              </Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                Driver will text on arrival
              </Text>
            </View>
          </View>
        </View>
      </View>

      <SectionLabel colors={colors}>Payment</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.card,
            styles.cardPadded,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.iconRow}>
            <Ionicons
              name={paymentIcon(paymentMethod)}
              size={18}
              color={colors.textSecondary}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                {paymentTitle(paymentMethod, savedCard)}
              </Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                {paymentSubtitle(paymentMethod, savedCard)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <SectionLabel colors={colors}>Totals</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.card,
            styles.cardPadded,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TotalsLine
            colors={colors}
            label="Subtotal"
            value={`$${totals.subtotal.toFixed(2)}`}
          />
          <TotalsLine
            colors={colors}
            label="Delivery"
            value={
              totals.delivery === 0 ? 'Free' : `$${totals.delivery.toFixed(2)}`
            }
            sub={totals.delivery === 0 ? 'over $150' : undefined}
            valueColor={totals.delivery === 0 ? colors.success : undefined}
          />
          <TotalsLine
            colors={colors}
            label="Tax (est.)"
            value={`$${totals.tax.toFixed(2)}`}
          />
          {totals.discount > 0 && (
            <TotalsLine
              colors={colors}
              label="Discount"
              value={`−$${totals.discount.toFixed(2)}`}
              valueColor={colors.success}
            />
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Estimated total
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              ${totals.total.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.agreementWrap}>
        <TouchableOpacity
          onPress={onToggleAgree}
          activeOpacity={0.85}
          style={[
            styles.agreement,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="checkbox"
          accessibilityLabel="I understand the final price disclaimer"
          accessibilityState={{ checked: agreed }}
        >
          <View
            style={[
              styles.checkbox,
              agreed
                ? { backgroundColor: colors.primary }
                : {
                    borderWidth: 1.5,
                    borderColor: colors.border,
                  },
            ]}
          >
            {agreed && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
          <Text style={[styles.agreementText, { color: colors.textSecondary }]}>
            I understand this total does not reflect the final price. The final
            price will be determined when item prices are set on the scheduled
            delivery day.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TotalsLine({
  colors,
  label,
  value,
  sub,
  valueColor,
}: {
  colors: (typeof Colors)['light'];
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.totalsLine}>
      <Text
        style={[styles.totalsLabel, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
        {sub && <Text style={{ color: colors.textTertiary }}> · {sub}</Text>}
      </Text>
      <Text style={[styles.totalsValue, { color: valueColor ?? colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardPadded: {
    padding: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemSwatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.065,
  },
  itemMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyRow: {
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  emptyText: {
    fontSize: 13,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  rowIcon: {
    marginTop: 2,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  totalsLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 12,
  },
  totalsValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.22,
  },
  agreementWrap: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  agreement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  agreementText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/StepReview.tsx
git commit -m "feat(checkout): add StepReview with line items, summaries, and agreement"
```

---

## Task 9: StepConfirmed

**Files:**

- Create: `components/checkout/StepConfirmed.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/checkout/StepConfirmed.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type Props = {
  colors: (typeof Colors)['light'];
  orderId: string;
  arrivesLabel: string;
  windowLabel: string;
  address: {
    label: string;
    line: string;
    iconName: keyof typeof Ionicons.glyphMap;
  };
  total: number;
  email: string;
  onTrack: () => void;
  onKeepShopping: () => void;
};

function shortOrderId(orderId: string): string {
  // Render `#GS-XXXX` from the trailing characters of the UUID for visual parity.
  const tail = orderId.replace(/-/g, '').slice(-4).toUpperCase();
  return `#GS-${tail}`;
}

export function StepConfirmed({
  colors,
  orderId,
  arrivesLabel,
  windowLabel,
  address,
  total,
  email,
  onTrack,
  onKeepShopping,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View
          style={[styles.heroOuter, { backgroundColor: colors.success + '14' }]}
        >
          <View
            style={[styles.heroMid, { backgroundColor: colors.success + '26' }]}
          />
          <View
            style={[
              styles.heroInner,
              {
                backgroundColor: colors.success,
                shadowColor: colors.success,
              },
            ]}
          >
            <Ionicons name="checkmark" size={32} color="#fff" />
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Order placed</Text>
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          numberOfLines={3}
        >
          We sent a confirmation to {email || 'your email'}. You&apos;ll get a
          text when your driver leaves the warehouse.
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardRow}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            ORDER
          </Text>
          <Text style={[styles.orderId, { color: colors.text }]}>
            {shortOrderId(orderId)}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.iconRow}>
          <Ionicons
            name="time-outline"
            size={18}
            color={colors.primary}
            style={styles.icon}
          />
          <View style={styles.body}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Arrives {arrivesLabel}
            </Text>
            <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
              Window {windowLabel}
            </Text>
          </View>
        </View>
        <View style={styles.spacer} />
        <View style={styles.iconRow}>
          <Ionicons
            name={address.iconName}
            size={18}
            color={colors.primary}
            style={styles.icon}
          />
          <View style={styles.body}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              {address.label}
            </Text>
            {!!address.line && (
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                {address.line}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.cardRow}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Estimated total
          </Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            ${total.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.ctaRow}>
        <TouchableOpacity
          onPress={onTrack}
          activeOpacity={0.85}
          style={[
            styles.ctaSecondary,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Track order"
        >
          <Ionicons name="map-outline" size={14} color={colors.text} />
          <Text style={[styles.ctaSecondaryLabel, { color: colors.text }]}>
            Track order
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onKeepShopping}
          activeOpacity={0.85}
          style={[
            styles.ctaPrimary,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Keep shopping"
        >
          <Ionicons name="storefront-outline" size={14} color="#fff" />
          <Text style={styles.ctaPrimaryLabel}>Keep shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
  },
  heroOuter: {
    width: 100,
    height: 100,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMid: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 999,
  },
  heroInner: {
    width: 60,
    height: 60,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 6,
  },
  title: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.24,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  icon: {
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  spacer: {
    height: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  ctaSecondaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaPrimaryLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/StepConfirmed.tsx
git commit -m "feat(checkout): add StepConfirmed celebration screen"
```

---

## Task 10: Barrel export

**Files:**

- Create: `components/checkout/index.ts`

- [ ] **Step 1: Create the file**

```ts
// components/checkout/index.ts
export { SectionLabel } from './SectionLabel';
export { CheckoutTopBar } from './CheckoutTopBar';
export { CheckoutStepper } from './CheckoutStepper';
export type { StepperStep } from './CheckoutStepper';
export { CheckoutFooter } from './CheckoutFooter';
export { StepDelivery } from './StepDelivery';
export { StepPayment } from './StepPayment';
export { StepReview } from './StepReview';
export { StepConfirmed } from './StepConfirmed';
export { generateDeliverySlots } from './slots';
export type { DeliverySlot } from './slots';
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/index.ts
git commit -m "chore(checkout): add barrel export for checkout components"
```

---

## Task 11: Rewrite reducer + orchestrator (atomic)

This task replaces both `reducers/checkoutReducer.ts` and `app/checkout.tsx` in a single commit. They are coupled — touching either alone would leave the codebase failing typecheck — so they ship together. After this task, the new design is live.

**Files:**

- Rewrite: `reducers/checkoutReducer.ts`
- Rewrite: `app/checkout.tsx`

- [ ] **Step 1: Rewrite the reducer**

Replace `reducers/checkoutReducer.ts` with:

```ts
// reducers/checkoutReducer.ts
import type { Restaurant } from '@/lib/supabase';

export type PaymentMethod = 'card' | 'ach' | 'invoice' | 'cash';

export interface CheckoutState {
  step: 0 | 1 | 2 | 3;

  // Restaurant
  selectedRestaurantId: string | null;
  dropdownVisible: boolean;

  // Delivery slot
  selectedSlotId: string | null;
  deliveryDate: Date | null;

  // iOS date picker
  iosPickerVisible: boolean;
  iosTempDate: Date;

  // Driver notes
  specialInstructions: string;

  // Payment
  paymentMethod: PaymentMethod;
  selectedCardId: string;

  // Review
  agreed: boolean;

  // Confirmed
  placedOrderId: string | null;
  placedTotal: number | null;

  // Toast
  toastMessage: string | null;
}

export const initialCheckoutState: CheckoutState = {
  step: 0,
  selectedRestaurantId: null,
  dropdownVisible: false,
  selectedSlotId: null,
  deliveryDate: null,
  iosPickerVisible: false,
  iosTempDate: new Date(),
  specialInstructions: '',
  paymentMethod: 'card',
  selectedCardId: 'c1',
  agreed: false,
  placedOrderId: null,
  placedTotal: null,
  toastMessage: null,
};

export type CheckoutAction =
  | { type: 'SET_SELECTED_RESTAURANT_ID'; payload: string | null }
  | { type: 'TOGGLE_DROPDOWN' }
  | { type: 'SET_DROPDOWN_VISIBLE'; payload: boolean }
  | { type: 'SELECT_ADMIN_RESTAURANT'; payload: Restaurant }
  | { type: 'SET_SLOT'; payload: { slotId: string; slotDate: Date } }
  | { type: 'SET_DELIVERY_DATE'; payload: Date }
  | { type: 'OPEN_IOS_PICKER'; payload: Date }
  | { type: 'SET_IOS_TEMP_DATE'; payload: Date }
  | { type: 'CONFIRM_IOS_DATE' }
  | { type: 'CANCEL_IOS_DATE' }
  | { type: 'SET_SPECIAL_INSTRUCTIONS'; payload: string }
  | { type: 'SET_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'SET_SELECTED_CARD'; payload: string }
  | { type: 'TOGGLE_AGREEMENT' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: 0 | 1 | 2 | 3 }
  | { type: 'ORDER_PLACED'; payload: { orderId: string; total: number } }
  | { type: 'SHOW_TOAST'; payload: string }
  | { type: 'DISMISS_TOAST' };

export function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction
): CheckoutState {
  switch (action.type) {
    case 'SET_SELECTED_RESTAURANT_ID':
      return { ...state, selectedRestaurantId: action.payload };

    case 'TOGGLE_DROPDOWN':
      return { ...state, dropdownVisible: !state.dropdownVisible };

    case 'SET_DROPDOWN_VISIBLE':
      return { ...state, dropdownVisible: action.payload };

    case 'SELECT_ADMIN_RESTAURANT':
      return {
        ...state,
        selectedRestaurantId: action.payload.id,
        dropdownVisible: false,
      };

    case 'SET_SLOT':
      return {
        ...state,
        selectedSlotId: action.payload.slotId,
        deliveryDate: action.payload.slotDate,
      };

    case 'SET_DELIVERY_DATE':
      return {
        ...state,
        deliveryDate: action.payload,
        selectedSlotId: null,
      };

    case 'OPEN_IOS_PICKER':
      return {
        ...state,
        iosPickerVisible: true,
        iosTempDate: action.payload,
      };

    case 'SET_IOS_TEMP_DATE':
      return { ...state, iosTempDate: action.payload };

    case 'CONFIRM_IOS_DATE':
      return {
        ...state,
        deliveryDate: state.iosTempDate,
        selectedSlotId: null,
        iosPickerVisible: false,
      };

    case 'CANCEL_IOS_DATE':
      return { ...state, iosPickerVisible: false };

    case 'SET_SPECIAL_INSTRUCTIONS':
      return { ...state, specialInstructions: action.payload };

    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };

    case 'SET_SELECTED_CARD':
      return { ...state, selectedCardId: action.payload };

    case 'TOGGLE_AGREEMENT':
      return { ...state, agreed: !state.agreed };

    case 'NEXT_STEP': {
      if (state.step === 3) return state;
      const next = (state.step + 1) as 0 | 1 | 2 | 3;
      return { ...state, step: next };
    }

    case 'PREV_STEP': {
      if (state.step === 0 || state.step === 3) return state;
      const prev = (state.step - 1) as 0 | 1 | 2;
      return { ...state, step: prev };
    }

    case 'GO_TO_STEP':
      return { ...state, step: action.payload };

    case 'ORDER_PLACED':
      return {
        ...state,
        step: 3,
        placedOrderId: action.payload.orderId,
        placedTotal: action.payload.total,
      };

    case 'SHOW_TOAST':
      return { ...state, toastMessage: action.payload };

    case 'DISMISS_TOAST':
      return { ...state, toastMessage: null };

    default:
      return state;
  }
}
```

- [ ] **Step 2: Rewrite the orchestrator**

Replace `app/checkout.tsx` with:

```tsx
// app/checkout.tsx
import React, { useEffect, useMemo, useReducer, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAdmin } from '@/hooks/useAdmin';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { getAllRestaurants, type Restaurant } from '@/lib/supabase';
import { Toast } from '@/components/ui/Toast';
import {
  CheckoutFooter,
  CheckoutStepper,
  CheckoutTopBar,
  StepConfirmed,
  StepDelivery,
  StepPayment,
  StepReview,
  generateDeliverySlots,
  type DeliverySlot,
  type StepperStep,
} from '@/components/checkout';
import {
  checkoutReducer,
  initialCheckoutState,
  type PaymentMethod,
} from '../reducers/checkoutReducer';

const STEPS: StepperStep[] = [
  { id: 'delivery', label: 'Delivery' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
];

const ARRIVES_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const SAVED_CARDS = [
  { id: 'c1', brand: 'Visa', last4: '4242', exp: '08/27' },
  { id: 'c2', brand: 'Mastercard', last4: '8841', exp: '02/26' },
] as const;

function CheckoutScreenInner() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const { data: userInfo, isLoading: isUserInfoLoading } = useUserInfo();
  const { data: isUserAdmin } = useAdmin();
  const restaurantId = userInfo?.owned_restaurant_id;
  const { data: restaurant, isLoading: isRestaurantLoading } =
    useRestaurant(restaurantId);
  const createOrderMutation = useCreateOrder();
  const { data: cartItems = [] } = useCart();

  const { data: allRestaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: getAllRestaurants,
    enabled: isUserAdmin === true,
  });

  const [state, dispatch] = useReducer(
    checkoutReducer,
    initialCheckoutState,
    initial => ({
      ...initial,
      selectedRestaurantId: restaurantId || null,
    })
  );

  const slots = useMemo(() => generateDeliverySlots(new Date()), []);

  // Prime the default slot once when slots are generated.
  useEffect(() => {
    if (!state.selectedSlotId && !state.deliveryDate && slots.length > 0) {
      dispatch({
        type: 'SET_SLOT',
        payload: { slotId: slots[0].id, slotDate: slots[0].date },
      });
    }
  }, [slots, state.selectedSlotId, state.deliveryDate]);

  // Mirror restaurantId into reducer when it loads (owner path).
  useEffect(() => {
    if (restaurantId && !state.selectedRestaurantId) {
      dispatch({ type: 'SET_SELECTED_RESTAURANT_ID', payload: restaurantId });
    }
  }, [restaurantId, state.selectedRestaurantId]);

  const { data: selectedRestaurant } = useRestaurant(
    state.selectedRestaurantId || undefined
  );
  const activeRestaurant = selectedRestaurant ?? restaurant ?? null;

  const handleSelectRestaurant = (rest: Restaurant) => {
    dispatch({ type: 'SELECT_ADMIN_RESTAURANT', payload: rest });
  };

  const handleSelectSlot = (slot: DeliverySlot) => {
    dispatch({
      type: 'SET_SLOT',
      payload: { slotId: slot.id, slotDate: slot.date },
    });
  };

  const handleAndroidDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (event.type === 'set' && selectedDate) {
      dispatch({ type: 'SET_DELIVERY_DATE', payload: selectedDate });
    }
  };

  const handlePickOtherDate = () => {
    const baseDate = state.deliveryDate ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: 'date',
        display: 'calendar',
        onChange: handleAndroidDateChange,
        minimumDate: new Date(),
      });
    } else {
      dispatch({ type: 'OPEN_IOS_PICKER', payload: baseDate });
    }
  };

  const customDate =
    !state.selectedSlotId && state.deliveryDate ? state.deliveryDate : null;

  const subtotal = useMemo(
    () => cartItems.reduce((acc, line) => acc + line.line_subtotal, 0),
    [cartItems]
  );
  const totals = {
    subtotal,
    delivery: 0,
    tax: 0,
    discount: 0,
    total: subtotal,
  };

  const selectedSlot = useMemo(() => {
    if (state.selectedSlotId) {
      return slots.find(s => s.id === state.selectedSlotId) ?? null;
    }
    return null;
  }, [slots, state.selectedSlotId]);

  const slotSummary = selectedSlot
    ? { day: selectedSlot.day, window: selectedSlot.window }
    : customDate
      ? { day: ARRIVES_FORMAT.format(customDate), window: 'Anytime' }
      : { day: 'Pending', window: 'Pending' };

  const addressLine = activeRestaurant
    ? [
        activeRestaurant.address_line1,
        activeRestaurant.address_line2,
        [activeRestaurant.city, activeRestaurant.postal_code]
          .filter(Boolean)
          .join(', '),
        activeRestaurant.country,
      ]
        .filter(part => part && part.trim().length > 0)
        .join(', ')
    : '';

  const addressSummary = {
    label: activeRestaurant?.name ?? 'Select a restaurant',
    line: addressLine,
    iconName: 'storefront-outline' as const,
  };

  const savedCard =
    state.paymentMethod === 'card'
      ? (SAVED_CARDS.find(c => c.id === state.selectedCardId) ?? null)
      : null;

  const ctaLabel = (() => {
    if (state.step === 0) return 'Continue to payment';
    if (state.step === 1) return 'Continue to review';
    if (state.step === 2) return `Place order · $${totals.total.toFixed(2)}`;
    return '';
  })();

  const ctaDisabled = (() => {
    if (state.step === 0) {
      return (
        !state.selectedRestaurantId ||
        (!state.selectedSlotId && !state.deliveryDate)
      );
    }
    if (state.step === 1) return false;
    if (state.step === 2) return !state.agreed;
    return true;
  })();

  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    const activeRestaurantId = isUserAdmin
      ? state.selectedRestaurantId
      : restaurantId;
    if (!activeRestaurantId) {
      Alert.alert(
        'Error',
        'Restaurant information is missing. Please select a restaurant.'
      );
      return;
    }
    if (!state.deliveryDate) {
      Alert.alert(
        'Delivery Date Required',
        'Please select a delivery date before placing your order.'
      );
      return;
    }

    if (state.paymentMethod !== 'cash') {
      dispatch({
        type: 'SHOW_TOAST',
        payload: 'Coming soon — placed as cash on delivery',
      });
    }

    setPlacing(true);
    try {
      const order = await createOrderMutation.mutateAsync({
        restaurantId: activeRestaurantId,
        deliveryAt: state.deliveryDate,
        paymentMethod: 'cash',
      });
      dispatch({
        type: 'ORDER_PLACED',
        payload: { orderId: order.id, total: order.total_amount },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to place order. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setPlacing(false);
    }
  };

  const handleFooterPress = () => {
    if (state.step === 2) {
      void handlePlaceOrder();
      return;
    }
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    if (state.step === 0) {
      router.back();
      return;
    }
    if (state.step === 3) {
      router.replace(isUserAdmin ? '/admin/(tabs)' : '/(tabs)');
      return;
    }
    dispatch({ type: 'PREV_STEP' });
  };

  const handleTrackOrder = () => {
    if (state.placedOrderId) {
      router.replace({
        pathname: '/order/[id]',
        params: { id: state.placedOrderId },
      });
    }
  };

  const handleKeepShopping = () => {
    router.replace(isUserAdmin ? '/admin/(tabs)' : '/(tabs)');
  };

  // On the Confirmed step, override hardware back / iOS-gesture back so the user
  // can't pop back to the cart with a placed-order screen still mounted behind.
  useEffect(() => {
    if (state.step !== 3) return undefined;
    const unsubscribe = navigation.addListener(
      'beforeRemove',
      (event: { preventDefault: () => void }) => {
        event.preventDefault();
        router.replace(isUserAdmin ? '/admin/(tabs)' : '/(tabs)');
      }
    );
    return unsubscribe;
  }, [state.step, navigation, router, isUserAdmin]);

  const isLoadingDetails =
    isUserInfoLoading || (!!restaurantId && isRestaurantLoading);

  const showStepper = state.step !== 3;
  const stepFooter = state.step === 3 ? null : state.step;

  const arrivesLabel = state.deliveryDate
    ? ARRIVES_FORMAT.format(state.deliveryDate)
    : '';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <CheckoutTopBar colors={colors} step={state.step} onBack={handleBack} />
        {showStepper && (
          <CheckoutStepper
            colors={colors}
            step={state.step as 0 | 1 | 2}
            steps={STEPS}
          />
        )}
        {isLoadingDetails ? (
          <View
            style={styles.loading}
            accessible
            accessibilityLabel="Loading checkout details"
            accessibilityLiveRegion="polite"
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading checkout details…
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              state.step !== 3 && styles.scrollContentWithFooter,
            ]}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() =>
              state.dropdownVisible &&
              dispatch({ type: 'SET_DROPDOWN_VISIBLE', payload: false })
            }
          >
            {!activeRestaurant && state.step !== 3 && (
              <View
                style={[
                  styles.notice,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.noticeTitle, { color: colors.text }]}>
                  Restaurant details missing
                </Text>
                <Text
                  style={[styles.noticeBody, { color: colors.textSecondary }]}
                >
                  We couldn&apos;t find a restaurant linked to your account. Add
                  one to keep your checkout information up to date.
                </Text>
              </View>
            )}

            {state.step === 0 && (
              <StepDelivery
                colors={colors}
                isAdmin={!!isUserAdmin}
                restaurant={activeRestaurant}
                allRestaurants={allRestaurants}
                selectedRestaurantId={state.selectedRestaurantId}
                dropdownVisible={state.dropdownVisible}
                onToggleDropdown={() => dispatch({ type: 'TOGGLE_DROPDOWN' })}
                onSelectRestaurant={handleSelectRestaurant}
                slots={slots}
                selectedSlotId={state.selectedSlotId}
                onSelectSlot={handleSelectSlot}
                onPickOtherDate={handlePickOtherDate}
                customDate={customDate}
                onSelectCustomDate={handlePickOtherDate}
                notes={state.specialInstructions}
                onChangeNotes={text =>
                  dispatch({
                    type: 'SET_SPECIAL_INSTRUCTIONS',
                    payload: text,
                  })
                }
              />
            )}

            {state.step === 1 && (
              <StepPayment
                colors={colors}
                paymentMethod={state.paymentMethod}
                onSelectMethod={method =>
                  dispatch({
                    type: 'SET_PAYMENT_METHOD',
                    payload: method as PaymentMethod,
                  })
                }
                selectedCardId={state.selectedCardId}
                onSelectCard={cardId =>
                  dispatch({ type: 'SET_SELECTED_CARD', payload: cardId })
                }
                email={userInfo?.email ?? ''}
                onShowToast={message =>
                  dispatch({ type: 'SHOW_TOAST', payload: message })
                }
              />
            )}

            {state.step === 2 && (
              <StepReview
                colors={colors}
                items={cartItems}
                address={addressSummary}
                slot={slotSummary}
                paymentMethod={state.paymentMethod}
                savedCard={savedCard}
                totals={totals}
                agreed={state.agreed}
                onToggleAgree={() => dispatch({ type: 'TOGGLE_AGREEMENT' })}
              />
            )}

            {state.step === 3 && state.placedOrderId && (
              <StepConfirmed
                colors={colors}
                orderId={state.placedOrderId}
                arrivesLabel={arrivesLabel}
                windowLabel={slotSummary.window}
                address={addressSummary}
                total={state.placedTotal ?? totals.total}
                email={userInfo?.email ?? ''}
                onTrack={handleTrackOrder}
                onKeepShopping={handleKeepShopping}
              />
            )}
          </ScrollView>
        )}

        {stepFooter !== null && !isLoadingDetails && (
          <CheckoutFooter
            colors={colors}
            step={stepFooter as 0 | 1 | 2}
            total={totals.total}
            ctaLabel={ctaLabel}
            ctaDisabled={ctaDisabled}
            placing={placing}
            onPress={handleFooterPress}
          />
        )}

        <Toast
          message={state.toastMessage ?? ''}
          type="success"
          visible={!!state.toastMessage}
          onHide={() => dispatch({ type: 'DISMISS_TOAST' })}
        />

        {Platform.OS === 'ios' && (
          <Modal
            transparent
            animationType="slide"
            visible={state.iosPickerVisible}
            onRequestClose={() => dispatch({ type: 'CANCEL_IOS_DATE' })}
          >
            <View style={styles.modalBackdrop}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => dispatch({ type: 'CANCEL_IOS_DATE' })}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel date selection"
                  >
                    <Text
                      style={[
                        styles.modalAction,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={[styles.modalTitle, { color: colors.text }]}
                    accessibilityRole="header"
                  >
                    Select delivery date
                  </Text>
                  <TouchableOpacity
                    onPress={() => dispatch({ type: 'CONFIRM_IOS_DATE' })}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm date selection"
                  >
                    <Text
                      style={[styles.modalAction, { color: colors.primary }]}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={state.iosTempDate}
                  mode="date"
                  display="inline"
                  onChange={(_e, d) => {
                    if (d) dispatch({ type: 'SET_IOS_TEMP_DATE', payload: d });
                  }}
                  themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                  textColor={colors.text}
                  style={styles.iosPicker}
                  minimumDate={new Date()}
                />
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </>
  );
}

export default function CheckoutScreen() {
  return <CheckoutScreenInner />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  scrollContentWithFooter: {
    paddingBottom: 200,
  },
  notice: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    width: '100%',
  },
});
```

Notes for the engineer:

- The catalog "Keep shopping" target is the role-appropriate tabs root (`/(tabs)` for owners, `/admin/(tabs)` for admins). The codebase uses `router.replace` throughout for these post-action transitions; matching that here.
- `useCart()` is read directly in the orchestrator; we don't add a separate `useCartRefetchOnFocus` because the screen is pushed (not a tab) and the cart already invalidates on `useCreateOrder` success.
- Hardware-back / iOS swipe-gesture on the Confirmed step is intercepted by the `beforeRemove` listener and rerouted to the catalog tab — matching the spec's requirement that the user can't return to a placed-order screen with stale state. Note: `beforeRemove` events lack a typed payload in some `@react-navigation/native` versions; the inline `event: { preventDefault: () => void }` shape matches the runtime contract without pulling in additional types.

- [ ] **Step 3: Verify it compiles**

Run: `npm run check-all`
Expected: PASS (no typecheck errors, no lint errors, prettier clean).

If lint reports `no-console` warnings from logging in any of the touched files, remove the log or guard with `if (__DEV__)`. If prettier fails, run `npm run prettier:fix`.

- [ ] **Step 4: Manual smoke (Android or iOS dev build)**

Goal: confirm the redesigned flow works end-to-end. This is the visual verification gate from the spec.

Walkthrough as restaurant-owner:

1. Open `/(tabs)/cart` with at least one cart item.
2. Tap **Checkout** to push `app/checkout.tsx`. Confirm: top bar with `Delivery` title and back chevron; 3-node stepper with node 1 active.
3. Confirm the deliver-to card shows the owner restaurant name, address, and `Restaurant` pill (no chevron).
4. Confirm the slot grid shows 4 cards; the first is selected by default and labeled "Recommended". Tap a different slot — selection follows the tap.
5. Tap **Pick another date →** and choose a future date in the picker. Confirm a 5th "Custom · {date}" card appears and is selected.
6. Add text in the driver-notes field.
7. Tap **Continue to payment**. Stepper advances to node 2; top-bar title = `Payment`.
8. The Card chip is selected by default; two saved-card stubs render. Tap **Mastercard** — selection follows.
9. Tap the **ACH bank** chip — saved-cards section is replaced by the Chase Business stub card.
10. Tap **Net-30 invoice** — invoice card renders with your email bolded.
11. Tap **Add card** — toast `Coming soon`.
12. Tap the **Olivetta LLC** billing card — toast `Coming soon`.
13. Tap **Continue to review**. Stepper advances; top-bar title = `Review`.
14. Confirm: order list reflects real cart line items (name, quantity × price, line subtotal); delivery card shows the chosen address and slot; payment card reflects the selected method; totals show `Free` (green) for delivery, `$0.00` for tax, and the bold estimated total matches the running footer total from earlier steps.
15. CTA is disabled. Tap the agreement checkbox; CTA becomes enabled and reads `Place order · $X.XX`. Footer footnote `Secure checkout · Encrypted end-to-end` shows.
16. Tap **Place order**. Spinner replaces icon, label `Placing order…`. Because non-cash chip is selected, a toast `Coming soon — placed as cash on delivery` flashes briefly.
17. On success, screen swaps to the Confirmed step (no top-bar back, no stepper, no footer). Hero ring + checkmark, `Order placed`, subtitle with email, order card with `#GS-XXXX`, arrives label, address, total. Two CTAs: outline `Track order`, primary `Keep shopping`.
18. Tap **Track order** → routes to `/order/[id]`. Back-navigate, return to Cart, place another order to reach Confirmed again, tap **Keep shopping** → routes to catalog tab.
19. Toggle device theme to dark mode and repeat (or run with the device already dark) to confirm dark-mode parity: surface, border, blur tint all switch.

Walkthrough as admin (act on behalf of a restaurant):

1. Sign in as admin. Open `/admin/(tabs)/cart` with cart items.
2. Tap Checkout. Deliver-to card now shows a chevron — tap it to open the inline restaurant list. Tap a different restaurant.
3. Confirm the card updates to the new restaurant's name and address. Stepper, slot, payment, review all proceed identically to the owner flow.
4. Place order. On Confirmed, tap **Keep shopping** → routes to `/admin/(tabs)`.

Edge cases to confirm:

- Empty cart: Review's order list shows "Your cart is empty." Place-order will throw an error from `createOrderFromCart`; verify the Alert renders the message and the screen stays on Review.
- Owner with no restaurant linked: top-of-screen `Restaurant details missing` notice renders. Footer CTA is disabled on step 0.

- [ ] **Step 5: Commit both files together**

```bash
git add reducers/checkoutReducer.ts app/checkout.tsx
git commit -m "refactor(checkout): rewrite checkout as 4-step wizard matching design template"
```

---

## Task 12: Final verification pass

- [ ] **Step 1: Re-run the verification gate**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 2: Confirm no orphaned imports**

Run:

```bash
npx tsc --noEmit
```

Expected: clean exit. No "is declared but never read" or "cannot find name" errors.

- [ ] **Step 3: Diff against spec**

Open `docs/superpowers/specs/2026-05-03-checkout-redesign-design.md` side-by-side with the new screen on a device and confirm each item under the spec's **Verification** section is checked.

- [ ] **Step 4: If everything is green, follow the merge-into-preview workflow**

Per project rules (CLAUDE.md / memory): merge `feature/checkout-redesign` into `preview` locally — do not open a PR. On any merge conflict, stop and consult the user before resolving (parallel agents may have touched the same files).

Suggested commands (only run when ready to integrate):

```bash
git fetch origin preview
git checkout preview
git pull --ff-only origin preview
git merge --no-ff feature/checkout-redesign
# resolve conflicts only after consulting the user
git push origin preview
```

The merge step is intentionally **not** a `- [ ]` checkbox in this plan — execution should pause and confirm with the user before integrating.

---

## Self-review notes

Verified before handoff:

- All spec sections have a corresponding task: top bar (T2), stepper (T3), footer (T4), step components (T5–T9), reducer changes (T11), hook plumbing (T11), place-order wiring (T11), accessibility flags (woven through every component), theming (used across), and verification (T11 step 4 + T12).
- No "TBD" / "TODO" / "implement later" placeholders.
- Type identifiers match across tasks: `DeliverySlot`, `StepperStep`, `PaymentMethod` are defined once and re-imported.
- The `colors` prop type `(typeof Colors)['light']` is consistent across every component.
- Saved-card data is hard-coded inside `StepPayment` (CARDS) and again in the orchestrator (`SAVED_CARDS`). The orchestrator's `SAVED_CARDS` is only used to look up the selected card's display fields for the Review step — `StepPayment` doesn't accept a list because the design treats saved cards as visual stubs, not real data. If real saved cards are added later, this is the seam to replace.
- The empty-cart and missing-restaurant edge cases are handled (Review list shows empty state; missing-restaurant notice on step 0).
- `useCart()` returns the typed `CartItem[]`. `line_subtotal` is the authoritative per-line total — no client-side multiplication is needed.
- The new file at `components/checkout/slots.ts` is referenced by both `StepDelivery` and the orchestrator, exported through the barrel.
