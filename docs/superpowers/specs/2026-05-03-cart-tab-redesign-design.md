# Cart Tab Redesign — Restaurant Owner

**Date:** 2026-05-03
**Branch:** `feature/cart-tab-redesign` (off `preview`)
**Scope:** Visual redesign of `(tabs)/cart.tsx` for the restaurant owner role. No backend changes, no schema changes, no new RPCs. Admin/employee paths share the same component and inherit the redesign with no role-specific behavior added.

## Goal

Redesign the cart tab to match the Anthropic-design template (`Cart Tab.html` + `cart.jsx`) while binding to existing app data. Visual fidelity to the template is the success criterion; missing backend fields are omitted rather than stubbed.

## Source of truth

The handoff bundle is unpacked at `.design-ref/` (gitignored). Files of interest:

- `.design-ref/project/Cart Tab.html` — top-level tweak defaults and shell layout
- `.design-ref/project/cart.jsx` — full screen implementation (header, lines, summary, footer)
- `.design-ref/project/colors_and_type.css` — token names (already mirrored in `constants/Colors.ts`)

The template's `EDITMODE-BEGIN` defaults represent the user's final landing state. The three optional sections (`showSuggestions`, `showDeliveryPicker`, `showPromo`) are OFF in those defaults and OUT OF SCOPE here per Q1 below.

## Scope decisions

| Decision                                               | Choice                                                                                          | Rationale                                                                                                                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 — Optional template sections                        | Drop "Pairs well with", delivery-window picker, promo code                                      | None have a backend data source. Adding any would expand scope from "UI redesign" to "feature add".                                                                              |
| Q2 — Existing interactions (tap-to-edit modal + swipe) | Keep both. Add the template's "Remove" text button on every card                                | Restaurants order in large quantities (template seed has `qty: 18`); typing exact amounts via modal is genuinely useful. Swipe stays for native iOS feel; Remove adds discovery. |
| Q3 — Card thumbnail                                    | Real `image_url` when present, gradient + Ionicon fallback when missing                         | Preserves real product photos for items that have them. Falls back gracefully to a styled tile, not a gray box.                                                                  |
| Q4 — Header                                            | Scrollable big-title header with rich subtitle; "Clear all" moves to the section title row      | Matches template's visual rhythm. Pinned headers in the rest of the app are exceptions, not the rule.                                                                            |
| Q5 — Summary card                                      | Skip. Disclaimer pill renders inline above the sticky footer. Footer = label + total + Checkout | Without tax/delivery/discount data, the summary card collapses to one row that duplicates the footer.                                                                            |
| Q6 — Density tweak                                     | Drop. Ship "regular" only                                                                       | Density tweaks aren't a user-facing setting elsewhere in the app. The template's density toggle is a designer-prototype control.                                                 |
| Pull-to-refresh                                        | Skip                                                                                            | `useCart` already invalidates on focus (via `useCartRefetchOnFocus`, added here) and on every mutation. Manual refresh would be cosmetic.                                        |
| Footer button layout                                   | Two-line: total on top, full-width Checkout button on bottom                                    | Template uses this layout. Larger tap target for the primary action.                                                                                                             |
| Vendor / season-note / `$/unit` suffix variations      | Omit                                                                                            | None of those fields exist on `CartItem`. We render `$X.XX/each` only.                                                                                                           |

## File layout

```
components/cart/
  CartHeader.tsx           ← rewritten (now scrolls, big title + rich subtitle)
  CartSectionTitle.tsx     ← NEW: "This order" + inline "Clear all" link
  CartLineCard.tsx         ← NEW: card-style row with image tile, stepper, Remove
  CartSwipeableLine.tsx    ← NEW: wraps CartLineCard with useSwipeToDelete gesture
  CartDisclaimer.tsx       ← NEW: the disclaimer pill (rendered inline in the ScrollView)
  CartSummaryFooter.tsx    ← NEW: replaces CartFooter — only the sticky bar (absolutely positioned)
  CartEmptyState.tsx       ← NEW: extracted, restyled to template
  CartScreenComponent.tsx  ← rewritten orchestrator (~150 LOC)
  EditQuantityModal.tsx    ← unchanged
  SwipeableRow.tsx         ← deleted
  CartList.tsx             ← deleted
```

`reducers/cartReducer.ts` is unchanged. `hooks/useCart.ts` is unchanged. `app/(tabs)/cart.tsx` is unchanged (still renders `<CartScreenComponent />`). `.design-ref/` stays gitignored.

