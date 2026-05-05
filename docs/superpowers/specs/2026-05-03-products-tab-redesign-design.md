# Products Tab Redesign — Restaurant Owner

**Date:** 2026-05-03
**Branch:** `feature/products-tab-redesign` (off `preview`)
**Scope:** Redesign of `app/(tabs)/explore.tsx` and everything under `components/products/` for the restaurant owner role only. No backend changes, no admin/employee impact, no `Item` schema changes.

## Goal

Redesign the products tab to match the Anthropic-design template (`Product Catalog.html` + `products.jsx`) while binding to existing app data. Visual fidelity to the template is the success criterion; missing backend fields are dropped (not stubbed) per scope decision below.

## Source of truth

The handoff bundle is unpacked at `.design-ref/` (gitignored). Files of interest:

- `.design-ref/project/Product Catalog.html` — top-level tweak defaults and shell layout
- `.design-ref/project/products.jsx` — full screen implementation (header, search+sort, category rail, product card, stepper, cart bar, pagination)
- `.design-ref/project/colors_and_type.css` — token names (already mirrored in `constants/Colors.ts`)
- `.design-ref/chats/chat1.md` — original design conversation

The template's `EDITMODE-BEGIN` defaults represent the user's final landing state. Everything in this spec mirrors those defaults except where called out under Scope decisions.

## Scope decisions

| Decision                | Choice                                                                               | Rationale                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing backend fields  | **Drop** them                                                                        | Template depends on `category`, `vendor`, `peak/in_season`, `stock`, `last_ordered` — none exist on `Item`. Faking them produces dishonest UI; extending the schema is its own spec.               |
| Sticky cart preview bar | **Include**                                                                          | Signature design moment. Stepper-on-card pattern feels incomplete without a "go to cart" affordance once items are added. Lifted into `components/ui/` so other tabs can adopt it later.           |
| Image strategy          | **Real `image_url` with colorful gradient fallback**                                 | Use real photos when present; when null, render a 155° linear gradient seeded by item name + `nutrition-outline` glyph at 40% opacity. Missing-image cards stay on-brand instead of "broken."      |
| Sort dropdown           | **Include with 3 real options** — Name A–Z (default), Price low→high, Price high→low | Genuinely useful for price-conscious chefs. Drops the template's `recommended` and `recently-ordered` sorts because they need data we don't have.                                                  |
| Header copy             | **Adopt template chrome, keep the price-volatility disclaimer**                      | Date eyebrow + "Today's market" + cutoff subtitle. The existing price-volatility disclaimer is folded into the header as a slim inline note (info icon + small text) — it's real business context. |
| Cutoff time             | **Hardcoded "Order by 6 PM for next-day delivery."**                                 | No backend cutoff field exists. Flagged as future-driven copy.                                                                                                                                     |
| Pagination styling      | **Numbered bar with chevrons + ellipsis only** (no dot row)                          | Numbered bar is the real upgrade (lets the user jump pages). Dots row is decorative on mobile and would stack awkwardly above the cart bar.                                                        |
| Refactor approach       | **In-place restyle + extract `Stepper` and `CartBar` to `components/ui/`**           | Existing `components/products/` is well-factored. Two primitives (`Stepper`, `CartBar`) lift cleanly because the design intends them as global signals; everything else stays local to products.   |
| Styling                 | **React Native `StyleSheet` only**                                                   | Matches every other screen and the prior profile redesign. Tailwind/NativeWind would require config changes for one screen.                                                                        |
| Toast vs cart bar       | **Keep the existing "Item added to cart!" toast**                                    | Toast = per-action confirmation. Cart bar = persistent state. They don't compete (toast appears at top, bar at bottom).                                                                            |

## Out of scope

Deferred to future specs:

- Category chips and counts (no `category` field on `Item`)
- Vendor display (no `vendor` field)
- "In season" / low-stock / out-of-stock badges (no `stock` or `peak` fields)
- "Reorder favorites" rail and "ordered N days ago" hint (would require an order-history join per user)
- "Notify me" out-of-stock CTA (moot without stock data)
- Pagination dots row
- Density / column-count / card-style tweak panel from the template

## File layout

