## 2024-05-23 - [Consolidated Analytics Lists]
**Learning:** Analytics screens (Orders, Revenue) reused the exact same "Date Label + Value" row layout with identical styling (border bottom, font sizes).
**Action:** Extracted `SimpleDataList` which accepts a `mapItem` prop. This reduces boilerplate for any future simple key-value lists in the admin dashboard.
