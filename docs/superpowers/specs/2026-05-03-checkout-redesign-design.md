# Checkout Redesign — Restaurant Owner

**Date:** 2026-05-03
**Branch:** `feature/checkout-redesign` (off `preview`)
**Scope:** Redesign of `app/checkout.tsx` for the restaurant owner role. Admin path retained, restyled. No backend changes; no employee-side changes.

## Goal

Redesign the checkout screen to closely match the Claude-design template (`Checkout.html` + `checkout.jsx`) while binding to existing app data. Visual fidelity to the template is the success criterion; missing backend fields are stubbed visually rather than built — same precedent as the profile-tab redesign.

## Source of truth

The handoff bundle is unpacked at `.design-ref/` (gitignored). Files of interest:

- `.design-ref/project/Checkout.html` — top-level tweak defaults, shell, and `STEP_LABELS`.
- `.design-ref/project/checkout.jsx` — full screen implementation: stepper, address picker, slot grid, payment tabs, review, confirmed.
- `.design-ref/project/colors_and_type.css` — token names (mirrored in `constants/Colors.ts`).
- `.design-ref/project/Cart Tab.html` + `cart.jsx` — referenced for shared visual language (line items, glyphs).

## Scope decisions

| Decision              | Choice                                                            | Rationale                                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend gaps          | Visual-only stubs                                                 | Matches profile precedent. Missing features (saved cards, ACH, Net‑30, promo, tax, delivery fee, multi-address) render visually; taps on stubs surface a "Coming soon" toast. |
| Structure             | 4-step in-screen wizard (Delivery → Payment → Review → Confirmed) | Direct match to template. Replaces the current single-page form.                                                                                                              |
| Admin path            | Retained, restyled                                                | When `isAdmin`, the "Deliver to" card opens the existing restaurant dropdown (restyled). Owners see a single read-only restaurant card.                                       |
| Delivery date         | Hybrid — preset slot grid + "Pick another date" link              | Preset cards match the template; calendar fallback preserves any-date freedom that the current screen has.                                                                    |
| Order-placed UX       | In-screen Confirmed step replaces `Alert.alert`                   | Matches template. Track-order CTA → `/order/[id]`; Keep-shopping CTA → catalog tab.                                                                                           |
| Styling               | React Native `StyleSheet` only                                    | Matches every other screen in the codebase. No NativeWind/Tailwind for one screen.                                                                                            |
| Component granularity | Per-step files, not per-primitive                                 | Template's natural unit is a step; most "primitives" (saved-card row, slot card) are checkout-only and would not be reused.                                                   |
| Payment write         | Always `'cash'` regardless of selected chip                       | `createOrderFromCart` only stores `paymentMethod`; ACH / Net‑30 wiring is out of scope. UI shows a pre-submit toast when a non-cash chip is selected.                         |
| Migrations            | None                                                              | No schema, RPC, or RLS changes.                                                                                                                                               |

## File layout

```
components/checkout/
  CheckoutTopBar.tsx       — back chevron (white circle) + centered step title
  CheckoutStepper.tsx      — 3 numbered dots + connecting bars; checkmarks for done
  CheckoutFooter.tsx       — sticky frosted bar (BlurView); running total + CTA + lock footnote
  StepDelivery.tsx         — Deliver-to card(s), slot grid, "Pick another date" link, driver notes
  StepPayment.tsx          — method chips, saved cards (stub), billing entity (stub)
  StepReview.tsx           — line items, delivery summary, payment summary, totals, agreement
  StepConfirmed.tsx        — celebration badge + order card + Track / Keep-shopping CTAs
  CheckoutToast.tsx        — small "Coming soon" toast (or reuse existing Toast primitive)
  index.ts                 — barrel export
app/checkout.tsx           — orchestrator (~150–200 LOC): step navigation, hook wiring, dispatch
reducers/checkoutReducer.ts — extended (see Reducer changes below)
```

`.design-ref/` and `.superpowers/` stay gitignored.

## Component contracts

### `CheckoutTopBar`

```ts
type Props = {
  step: 0 | 1 | 2 | 3;
  onBack: () => void;
};
```

Step 0–2: back chevron in a 36×36 surface circle (`colors.surface`, 1px `colors.border`), centered title (`Delivery | Payment | Review`), 36px right spacer for symmetry. Step 3: no back, title `Confirmed`. Top padding driven by `useSafeAreaInsets().top + 8`.

### `CheckoutStepper`

```ts
type Props = {
  step: 0 | 1 | 2; // not rendered on Confirmed
  steps: { id: string; label: string }[];
};
```

3 nodes: 26×26 circles, primary fill when active or done, surface fill with border when pending. Done state shows checkmark; active/pending show `i + 1`. Labels under each node (10px semibold, primary color when active/done). Connecting 2px bars between nodes use primary when index < step, border otherwise.