```
components/ui/
  Stepper.tsx           NEW — reusable +/qty/− pill
  CartBar.tsx           NEW — sticky floating cart preview; positions itself above the tab bar

components/products/
  ProductsScreenComponent.tsx   REWRITE — orchestrator; adds sortBy + mounts CartBar
  ProductsScreenState.ts        EXTEND — adds sortBy + SET_SORT_BY action
  ProductsScreenHeader.tsx      REWRITE — date eyebrow + "Today's market" + cutoff subtitle + price-volatility note
  ProductsDisclaimer.tsx        DELETE — folded into the new header
  ProductsSearchBar.tsx         REWRITE — focus ring; renders adjacent SortMenu trigger
  ProductsSortMenu.tsx          NEW — dropdown menu (Name A–Z / Price low→high / Price high→low)
  ProductsGrid.tsx              REWRITE — FlatList; new spacing, loading, empty states
  ProductCard.tsx               REWRITE — gradient-fallback tile, favorite heart over image, stepper-replaces-add
  ProductTile.tsx               NEW — image-or-gradient image area used by ProductCard
  PaginationControls.tsx        REWRITE — numbered bar with chevrons + ellipsis
  index.ts                      NEW — barrel export
```

`app/(tabs)/explore.tsx` stays a one-line wrapper.

Keep `.design-ref/` gitignored.

## Component contracts

### `Stepper` (`components/ui/Stepper.tsx`)

```ts
type Props = {
  qty: number;
  onInc: () => void;
  onDec: () => void;
  disabled?: boolean;
  busy?: boolean; // shows ActivityIndicator in place of qty
};
```

36px tall pill, `colors.primary` background, white minus / qty / plus laid out 36-flex-36. Soft drop shadow tinted with primary. Renders `ActivityIndicator` on white when `busy`. Pressed state on each button only (not the whole pill). Accessibility: each button is its own `accessibilityRole="button"` with localized labels.

### `CartBar` (`components/ui/CartBar.tsx`)

```ts
type Props = {
  itemCount: number;
  totalCents: number; // formatted internally as $X.XX
  onPress: () => void;
  bottomOffset?: number; // default = useBottomTabBarHeight() + 12
};
```

Returns `null` when `itemCount === 0`. Absolute-positioned, `left/right: 12`, anchored above the tab bar via `useBottomTabBarHeight()` + `useSafeAreaInsets()` (no hardcoded offsets). Green primary background, mango accent count badge on a cart icon, total in white, "View cart →" affordance on the right. Slide-up + fade-in on mount via `Animated`. Tap anywhere → `onPress`.

### `ProductTile` (`components/products/ProductTile.tsx`)

```ts
type Props = {
  imageUrl: string | null;
  fallbackSeed: string; // item name, used to derive a stable hue
  height?: number; // default 132
};
```

If `imageUrl` is set, renders `<Image>` with `resizeMode="cover"`. Otherwise renders a 155° linear gradient (two stops of the seeded hue at different alphas) with an `Ionicons` `nutrition-outline` glyph centered at 40% opacity. Hue is derived from `hashName(seed) % 360` and clamped to a warm produce-friendly band (greens, oranges, reds, purples — drops grays and electric blues). Hash helper lives inline in the file (not a shared util) until something else needs it.

### `ProductCard` (`components/products/ProductCard.tsx`) — rewritten

```ts
type Props = {
  item: ProductItem;
  quantityInCart: number;
  stepperQuantity: number;
  isStepperMode: boolean;
  isPending: boolean;
  onToggleFavorite: (itemId: string, currentlyFavorite: boolean) => void;
  onAddToCart: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
};
```

Same prop surface as today (no breaking change for the parent). Internals change: 14px radius card, soft shadow, `ProductTile` on top with the favorite heart absolutely positioned top-right (white pill background, red heart when favorited), name (semibold 14), price+unit baseline-aligned (bold 18 / medium 11), then either `<Stepper>` (when in cart) or a ghost "+ Add" button (1.5px primary border, transparent fill, fills primary on press). Subtle `translateY(-2px)` bump on quantity-increment via `useEffect` watching `quantityInCart` (matches template animation, ~220ms).

