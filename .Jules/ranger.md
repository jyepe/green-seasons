## 2024-05-24 - Near-Duplicate Layouts
**Learning:** Screens for different roles (Admin vs User vs Employee) often share identical layout structures (Header, Filter, List, Empty State) even if they fetch different data or have slightly different filters. Consolidating the Layout (not just the Item) is a huge win.
**Action:** Look for repeated `SafeAreaView` -> `Header` -> `Filter` -> `List` patterns and extract a `ListLayout` component that accepts `renderItem` and `extraHeaderContent`.

## 2024-05-24 - Search Bar Duplication
**Learning:** Search bars with specific visual elements (embedded icon + clear button) are often copy-pasted with slight style variations (e.g., border color, padding). Consolidating into a `ThemedSearchBar` ensures consistent accessibility behavior (aria-roles) and interaction logic (clear button hitSlop) while allowing style overrides via props.
**Action:** When seeing `TextInput` + `Ionicons` (search) + `TouchableOpacity` (clear) pattern, extract to `ThemedSearchBar`.