## Component contracts

### `CartHeader`

```ts
type Props = {
  productCount: number; // distinct line items
  unitCount: number; // sum of quantities
  restaurantName?: string; // hidden when undefined
};
```

Renders `Cart` (26pt bold, `letterSpacing: -0.01em`) and a 13pt subtitle composed as: `${productCount} ${productCount === 1 ? 'product' : 'products'} · ${unitCount} units${restaurantName ? ` · ${restaurantName}` : ''}`. `paddingTop: insets.top + 8`, `paddingHorizontal: 20`. No "Clear" button here.

### `CartSectionTitle`

```ts
type Props = {
  title: string; // "This order"
  actionLabel?: string; // "Clear all"
  onActionPress?: () => void;
  actionDisabled?: boolean; // true while clearing
  actionBusy?: boolean; // shows ActivityIndicator
};
```

17pt bold title left, 12pt semibold action right (`colors.textTertiary`). When `actionBusy`, the action text is replaced by a small `ActivityIndicator`. Replaces the inline clear button from today's `CartHeader`.

### `CartLineCard`

```ts
type Props = {
  item: CartItem;
  imageUrl: string | null;
  isUpdating: boolean; // updatingItemId === item.item_id
  onIncrement: () => void;
  onDecrement: () => void; // − morphs into trash icon when quantity === 1
  onRemove: () => void; // "Remove" text button
  onPress: () => void; // opens edit-quantity modal
};
```

Card surface (`colors.surface`, `borderRadius: 14`, padding 12). Light mode: `shadowOffset: {0,2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2`. Dark mode: `borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border`.

Layout:

- **Left tile** (60×60, `borderRadius: 12`, flex-shrink 0): if `imageUrl`, render `<Image resizeMode="cover" />`; else render a `linear-gradient(135deg, ${colors.primary}33 → ${colors.primary}1A)` background with a centered `leaf-outline` Ionicon (24pt, `colors.primary`).
- **Right column** (flex 1):
  - **Top row**: name (14pt semibold, ellipsized) + line subtotal (14pt bold), opposite ends.
  - **Sub row**: `$X.XX/each` (11pt regular, `colors.textSecondary`).
  - **Stepper row** (margin-top 8): pill stepper on the left, "Remove" text button on the right.
