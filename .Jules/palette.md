# Palette's Journal

## 2024-05-22 - Initial Journal Creation

**Learning:** No previous learnings available.
**Action:** Start observing and recording critical UX/a11y learnings.

## 2024-05-22 - Password Visibility Toggle Accessibility

**Learning:** Icon-only buttons for password visibility often lack accessibility labels, making them unusable for screen reader users. Dynamic labels ("Show password" vs "Hide password") provide much better context than a static label.
**Action:** Always add dynamic `accessibilityLabel` and `accessibilityRole="button"` to toggle inputs. Also, `hitSlop` is essential for small touch targets like these icons.

## 2024-05-22 - List Item Quantity Controls

**Learning:** Quantity stepper buttons in list items often lack context when using generic "plus" and "minus" icons. Adding the item name to the `accessibilityLabel` (e.g., "Decrease quantity of Organic Bananas") is critical for screen reader users to know *what* they are adjusting without navigating away from the button. Also, small 32px buttons are difficult to tap; `hitSlop` is a high-impact, low-effort fix.
**Action:** Ensure all repeating list controls include the unique item identifier in their accessibility labels and use `hitSlop` for sub-44px targets.

## 2024-05-22 - Container Accessibility vs Child Accessibility

**Learning:** Applying `accessibilityLabel` to a container (like `TouchableOpacity`) hides all accessible elements inside it. This is great for icon buttons (hides the icon artifact) but dangerous if the button contains text that should be read.
**Action:** Only put `accessibilityLabel` on the `TouchableOpacity` if it's an icon-only button or if you want to override the reading of the children completely.

## 2024-05-22 - Toast Accessibility

**Learning:** Toast notifications are often implemented as visual-only `Animated.View` layers. Without `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`, screen readers completely ignore them, leaving users unaware of success or error states.
**Action:** Always add these props to temporary notification components to ensure announcements.

## 2024-05-23 - Comprehensive List Item Labels

**Learning:** When a list item is a single interactive touch target, applying an `accessibilityLabel` to the container hides all child text (status, price, date). This prevents screen reader users from accessing critical order details unless they are explicitly included in the container's label.
**Action:** When making a complex list item accessible as a single button, construct a comprehensive `accessibilityLabel` that concatenates all visual information (e.g., "Order #123, Status: Delivered, Total: $50") so nothing is lost.

## 2024-05-24 - Destructive Action Accessibility

**Learning:** Destructive actions (like "Clear Cart") often use icons or small text buttons that are hard to hit and lack clear screen reader warnings. Adding `hitSlop` prevents user frustration from missed taps, and explicit `accessibilityLabel` (e.g., "Clear cart" instead of just "Clear") ensures the action's scope is understood. Also, using `accessibilityState={{ busy: boolean }}` is critical for async destructive actions.
**Action:** Always enhance destructive buttons with `hitSlop`, clear descriptive labels, and busy states.

## 2024-05-24 - Inline Form Validation

**Learning:** Using `Alert.alert` for form validation is intrusive and disconnects the error from the context (the specific input field). Users have to dismiss the alert and then remember which field was wrong. Inline validation using a local `errors` state and passing it to the input component provides immediate, contextual feedback that is much friendlier.
**Action:** Replace blocking Alerts with inline validation states. Ensure errors are cleared `onChangeText` so the user knows they are fixing the issue immediately.

## 2024-05-25 - Reusable Input Accessibility Defaults

**Learning:** Reusable input components often require developers to manually add `accessibilityLabel` props, leading to inconsistency or omission. Defaulting `accessibilityLabel` to the visual `label` prop within the reusable component ensures basic accessibility out-of-the-box while allowing overrides.
**Action:** In shared input components (like `ThemedInput`), always set `accessibilityLabel={label}` by default before spreading other props.

## 2024-05-25 - Swipeable List Accessibility

**Learning:** Swipe-to-delete patterns are notoriously inaccessible for users who cannot perform complex gestures. Adding `accessibilityActions` to the list item container provides a native, menu-driven way for screen reader users to access hidden actions (like Delete) without swiping.
**Action:** Always implement `accessibilityActions` and `onAccessibilityAction` when using swipeable rows to ensure functional parity for assistive technology users.
\n## 2025-03-31 - Icon-Only Interactive Elements missing a11y attributes in Lists\n\n**Learning:** Icon-only interactive elements (like expand/collapse Chevrons or Print/Download actions) implemented within mapped iterations (e.g., list views) are frequently missing fundamental accessibility attributes (role="button", accessibilityLabel, accessibilityState) and adequate touch targets (hitSlop), rendering them invisible or confusing to screen reader users.\n**Action:** When inspecting mapped iterations or list cards, always verify that embedded icon-only controls have fully descriptive `accessibilityLabel`s (often needing to dynamically incorporate the item's name), proper `accessibilityRole="button"`, state indicators (like `expanded`), and `hitSlop` for touch target size.\n