### `CheckoutFooter`

```ts
type Props = {
  step: 0 | 1 | 2;
  total: number;
  ctaLabel: string;
  ctaDisabled: boolean;
  placing: boolean;
  onPress: () => void;
};
```

Absolute-positioned sticky footer. Light: `rgba(255,255,255,0.94)`; dark: `rgba(11,15,18,0.92)`; both wrapped in `expo-blur` `BlurView` (intensity 18, tint per scheme). 1px top border in `colors.border`.

- Steps 0, 1: shows `Estimated total $X.XX` row above CTA.
- Step 2: hides total row, shows lock-icon footnote `Secure checkout · Encrypted end-to-end` below CTA.
- CTA: full-width, primary background, primary-tinted shadow, 14px vertical pad, `arrow-forward` icon on 0/1, `lock-closed` icon on 2.
- Disabled: `colors.textSecondary` background, `opacity 0.7`, no shadow.
- Placing: spinner replaces icon, label becomes `Placing order…`.

### `StepDelivery`

```ts
type Props = {
  colors: ColorScheme;
  isAdmin: boolean;
  restaurant: Restaurant | null;
  allRestaurants: Restaurant[];
  selectedRestaurantId: string | null;
  onSelectRestaurant: (rest: Restaurant) => void;
  slots: DeliverySlot[];
  selectedSlotId: string | null;
  onSelectSlot: (id: string) => void;
  onPickOtherDate: () => void;
  customDate: Date | null;
  notes: string;
  onChangeNotes: (text: string) => void;
};
```

Three sections, each with a `SectionLabel` (20px top pad, 15px bold title, optional right-aligned action button in primary color):

1. **Deliver to** — owner: single 14px-padded card with 38×38 store icon tile, restaurant name + grey "Restaurant" pill, address line below. No radio. Admin: same card visual but tappable; toggles an inline expansion (preserves current `dropdownVisible` reducer flag and `getAllRestaurants` query) restyled to match the new card aesthetic — list rows render as compact restaurant rows with the same selected-state visuals as the slot grid. Selected state on the parent card shows a 20×20 primary-filled checkmark on the right.
2. **Delivery window** — 2-column grid of `SlotCard`s. Active slot: primary background, white text, 6px primary-tinted shadow. Inactive: surface background, border, no shadow. Day on top (11px medium), window time below (14px bold), optional note (10px regular). Below the grid: text link `Pick another date →` in primary color, opens existing date picker. Selecting a custom date renders a 5th "Custom · {formatted date}" card after the grid.
3. **Driver notes** — single card containing a 3-row textarea, no border on the input itself, placeholder `Buzz back door, leave with line cook…`.

### `StepPayment`

```ts
type Props = {
  colors: ColorScheme;
  paymentMethod: 'card' | 'ach' | 'invoice' | 'cash';
  onSelectMethod: (m: 'card' | 'ach' | 'invoice') => void;
  selectedCardId: string;
  onSelectCard: (id: string) => void;
  onShowToast: (message: string) => void;
};
```

Three sections:

1. **Pay with** — horizontal `ScrollView` of pill chips (10×14 padding, 999 radius). Active chip: primary fill, white text, primary-tinted shadow. Inactive: surface fill, border. Three options: Card (`card-outline`), ACH bank (`business-outline`), Net‑30 invoice (`receipt-outline`).
2. **Saved cards** (only when `paymentMethod === 'card'`) — section action `Add card` (toast). Two stub cards rendered: `Visa ••4242 / Default` and `Mastercard ••8841`. Each: 44×30 brand mark (Visa: `#1A1F71`; Mastercard: `#000`) on the left, brand-letter all-caps inside; `•••• {last4}` and `Expires {exp}` text in the middle; selected indicator on the right.
   - When `paymentMethod === 'ach'`: render a single info card with `Chase Business ••5821 / Settles in 2–3 business days` and a `success` checkmark icon on the right.
   - When `paymentMethod === 'invoice'`: render a single info card with `Net‑30 invoicing / We'll email an invoice to {user.email} after delivery. Payment due within 30 days.` Email is bolded; interpolation uses real `userInfo.email`.
3. **Billing** — read-only stub card: `Olivetta LLC · EIN ••3412 · Tax-exempt resale`, chevron-forward on the right. Tap → toast.

### `StepReview`

```ts
type Props = {
  colors: ColorScheme;
  items: CartLine[];
  address: { label: string; line: string; iconName: IoniconName };
  slot: { day: string; window: string };
  paymentMethod: 'card' | 'ach' | 'invoice' | 'cash';
  savedCard: { brand: string; last4: string; exp: string } | null;
  totals: {
    subtotal: number;
    delivery: number;
    tax: number;
    discount: number;
    total: number;
  };
  agreed: boolean;
  onToggleAgree: () => void;
};
```

