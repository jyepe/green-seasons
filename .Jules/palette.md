# Palette's Journal

## 2024-05-22 - Initial Journal Creation
**Learning:** No previous learnings available.
**Action:** Start observing and recording critical UX/a11y learnings.

## 2024-05-22 - Password Visibility Toggle Accessibility
**Learning:** Icon-only buttons for password visibility often lack accessibility labels, making them unusable for screen reader users. Dynamic labels ("Show password" vs "Hide password") provide much better context than a static label.
**Action:** Always add dynamic `accessibilityLabel` and `accessibilityRole="button"` to toggle inputs. Also, `hitSlop` is essential for small touch targets like these icons.
