## 2024-05-23 - [Consolidating Similar Lists]
**Learning:** When two components share 90% layout but differ in specific content fields (User vs Admin), extract a `BaseLayout` component with "slots" (children or specific render props) instead of forcing a Union Type prop on a single Universal component.
**Action:** Use `BaseOrderListItem` pattern for future list consolidations where data shapes differ.

## 2024-05-24 - [Repeated Loading States]
**Learning:** High duplication of "View > ActivityIndicator + Text" pattern for loading states across screens.
**Action:** Centralized into `LoadingView` in `components/ThemedView.tsx` to standardize loading UI.

## 2024-05-24 - [Order List UI Primitives]
**Learning:** Filter tabs and Empty State UI were duplicated across User and Admin order lists.
**Action:** Extracted `OrderFilterTabs` and `OrderListEmptyState` into `components/OrderListItem.tsx` to sit alongside the list item components, creating a cohesive "Order List" domain module.

## 2025-05-24 - [Consolidating Modals]
**Learning:** Found multiple modals (EditQuantity, ItemForm) sharing identical overlay/header structure but duplicating 50+ lines of styles and markup.
**Action:** Extracted `ThemedModal` (shell) and `ModalFooter` (actions) into `components/ThemedView.tsx` to standardize modal UI and reduce boilerplate.

## 2025-05-24 - [Consolidating Auth Headers]
**Learning:** Near-duplicate headers in Auth screens (Login, ForgotPassword, ResetPassword) shared 95% of markup and styles. Extracted to `AuthHeader` in `AuthContainer.tsx` since it's the parent layout context.
**Action:** Look for repeated "Logo + Title" patterns in other feature modules and consolidate into their respective container/layout components.

## 2025-05-24 - [Consolidating Auth Footers]
**Learning:** Auth screens (Login, Signup, ForgotPassword) shared identical "Text + Link" footer pattern but with duplicated styles and markup.
**Action:** Extracted `AuthFooter` to `components/auth/AuthContainer.tsx` to standardize layout and reduce boilerplate in auth screens.
