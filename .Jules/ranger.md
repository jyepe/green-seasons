## 2024-05-23 - Admin List Pattern Duplication
**Learning:** The codebase heavily duplicates the "Loading Spinner / Empty State / View All Button" pattern across admin dashboard cards (`OrdersCard`, `TopItemsCard`). The `AnalyticsDataList` component was created to solve this but wasn't fully adopted.
**Action:** When creating new admin list cards, always compose `AnalyticsDataList` instead of manually implementing loading/empty states. Note that `AnalyticsDataList` renders a specific list structure, so for custom layouts, composition (wrapping it or using its logic) is key.
