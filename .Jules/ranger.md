## 2024-05-24 - Near-Duplicate Layouts
**Learning:** Screens for different roles (Admin vs User vs Employee) often share identical layout structures (Header, Filter, List, Empty State) even if they fetch different data or have slightly different filters. Consolidating the Layout (not just the Item) is a huge win.
**Action:** Look for repeated `SafeAreaView` -> `Header` -> `Filter` -> `List` patterns and extract a `ListLayout` component that accepts `renderItem` and `extraHeaderContent`.
