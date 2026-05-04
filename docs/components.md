# Components Reference

All components live in `components/`. Barrel exports exist for `admin/` (`admin/index.ts`) and `employee/` (`employee/index.ts`). Import everything else by direct path.

---

## `ui/` — Primitives

Use these before reaching for React Native primitives directly.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `ThemedText` | Theme-aware `Text` with preset type styles | `type?: 'default' \| 'title' \| 'defaultSemiBold' \| 'subtitle' \| 'link'`; `lightColor?`, `darkColor?` |
| `ThemedView` | Theme-aware `View` background | `lightColor?`, `darkColor?` |
| `ThemedInput` | Labeled text input with error display | `label?`, `error?`, `containerStyle?` + all `TextInputProps` |
| `ThemedSearchBar` | Search input with icon + clear button | `value` (req), `onChangeText` (req), `placeholder?` |
| `ThemedDropdown` | Dropdown selector | `label`, `value`, `isOpen`, `onToggle`, `items`, `onSelect`, `emptyMessage?` |
| `ThemedModal` | Modal with header, close button, theme colors | `title` (req), `onClose` (req), `maxWidth?` |
| `ModalFooter` | Cancel/Save button pair for modals | `onCancel`, `onSave`, `cancelLabel?`, `saveLabel?`, `isLoading?`, `isSaveDisabled?` |
| `LoadingView` | Spinner + optional message | `message?`, `size?: 'small' \| 'large'` |
| `Toast` | Animated toast notification | `message` (req), `visible` (req), `onHide` (req), `type?: 'success' \| 'error'`, `duration?` |
| `GradientText` | Text with linear gradient via MaskedView | `colors` (req, readonly array), + all `TextProps` |
| `IconSymbol` | Cross-platform icon (SF Symbols iOS, Material Android/web) | `name` (req), `size?`, `color` (req), `weight?` |
| `TabBarBackground` | Tab bar background (blur on iOS, stub elsewhere) | — |

---

## Root-level — Shared / Cross-feature

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `BaseOrderListItem` | Shared order row used by buyer and admin list items | `orderId`, `status`, `dateLabel`, `deliveryLabel`, `onPress`, `totalAmount?`, `finalTotalAmount?`, `headerContent?`, `footerContent?` |
| `OrderListItem` | Buyer order list item (wraps `BaseOrderListItem`) | `order: Order` |
| `AdminOrderListItem` | Admin order list item with restaurant/buyer info | `order: AdminOrder` |
| `OrderListLayout` | Generic order list screen layout with filter tabs | `title`, `activeFilter`, `onFilterChange`, `isLoading`, `data`, `renderItem`, `keyExtractor`, `onEndReached?`, `isFetchingNextPage?` |
| `OrderFilterTabs` | Horizontal scrollable status filter tabs | `activeFilter: FilterStatus`, `onFilterChange` |
| `OrderFilterChip` | Single filter chip | `label`, `isActive`, `onPress`, `colors?` |
| `OrderListEmptyState` | Empty state with optional clear-filter button | `activeFilter`, `onClearFilter`, `message?`, `emptyMessageAll?`, `showClearButton?` |
| `UserProfile` | Full profile screen (info, theme toggle, settings) | — (uses hooks) |
| `EditProfileForm` | Profile edit form (email, name, phone) | — (uses hooks) |
| `RestaurantCheck` | Redirect guard for restaurant onboarding | — |
| `ThemeToggle` | Light / dark / system radio buttons | `colors` (req) |
| `Collapsible` | Animated collapsible section with chevron | `title` (req), `children` (req) |
| `ExternalLink` | Link that opens in-app browser on native | `href` (req) + Link props |
| `HapticTab` | Bottom tab button with haptic feedback | `BottomTabBarButtonProps` |
| `ParallaxScrollView` | ScrollView with parallax header | `headerImage` (req), `headerBackgroundColor: {dark, light}` (req), `children` (req) |
| `HelloWave` | Animated waving hand (👋) | — |

---

## `admin/`

Exported via `admin/index.ts`.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `AnalyticsScreenLayout` | Reusable analytics screen wrapper with header + refresh scroll | `title`, `subtitle`, `isRefreshing`, `onRefresh`, `children`, `contentPadding?` |
| `AnalyticsDataList<T>` | Generic list with loading/empty states + "View All" | `data`, `renderItem`, `isLoading?`, `emptyMessage?`, `onViewAll?`, `viewAllText?` |
| `SimpleDataList` | Label/value pair list (orders, revenue rows) | `data: SimpleListItem[]`, `isLoading?`, `onViewAll?` |
| `ExpandableCard` | Collapsible card with animated chevron | `title` (req), `children` (req), `defaultExpanded?` |
| `ItemFormModal` | Create / edit item modal with validation | `visible`, `item: Item \| null`, `isLoading`, `onClose`, `onSave` |
| `KPICard` | Orders count + revenue display with icon boxes | `ordersCount`, `totalRevenue`, `isLoading?` |
| `OrdersCard` | Orders list with status badges, dates, amounts | `orders: AdminOrder[]`, `isLoading?`, `onViewAll?` |
| `TopItemsCard` | Table of top-selling items (qty + revenue) | `items: AdminTopItem[]`, `isLoading?`, `onViewAll?` |
| `OrdersByDayList` | Daily order count list | `data: AdminChartOrdersByDay[]`, `isLoading?`, `onViewAll?` |
| `RevenueByDayList` | Daily revenue list with currency formatting | `data: AdminChartRevenueByDay[]`, `isLoading?`, `onViewAll?` |
| `RevenueByRestaurantList` | Ranked restaurant revenue list | `data: AdminChartRevenueByRestaurant[]`, `isLoading?`, `onViewAll?` |

