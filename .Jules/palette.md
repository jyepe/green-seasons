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
