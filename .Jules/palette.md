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

## 2024-05-22 - List Item Accessibility Labels

**Learning:** When a list item is wrapped in a `TouchableOpacity`, providing an `accessibilityLabel` on the container completely overrides the screen reader's access to child text elements (like status, date, or price). This hides critical information from non-visual users.
**Action:** Construct a comprehensive `accessibilityLabel` that includes ALL key information displayed in the item row (e.g., "Order #123, Status: Pending, Date: 5/22"), and use `accessibilityHint` for the action (e.g., "Double tap to view details").