---

## `auth/`

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `AuthBackground` | SVG gradient background (green + orange radials) | `style?` |
| `AuthContainer` | Full-screen auth wrapper (SafeAreaView + KeyboardAvoidingView) | `children`, `contentContainerStyle?` |
| `AuthCard` | White shadowed card for form content | `children`, `style?` |
| `AuthHeader` | Logo + split-color title + subtitle | `firstWord`, `secondWord`, `subtitle` |
| `AuthFooter` | Text + clickable link row | `linkText` (req), `onLinkPress` (req), `text?` |
| `AuthInput` | Labeled input with icon, password toggle, error | `label` (req), `icon?`, `error?`, `helperText?` + `TextInputProps` |
| `AuthButton` | Animated button with variants | `title` (req), `onPress` (req), `variant?: 'primary' \| 'secondary' \| 'outline' \| 'destructive'`, `isLoading?`, `disabled?` |
| `PasswordRequirements` | Info box listing password rules | `style?` |

---

## `cart/`

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `CartScreenComponent` | Full cart screen (orchestrates header/list/footer/modal) | — (uses hooks) |
| `CartHeader` | Restaurant name, item count, clear button | `restaurantName?`, `itemCount` (req), `onClearCart` (req), `isClearing` (req) |
| `CartList` | FlatList of swipeable cart rows | `cartItems`, `isLoading`, `error`, `updatingItemId`, `itemImageMap`, `onQuantityChange`, `onDeleteItem`, `onItemPress` |
| `SwipeableRow` | Single cart item row with swipe-to-delete gesture | `item`, `index`, `updatingItemId`, `itemImageMap`, `onQuantityChange`, `onDeleteItem`, `onItemPress` |
| `CartFooter` | Sticky total + checkout button | `total` (req), `animatedTotalStyle` (req), `onCheckout` (req) |
| `EditQuantityModal` | Modal to type an exact quantity | `editingItem`, `editQuantity`, `updatingItemId`, `onClose`, `onSave`, `setEditQuantity` |

---

## `employee/`

Exported via `employee/index.ts`.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `EmployeeOrdersCard` | Order list container with optional "View All" | `orders: EmployeeOrder[]`, `isLoading?`, `onViewAll?` |
| `EmployeeOrderListItem` | Tappable order row that navigates to order detail | `order: EmployeeOrder` |
| `EmployeeOrderRow` | Reusable order row with dates, status badge, total | `order` (req), `showDivider?`, `onPress?`, `containerStyle?`, `showChevron?` |
| `TruckLoadScreen` | Full truck load screen with expandable items + PDF | — (uses hooks) |

---

## `products/`

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `ProductsScreenComponent` | Full explore/products screen | — (uses hooks) |
| `ProductsGrid` | FlatList (numColumns=2) of product cards with empty/error states | `products`, `isLoading`, `error`, `cartBarVisible`, `searchActive`, `onClearSearch`, `getCartQuantity`, `getStepperQuantity`, `isStepperMode`, `pendingItemId`, `onToggleFavorite`, `onAddToCart`, `onUpdateQuantity` |
| `ProductCard` | Single product card (tile, favorite heart, price, ghost +Add or Stepper, bump animation) | `item`, `quantityInCart`, `stepperQuantity`, `isStepperMode`, `isPending`, `onToggleFavorite`, `onAddToCart`, `onUpdateQuantity` |
| `ProductTile` | Image-or-seeded-gradient tile rendered inside `ProductCard` | `imageUrl`, `fallbackSeed`, `height?` |
| `ProductsScreenHeader` | Date eyebrow + "Today's market" + cutoff subtitle + folded disclaimer | — |
| `ProductsSearchBar` | Search input with focus ring + inline sort button anchoring `ProductsSortMenu` | `searchQuery`, `setSearchQuery`, `sortBy`, `onSortChange` |
| `ProductsSortMenu` | Sort dropdown popover (Name A–Z / Price low→high / Price high→low) | `visible`, `sortBy`, `onSelect`, `onDismiss` |
| `PaginationControls` | Numbered page buttons with chevrons + ellipsis | `currentPage` (req), `totalPages` (req), `onPageChange` (req) |