### `ProductsScreenHeader` (`components/products/ProductsScreenHeader.tsx`) — rewritten

```ts
// no props
```

- Eyebrow row: today's date formatted `EEEE · MMM d` (e.g. "Wednesday · May 6"), uppercase, `letterSpacing: 0.4`, `colors.primary`.
- Title: "Today's market", bold 28, `letterSpacing: -0.015em`.
- Subtitle: "Order by 6 PM for next-day delivery." (hardcoded).
- Disclaimer note (replaces deleted `ProductsDisclaimer`): inline below subtitle, info icon + "Prices reflect the last finalized day and may change." in `colors.textSecondary`, fontSize 12.

### `ProductsSearchBar` + `ProductsSortMenu`

```ts
// SearchBar
type SearchProps = {
  value: string;
  onChange: (v: string) => void;
  sortBy: SortKey;
  onSortChange: (s: SortKey) => void;
};

// SortMenu (internal popover)
export type SortKey = 'name' | 'price-asc' | 'price-desc';
```

Single row: 46px tall input with `colors.surface` background, 1.5px border that becomes `colors.primary` on focus with a 4px alpha-10 halo (matches template). Right of the input, a 46×46 sort button (swap-vertical icon) that toggles a popover positioned absolutely below it. Popover items show a checkmark on the active sort. Tapping outside the popover (or the same trigger again) closes it.

### `ProductsGrid` — rewritten

Same surface as today. Uses `FlatList` (numColumns=2) instead of `ScrollView` + `.map` for better recycling on the now-richer cards. 12px gap, 20px horizontal padding. Shows `LoadingView` / error / `EmptyState` (clearer empty state — icon, headline, body, "Clear search" CTA that dispatches `SET_SEARCH_QUERY` with empty string).

When the cart bar is visible (`cartItemCount > 0`), the FlatList's `contentContainerStyle.paddingBottom` jumps to `88` (cart bar height + breathing room) so the last row isn't covered. Otherwise `paddingBottom: 24`.

### `PaginationControls` — rewritten

36×36 chevron prev, then numbered buttons, then chevron next. Visible page numbers: always-show first, last, current ±1; ellipses fill the gap (e.g. `‹ 1 2 … 5 ›`). Active page is filled `colors.primary` with white text and a primary-tinted shadow. Disabled state at 40% opacity.

## Reducer changes

Two additions to `ProductsScreenState.ts`, no breaking changes:

```ts
export type SortKey = 'name' | 'price-asc' | 'price-desc';

export interface ProductsScreenState {
  searchQuery: string;
  sortBy: SortKey; // NEW — default 'name'
  currentPage: number;
  pendingItemId: string | null;
  showToast: boolean;
  stepperItems: Record<string, number>;
}

export type ProductsScreenAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SORT_BY'; payload: SortKey }; // NEW — also resets page to 1
// ...existing actions unchanged
```

`SET_SORT_BY` resets `currentPage` to 1, mirroring the existing `SET_SEARCH_QUERY` pattern.

## Filter + sort pipeline

Replaces the existing `useMemo` block in `ProductsScreenComponent`:

```ts
const { filteredProducts, paginatedProducts, totalPages, safePage } =
  useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let arr = (items ?? []).filter(i => !q || i.name.toLowerCase().includes(q));

    if (sortBy === 'price-asc')
      arr = [...arr].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc')
      arr = [...arr].sort((a, b) => b.price - a.price);
    // 'name' is server-default, no client sort needed

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

## Cart bar wiring

Mounted by `ProductsScreenComponent`, absolute-positioned over the tab content:

```ts
const cartItemCount = (cartItems ?? []).reduce((n, c) => n + c.quantity, 0);
const cartTotalCents = (cartItems ?? []).reduce((sum, c) => {
  const item = items?.find(i => i.id === c.item_id);
  return sum + (item ? Math.round(item.price * 100) * c.quantity : 0);
}, 0);

<CartBar
  itemCount={cartItemCount}
  totalCents={cartTotalCents}
  onPress={() => router.push('/(tabs)/cart')}
