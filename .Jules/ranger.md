## 2024-05-23 - [Consolidating Similar Lists]
**Learning:** When two components share 90% layout but differ in specific content fields (User vs Admin), extract a `BaseLayout` component with "slots" (children or specific render props) instead of forcing a Union Type prop on a single Universal component.
**Action:** Use `BaseOrderListItem` pattern for future list consolidations where data shapes differ.
