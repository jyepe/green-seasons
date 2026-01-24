## 2024-05-23 - Admin List Pattern Duplication
**Learning:** The codebase heavily duplicates the "Loading Spinner / Empty State / View All Button" pattern across admin dashboard cards (`OrdersCard`, `TopItemsCard`). The `AnalyticsDataList` component was created to solve this but wasn't fully adopted.
**Action:** When creating new admin list cards, always compose `AnalyticsDataList` instead of manually implementing loading/empty states. Note that `AnalyticsDataList` renders a specific list structure, so for custom layouts, composition (wrapping it or using its logic) is key.

## 2024-05-24 - Order List Screen Pattern
**Learning:** `AdminOrdersScreen` and `OrderHistoryScreen` shared identical header, filter, and list logic. Consolidating them into `OrderListLayout` in `components/OrderListItem.tsx` removed significant duplication.
**Action:** When adding new order-related lists (e.g., "Active Orders"), use `OrderListLayout` instead of copying the screen structure.