/>
```

The bar uses cents to avoid float drift; formats as `$X.XX` internally. `useCart` is the same query that drives the in-card stepper, so the bar stays in sync for free.

## Result-count row

Above the grid (mirrors template):

```
14 items · sorted by Name A–Z              Page 1 of 2
```

Live count updates as the search filters. Page indicator only shown when `totalPages > 1`.

## Hooks

No changes. Continue using `useItems`, `useCart`, `useAddToCart`, `useToggleFavorite`, `useCartRefetchOnFocus`, `useItemsRefetchOnFocus` exactly as today.

## Implementation order

Each step ends with `npm run check-all` passing and is its own commit on the branch.

1. **Branch + scaffold.** Create `feature/products-tab-redesign`. Add `components/ui/Stepper.tsx` and `components/ui/CartBar.tsx` (no consumers yet — exported, ready to wire).
2. **Reducer extension.** Extend `ProductsScreenState.ts` with `sortBy` + `SET_SORT_BY`. No UI hookup yet; verify types.
3. **Header + disclaimer fold-in.** Rewrite `ProductsScreenHeader.tsx`; delete `ProductsDisclaimer.tsx` and remove its import from `ProductsScreenComponent.tsx`.
4. **Search + sort row.** Rewrite `ProductsSearchBar.tsx`; add `ProductsSortMenu.tsx`; wire `sortBy` from reducer through to the menu.
5. **`ProductTile` + `ProductCard` rewrite.** Add `ProductTile.tsx`; rewrite `ProductCard.tsx` to consume it and use the new `Stepper`. Card prop surface stays identical, so `ProductsGrid` keeps working.
6. **Grid polish + result-count row.** Convert `ProductsGrid.tsx` to `FlatList`, add the result-count + page-indicator row, polish empty/error states.
7. **Pagination rewrite.** Replace `PaginationControls.tsx` with the numbered + chevron variant.
8. **CartBar wiring.** Mount `<CartBar>` in `ProductsScreenComponent`, compute count/total from `useCart`, navigate to `ROUTES.CART` on press, add conditional `paddingBottom` to the grid.
9. **Final pass.** `npm run check-all`, manual smoke (light + dark), commit, merge locally into `preview`. On any merge conflict, stop and consult the user (parallel agents may have touched the same files).

## Verification

`npm run check-all` (typecheck + lint + prettier) is the only automated gate the repo has. It must pass after every step.

Manual smoke checklist (after step 9, on iOS sim or device):

- Tab loads, header eyebrow shows today's date, disclaimer note visible.
- Search filters live; sort menu opens, switching reorders, page resets to 1.
- Add an item — Stepper appears in the card, cart bar slides up with `1 item · $X.XX`.
- Increment via stepper, total updates immediately (optimistic), remains correct after server roundtrip.
- Decrement past 0 reverts to "+ Add" button; cart bar disappears when cart empties.
- Tap cart bar → navigates to cart tab.
- Favorite heart toggles and persists.
- Pagination chevrons + numbered jumps work; ellipsis appears when totalPages > 5.
- Toggle dark mode in profile → all colors flip on next products tab visit.
- Empty search ("xyz") shows the new empty state with "Clear search" button.

## Risks

- **Cart bar overlap with the tab bar.** The exact `bottomOffset` depends on Expo Router's tab bar height + safe-area insets. Sourced from `useBottomTabBarHeight()` (from `@react-navigation/bottom-tabs`, transitively available via Expo Router) + `useSafeAreaInsets()` rather than hardcoded.
- **No `ROUTES.CART` constant exists today.** `constants/Routes.ts` only declares dashboard/auth/onboarding routes. Cart bar navigates to the literal `/(tabs)/cart` path; if a `ROUTES.CART` constant is preferred for consistency, add it as part of step 8.
- **`FlatList` inside `SafeAreaView`.** Currently `ScrollView`; switching to `FlatList` is a real change. Pull-to-refresh isn't currently wired, so this is a no-op there — verify nothing else regresses.
- **Hash-to-hue function.** Tiny helper but it ships into the runtime forever. Kept inline in `ProductTile.tsx` until a second consumer appears.
- **Cutoff time copy.** Hardcoded; flagged as future-driven copy.
