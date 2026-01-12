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