- **Stepper pill**: `colors.inputBg` background, 999 radius, padding 2. Dark mode adds 1px `colors.border` ring. Three children:
  - `−` button (26×26, transparent). When `quantity > 1` shows `remove` icon (`colors.text`); when `quantity === 1` shows `trash-outline` (`colors.error`).
  - Center: bold qty (13pt, `colors.text`) with no unit suffix (we don't have unit data). When `isUpdating`, replace with `<ActivityIndicator size="small" color={colors.primary} />`.
  - `+` button (26×26, `colors.primary` filled, white `add` icon).
  - Hit slop `{top:10, bottom:10, left:10, right:10}` on each stepper button.
- **"Remove" text button**: `Pressable`, 11pt medium, `colors.textTertiary`, `padding: 4 6`, hit slop 10/10/10/10.

### `CartSwipeableLine`

```ts
type Props = CartLineCardProps;
```

Wraps `CartLineCard` with the existing `useSwipeToDelete` hook and the red full-height delete action (lifted from today's `SwipeableRow.tsx`). Forwards all props. Tapping the action snaps `translateX` back to 0 then calls `onRemove`. The card's `onPress` only fires when `!isSwiping.value && Math.abs(translateX.value) < 1` — the same guard `SwipeableRow` uses today.

### `CartDisclaimer`

```ts
type Props = {};
```

Self-contained pill rendered **inline at the bottom of the ScrollView** (not inside the absolute footer). 1px `colors.border` ring on `colors.background`, 11pt `colors.textSecondary` text, `information-circle-outline` icon at 14pt with `importantForAccessibility="no-hide-descendants"`. Copy reused verbatim from today's `CartFooter`:

> "This total does not reflect the final price. The final price will be determined when item prices are set on the scheduled delivery day."

### `CartSummaryFooter`

```ts
type Props = {
  total: number;
  animatedTotalStyle: AnimatedStyle<TextStyle>; // owned by orchestrator
  onCheckout: () => void;
};
```

**Sticky footer only** — the disclaimer is a separate component. Absolutely positioned at `bottom: insets.bottom + tabBarHeight`. Background = `BlurView` (`expo-blur`, `intensity={80}`, `tint={colorScheme === 'dark' ? 'dark' : 'light'}`) over a solid `colors.surface` underlay (so the blur is decorative, not load-bearing). Top hairline border in `colors.border`. Content:

- Top row: "Estimated total" label (11pt regular `colors.textSecondary`) above the animated total (22pt bold, `colors.text`, `letterSpacing: -0.01em`).
- Bottom row: full-width Checkout button. `borderRadius: 14`, `paddingVertical: 14`, `backgroundColor: colors.primary`, white text (15pt bold), trailing `arrow-forward` Ionicon (16pt). Soft `colors.primary` at 40% alpha shadow.

Render nothing when cart is empty/loading/error (orchestrator gates this).

### `CartEmptyState`

```ts
type Props = { onBrowse: () => void };
```

Centered. 88×88 circle (`colors.primary` at 14% alpha) with `basket-outline` 40pt inside. "Your cart is empty" 20pt bold. "Browse this week's harvest and start filling up your kitchen." 13pt regular `colors.textSecondary`. "Browse produce" pill button (`colors.primary`, white text, 999 radius, soft `colors.primary` at 33% alpha shadow).

### `CartScreenComponent` (orchestrator)

- Wires `useCart`, `useClearCart`, `useAddToCart`, `useItems`, `useUserInfo`, `useRestaurant(userInfo?.owned_restaurant_id)`, `useAdmin`, `useAppColorScheme`, `useRouter`, `useReducer(cartReducer)`, `useBottomTabBarHeight`, `useSafeAreaInsets`, **and `useCartRefetchOnFocus`** (newly added).
- Computes `productCount = cartItems.length`, `unitCount = cartItems.reduce((a, i) => a + i.quantity, 0)`, `total = cartItems.reduce((s, i) => s + i.line_subtotal, 0)`.
- Owns the animated total flash (`totalScale` spring 1 → 1.1 → 1, `totalOpacity` timing 1 → 0.5 → 1, gated by `prevTotalRef.current !== total && prevTotalRef.current > 0`) — passed to `CartSummaryFooter` as `animatedTotalStyle`.
- Renders `<GestureHandlerRootView><SafeAreaView><ScrollView>` with: `CartHeader` → `CartSectionTitle` → `cartItems.map(...)` → `<CartDisclaimer />` → bottom spacer; then `<CartSummaryFooter>` absolutely; then `<EditQuantityModal>` unchanged.
- ScrollView bottom padding = footer height + `insets.bottom + tabBarHeight + 16`. Footer height is constant `FOOTER_HEIGHT = 128` (estimated total label + value + button + vertical paddings). If layout drift becomes visible, swap to measuring with `onLayout` in a follow-up.
- Empty / loading / error branches return `<CartEmptyState>` / `<LoadingView message="Loading cart..." />` / the existing `alert-circle-outline` error block instead of the ScrollView. No header, no footer, no disclaimer pill in those branches.
- `onBrowse` (passed to `CartEmptyState`) routes to `/admin/(tabs)/explore` when `isUserAdmin`, else `/(tabs)/explore`.

## Data binding

| Visual element   | Source                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Big "Cart" title | static                                                                                                     |
| `productCount`   | `cartItems.length`                                                                                         |
| `unitCount`      | `cartItems.reduce((a, i) => a + i.quantity, 0)`                                                            |
| `restaurantName` | `useRestaurant(userInfo?.owned_restaurant_id).data?.name`, only when `!isUserAdmin` (matches today's rule) |
| Card thumbnail   | `itemImageMap.get(item.item_id)` from `useItems`                                                           |
| Item name        | `item.item_name`                                                                                           |
| Line subtotal    | `item.line_subtotal`                                                                                       |
| `$X.XX/each`     | `item.item_price`                                                                                          |
| Stepper qty      | `item.quantity`                                                                                            |
| `total` (footer) | `cartItems.reduce((s, i) => s + i.line_subtotal, 0)`                                                       |
| Disclaimer copy  | reused verbatim from today's `CartFooter`                                                                  |

No new hook, no new RPC, no new field on `CartItem`.

## State, interactions, animations

`reducers/cartReducer.ts` is unchanged: `isClearing`, `updatingItemId`, `editingItem`, `editQuantity`. The orchestrator dispatches the same actions for the same transitions.

**Quantity stepper:**

- `+` → `handleUpdateCartItem(item.item_id, +1)` → `Haptics.Light` → `dispatch(START_UPDATING_ITEM)` → `addToCartMutation.mutateAsync({ itemId, quantityDelta: 1 })` → on settle `dispatch(FINISH_UPDATING_ITEM)`. While `updatingItemId === item.item_id`, the qty number is replaced by `<ActivityIndicator>` inside the pill.
- `−` when `qty > 1` → same path with `-1`. When `qty === 1`, the icon morphs into `trash-outline` (`colors.error`) and tapping it routes through `handleDeleteItem` instead → `Haptics.Medium` → delta of `-quantity` → screen-reader announce "Item removed from cart".
- A second stepper tap while `updatingItemId !== null` is no-op'd (preserved guard from today: `if (updatingItemId) return`).

**Tap row → edit modal:** unchanged behavior. `<CartLineCard onPress>` calls `handleItemPress(item)` → `dispatch(START_EDITING_ITEM, payload)`. `EditQuantityModal` renders from `editingItem !== null`. Save → validate ≥ 1, compute delta, call `handleUpdateCartItem` if delta ≠ 0, announce "Quantity updated to N", close modal.

**Swipe-to-delete:** `useSwipeToDelete` reused as-is. Red full-height delete action with `trash` icon + "Delete" label on the right. Tapping the action snaps `translateX` back to 0 then calls `onRemove`.

**"Remove" text button:** plain `Pressable` ("Remove", 11pt medium, `colors.textTertiary`) bottom-right of the stepper row. Calls `handleDeleteItem(item.item_id)`.

**"Clear all" link:** routes to existing `handleClearCart` → `Alert.alert` confirm → `clearCartMutation.mutateAsync` → screen-reader announce "Cart cleared". Disabled + spinner-substituted while `isClearing || clearCartMutation.isPending`.

**Animated total flash:** existing `totalScale` and `totalOpacity` shared values, computed in the orchestrator, applied by `CartSummaryFooter` to the `Animated.Text` total only — not the label.

No new state, no new mutations.

## Theming

- Every color from `Colors[useAppColorScheme()]`. Hex hardcoded only for the gradient-tile alpha-suffix stops (`colors.primary` at `33`/`1A`).
- Card surface: `colors.surface`. Dark adds `borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border`. Light adds the card shadow.
- Sticky footer: `BlurView` (`expo-blur`) `intensity={80}`, `tint` from color scheme, over solid `colors.surface` underlay. Top hairline `colors.border`.
- Disclaimer pill: 1px `colors.border` ring on `colors.background`, 11pt `colors.textSecondary`, `information-circle-outline` 14pt.
- Stepper pill: `colors.inputBg`. Dark mode adds 1px `colors.border` ring. `+` button: `colors.primary` filled, white icon.
- "Remove" / "Clear all": `colors.textTertiary`.
- Trash variant on stepper, swipe action background, error icon: `colors.error`.
- Empty-state CTA: `colors.primary` pill, white text, soft `colors.primary` at 33% alpha shadow.

## Loading, error, empty

| State                                                              | Behavior                                                                                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useCart` `isLoading`                                              | Render the existing `<LoadingView message="Loading cart..." />` in place of the entire scroll content. Footer not rendered.                       |
| `useCart` `error` truthy                                           | Render the existing centered `alert-circle-outline` (48pt, `colors.error`) + "Failed to load cart. Please try again." block. Footer not rendered. |
| `cartItems` length 0, not loading, no error                        | Render `<CartEmptyState onBrowse={...}/>`. Footer not rendered.                                                                                   |
| `restaurant` undefined (no `owned_restaurant_id`) or `isUserAdmin` | Hide restaurant name from header subtitle.                                                                                                        |
| `useItems` slow / `imageUrl` null                                  | Card uses gradient + leaf-outline fallback tile.                                                                                                  |

## Accessibility

- `<SafeAreaView accessibilityLabel="Shopping Cart Screen">` (preserved).
- Header title: `accessibilityRole="header"`, label = "Cart, {productCount} {products|product}, {unitCount} units{, restaurantName when present}".
- Card row: outer `Pressable` keeps `accessibilityActions=[{ name: 'delete', label: 'Delete item' }]` + `onAccessibilityAction` forwarding to the remove handler.
- `+` / `−` buttons: `accessibilityRole="button"`, `accessibilityLabel={"Increase|Decrease quantity of {item_name}"}`, `accessibilityState: { disabled, busy }`. When `−` is in trash mode (qty === 1), `accessibilityLabel` becomes `"Remove {item_name} from cart"`.
- "Remove" text button: `accessibilityRole="button"`, label = `"Remove {item_name} from cart"`. Hit slop 10/10/10/10.
- "Clear all" link: `accessibilityRole="button"`, label = "Clear cart", `accessibilityState: { disabled, busy }`.
- Empty-state button: `accessibilityRole="button"`, label "Browse produce".
- Disclaimer icon: `importantForAccessibility="no-hide-descendants"`.
- Min hit target ≥ 44pt: stepper buttons are 26×26 with hit slop ≥ 10 on every side; `Remove` text button has matching hit slop.
- Live announcements (preserved): "Cart cleared" after clear; "Item removed from cart" after delete; "Quantity updated to N" after modal save.

## Verification

- `npm run check-all` (typecheck + ESLint + Prettier) must pass before merging.
- No new tests — repo has no test runner configured.
- Manual visual check on iOS + Android, light + dark mode:
  - Cart with 1 product, 5 products, ~15+ products (long scroll)
  - Item with image / item without image
  - Stepper at qty 1 (trash variant) and qty > 1
  - Tap row → edit modal save / cancel
  - Swipe row → delete action
  - "Remove" text button → delete
  - "Clear all" confirm flow
  - Empty / loading / error branches
  - Restaurant name present / absent
  - Tab bar bottom inset clears the sticky footer (no overlap)
  - Animated total flash on quantity change
  - Frosted footer renders with the BlurView underlay (or falls back to solid surface gracefully)

## Out of scope

- "Pairs well with" suggestion rail (no backend data source).
- Delivery-window picker (no delivery-slot schema).
- Promo code field (no promo schema).
- Vendor name on cards (not in `CartItem` shape).
- Per-item `$/unit` suffix variations (`lb` / `bunch` / `pint` / `ear`) — we render "each" only.
- Season-note pill ("Peak season", "↓ 12% this week") — no source.
- Tax / delivery-fee / discount line items in a summary card (no compute path; redundant with footer per Q5).
- Density tweak (Q6: dropped).
- Pull-to-refresh `RefreshControl` (skipped — focus invalidation covers it).
- Custom produce glyphs / SVG illustrations (template uses inline SVG via `MiniGlyph`; we use `Ionicons` + image fallback).
- Admin / employee cart paths — they share the same component but no role-specific behavior is added.
- `ProductCatalog`, `Dashboard`, `Checkout` redesigns — separate features even though template files exist.

## Risks

- `expo-blur` is required for the frosted footer. It's an Expo SDK dep — verify present in `package.json` before relying on it; if absent, fall back to solid `colors.surface` with no `BlurView` (visually less polished but functional).
- Switching from a pinned `CartHeader` + `FlatList` to a single `ScrollView` with all cards inline costs FlatList virtualization. Cart line counts are bounded — restaurant orders rarely exceed ~30 SKUs and each card is light — so a ScrollView is acceptable. If perf becomes a concern with 50+ items, a follow-up PR can swap to `<FlatList ListHeaderComponent>` / `ListFooterComponent`.
- Sticky footer absolute height is hardcoded at `FOOTER_HEIGHT = 128` (matches the two-line layout: label ~14 + total ~28 + Checkout ~50 + vertical paddings ~36). If the design shifts and the footer grows or shrinks meaningfully, swap to `onLayout` measurement.
- `useSwipeToDelete` ships through `react-native-gesture-handler` — already in use; need to keep `<GestureHandlerRootView>` wrapping the `SafeAreaView` (it's there today; preserve it).
- Restaurant owners without an `owned_restaurant_id` (newly signed up) get no restaurant name in the subtitle — matches today's behavior; not a regression.
- New Architecture is on (`newArchEnabled: true`); reanimated 3 + gesture handler 2 are compatible.

## Branch & integration

- Create `feature/cart-tab-redesign` off `preview` (per CLAUDE.md).
- Implement the redesign on that branch.
- After `npm run check-all` passes and manual visual checks complete, **merge directly into `preview` locally** — do not open a GitHub PR. Multiple agents are working in parallel on independent features, all targeting `preview`; the user controls the integration point.
- **On any merge conflict, stop and consult the user before resolving.** Other agents may have edited overlapping files. Show the conflict files and ask before touching them.
- Do not push `preview` to `origin` unless explicitly asked.
- Do not delete the feature branch automatically after merge.