Five `Card`s separated by `SectionLabel`s:

1. **Order** — line items from real cart (`useCart()`). Each row: 36×36 gradient swatch with item glyph (reuse cart's glyph component if available, else colored circle), name, `{qty} {unit} · ${price}/{unit}`, line total on the right. Divider between items.
2. **Delivery** — address row (icon + label + address) + divider + window row (`time-outline` + `{day} · {window}` + `Driver will text on arrival`).
3. **Payment** — single row: method icon + payment label (`Visa •••• 4242 / Expires 08/27` or `ACH bank / Chase Business ••5821` or `Net‑30 invoice / Net‑30 terms`).
4. **Totals** — `Subtotal` (real), `Delivery` (`Free` stub, `colors.success`, sublabel `over $150`), `Tax (est.)` ($0.00 stub), no discount line by default, divider, bold `Estimated total` with 22px primary-text total.
5. **Agreement** — full-width row: 20×20 checkbox (primary fill when checked) + disclaimer text matching the existing pricing model: `I understand this total does not reflect the final price. The final price will be determined when item prices are set on the scheduled delivery day.` The CTA in the footer is disabled until checked.

### `StepConfirmed`

```ts
type Props = {
  colors: ColorScheme;
  orderId: string;
  deliveryAt: Date;
  windowLabel: string; // e.g. "6–9 AM" — derived from selected slot, or "Anytime" if custom date
  address: { label: string; line: string; iconName: IoniconName };
  total: number;
  email: string;
  onTrack: () => void;
  onKeepShopping: () => void;
};
```

Centered hero: 100×100 light-success ring → 76×76 mid-success ring → 60×60 solid `colors.success` circle with checkmark and primary-tinted glow shadow. Title `Order placed` (24px bold), subtitle `We sent a confirmation to {email}. You'll get a text when your driver leaves the warehouse.`

Order card: order ID row (uppercase `Order` label + bold `#GS-{shortId}`), divider, arrives row (clock + `Arrives {formatted day}` + `Window {windowLabel}`), spacer, address row, divider, `Estimated total $X.XX`.

Two CTAs side by side at 16px top margin: outline `Track order` (map-outline icon) → `/order/[orderId]`; primary `Keep shopping` (storefront-outline icon, primary-tinted shadow) → catalog tab.

No top-bar back. No stepper. No sticky footer.

### `CheckoutToast`

Tiny top-anchored pill, `accessibilityLiveRegion="polite"`, auto-dismisses at 2 seconds. Reuse `components/ui/Toast.tsx` if its API fits; otherwise write a small self-contained component.

## Reducer changes (`reducers/checkoutReducer.ts`)

New fields on `CheckoutState`:

```ts
step: 0 | 1 | 2 | 3;
agreed: boolean;
selectedSlotId: string | null;
selectedCardId: string;
placedOrderId: string | null;
placedTotal: number | null;
toastMessage: string | null;
```

Widened union: `paymentMethod: 'card' | 'ach' | 'invoice' | 'cash'`. Initial `paymentMethod` is `'card'` to match template default; `'cash'` is what gets _sent_ to `createOrderFromCart` regardless.

Initial state additions:

```ts
step: 0,
agreed: false,
selectedSlotId: null,           // screen sets to slots[0].id after generateDeliverySlots(now)
selectedCardId: 'c1',
placedOrderId: null,
placedTotal: null,
toastMessage: null,
```

The screen primes `selectedSlotId` and `deliveryDate` once on mount via `generateDeliverySlots(now)[0]`. Hard-coding the id here would drift from the generated set if the slot generator is changed.

New action types:

- `NEXT_STEP` / `PREV_STEP` / `GO_TO_STEP { step }`
- `SET_SLOT { slotId, slotDate }` — sets `selectedSlotId` _and_ `deliveryDate` atomically
- `TOGGLE_AGREEMENT`
- `SET_SELECTED_CARD { cardId }`
- `SHOW_TOAST { message }` / `DISMISS_TOAST`
- `ORDER_PLACED { orderId, total }` — sets `placedOrderId`, `placedTotal`, `step: 3`

Existing `SET_DELIVERY_DATE` keeps current behavior (used by "Pick another date").

## Hook plumbing (`app/checkout.tsx`)

- `useUserInfo()` — for email shown in Confirmed and Net‑30 cards.
- `useAdmin()` — toggles admin path on the "Deliver to" card.
- `useRestaurant(restaurantId)` + `useQuery({ queryKey: ['all-restaurants'], queryFn: getAllRestaurants, enabled: isAdmin })` — unchanged.
- `useCart()` — line items for `StepReview` order card. Subtotal computed client-side.
- `useCreateOrder()` — Place Order. On success: `dispatch({ type: 'ORDER_PLACED', payload: { orderId, total } })`. On error: `Alert.alert('Error', message)` with the message from `createOrderFromCart`.

`generateDeliverySlots(now: Date): Slot[]` lives next to the screen (not in `lib/`) — it's screen-local presentation logic. Returns four entries:

```ts
[
  { id: 'tomorrow-am', day: 'Tomorrow',     window: '6–9 AM', note: 'Recommended', date: <tomorrow @ 06:00> },
  { id: 'tomorrow-pm', day: 'Tomorrow',     window: '2–5 PM', note: null,          date: <tomorrow @ 14:00> },
  { id: 'plus2-am',    day: <weekday + date>,window: '6–9 AM', note: null,         date: <+2d @ 06:00> },
  { id: 'plus3-am',    day: <weekday + date>,window: '6–9 AM', note: null,         date: <+3d @ 06:00> },
]
```

## Place-order wiring & validation

**Per-step CTA gating:**

- Step 0 → 1: `selectedSlotId || customDate` AND `selectedRestaurantId` resolved.
- Step 1 → 2: always permitted (a method is always selected).
- Step 2 → submit: `agreed === true`.

**Submit flow on Review:**

1. `setPlacing(true)` (local state in `app/checkout.tsx`).
2. If `paymentMethod !== 'cash'`: dispatch `SHOW_TOAST` with `Coming soon — placed as cash on delivery`.
3. `await createOrderMutation.mutateAsync({ restaurantId, deliveryAt, paymentMethod: 'cash' })`.
4. On success: `dispatch({ type: 'ORDER_PLACED', payload: { orderId: order.id, total: order.total_amount } })`.
5. On error: `Alert.alert('Error', message)`. Stay on Review.
6. `finally: setPlacing(false)`.

**Back navigation:**

- Steps 0–2: footer CTA advances; top-bar back retreats. Step 0 back calls `router.back()`.
- Step 3 (Confirmed): no back rendered. Hardware/iOS-gesture back is overridden to navigate to the catalog tab so the user can't return to a placed-order screen with stale state.

**Loading states:**

- Initial: matches current behavior — `isUserInfoLoading || (!!restaurantId && isRestaurantLoading)` → full-screen spinner with `accessibilityLabel="Loading checkout details"`.
- Mutation: spinner inside CTA (per `CheckoutFooter` contract).

**Empty cart at Review:** render the cards as-is with $0 totals. The mutation will surface a clear error from `createOrderFromCart`; display via the existing Alert path.

**Restaurant missing:** keep the "Restaurant details missing" notice, restyled to fit between the top-bar and the Stepper. CTA stays disabled across all steps.

## Accessibility

- Selectable cards: `accessibilityRole="radio"`, `accessibilityState={{ selected }}`.
- Stepper: `accessibilityLabel="Step {n} of 3, {label}"`, `accessibilityRole="header"`.
- Place Order CTA: `accessibilityRole="button"`, `accessibilityState={{ disabled, busy: placing }}`.
- Toast: `accessibilityLiveRegion="polite"`.
- Agreement checkbox: `accessibilityRole="checkbox"`, `accessibilityState={{ checked: agreed }}`.

## Theming

Light + dark via existing `useAppColorScheme()` and `Colors[scheme]`. Sticky-footer blur uses `expo-blur` `BlurView` (intensity 18, `tint="light" | "dark"` matching scheme). Verify `expo-blur` is in `package.json` during the implementation plan; if absent, fall back to a high-opacity surface tint.

## Out of scope (explicit)

- Real ACH / Net‑30 / saved-card backends.
- Real promo codes (the discount line in totals only renders when a promo is applied; we never apply one for now).
- Real tax / delivery-fee calculation.
- Per-order tracking detail beyond what `/order/[id]` already shows.
- Migration of `paymentMethod` field on `orders` to allow non-cash values.
- Cart-tab redesign — same template bundle covers it but is separate work.
- Employee-side or admin dashboard checkout (admin path in this redesign is for _acting on behalf of a restaurant_, not the admin tab).

## Verification

- `npm run check-all` (typecheck + lint + prettier) is green.
- Manual visual diff against `Checkout.html` rendered locally — cards, stepper, footer, confirmation hero match.
- Light + dark mode parity.
- Owner path: open from Cart → Delivery shows real address + 4 slots → Payment defaults to Card with 2 stub cards → Review shows real cart line items and disabled CTA until agreement → Place Order succeeds → Confirmed renders with real order ID → Track order navigates to `/order/[id]` → Keep shopping navigates to catalog tab.
- Admin path: select a different restaurant from the "Deliver to" card; address and contact info update accordingly; rest of flow identical.
- Toast fires on: Add new address, Add card, Billing entity, ACH chip, Net‑30 chip, and pre-submit if `paymentMethod !== 'cash'`.
