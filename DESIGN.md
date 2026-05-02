# DESIGN.md — Green Seasons

Design system reference for the Green Seasons mobile app (React Native / Expo).
Read this alongside `CLAUDE.md` and `AGENTS.md` before touching UI.

---

## Brand

- **Name:** Green Seasons
- **Tagline:** Fresh produce delivered to you
- **Identity:** Trust, freshness, and approachability. Green anchors the brand; mango is the energetic accent.

---

## Color Tokens

Defined in `constants/Colors.ts`. Accessed via `useAppColorScheme()` → `Colors[scheme]`.

### Light

| Token             | Value     | Usage                              |
| ----------------- | --------- | ---------------------------------- |
| `primary`         | `#2E7D32` | Buttons, active states, highlights |
| `primaryDark`     | `#256628` | Pressed button states              |
| `primaryDarker`   | `#1F5522` | Deep pressed / dark accents        |
| `accent`          | `#FFB300` | Mango — secondary CTA, badges      |
| `background`      | `#FAFBF7` | Screen background                  |
| `surface`         | `#FFFFFF` | Cards, modals, inputs              |
| `inputBackground` | `#F3F4F6` | Input field fill                   |
| `text`            | `#111827` | Primary text                       |
| `textSecondary`   | `#6B7280` | Supporting / metadata text         |
| `textTertiary`    | `#9CA3AF` | Placeholders, disabled             |
| `border`          | `#E5E7EB` | Dividers, input borders            |
| `success`         | `#16A34A` | Delivered, confirmed               |
| `warning`         | `#F59E0B` | Pending, caution                   |
| `error`           | `#DC2626` | Errors, destructive                |
| `info`            | `#0EA5E9` | Informational                      |

### Dark

| Token             | Value     | Notes vs light                   |
| ----------------- | --------- | -------------------------------- |
| `primary`         | `#4CAF50` | Lightened for dark bg contrast   |
| `primaryDark`     | `#2E7D32` |                                  |
| `primaryDarker`   | `#256628` |                                  |
| `accent`          | `#FFB300` | Unchanged                        |
| `background`      | `#0B0F12` | Near-black                       |
| `surface`         | `#1A1F24` | Card surfaces                    |
| `inputBackground` | `#2D3238` |                                  |
| `text`            | `#F9FAFB` |                                  |
| `textSecondary`   | `#D1D5DB` |                                  |
| `textTertiary`    | `#9CA3AF` | Unchanged                        |
| `border`          | `#374151` |                                  |
| `success`         | `#22C55E` |                                  |
| `warning`         | `#F59E0B` | Unchanged                        |
| `error`           | `#EF4444` |                                  |
| `info`            | `#3B82F6` |                                  |

### Order Status Colors

| Status       | Color     |
| ------------ | --------- |
| `pending`    | `#F59E0B` |
| `in_transit` | `#3B82F6` |
| `delivered`  | `#16A34A` |

---

## Typography

Fonts loaded in `app/_layout.tsx` via `expo-font`.

| Family             | Weight  | Use                          |
| ------------------ | ------- | ---------------------------- |
| `Inter_400Regular` | 400     | Body, default                |
| `Inter_600SemiBold`| 600     | Labels, supporting headings  |
| `Inter_700Bold`    | 700     | Headings, emphasis           |

### Type Scale

| Role             | Size | Weight   | Line Height |
| ---------------- | ---- | -------- | ----------- |
| Title            | 32px | bold     | 32          |
| Large heading    | 28px | bold     | —           |
| Subtitle         | 20px | bold     | —           |
| Section heading  | 20–24px | semibold | —         |
| Default          | 16px | regular  | 24          |
| DefaultSemiBold  | 16px | semibold | 24          |
| Label            | 14px | semibold | —           |
| Small / meta     | 12–14px | regular | —          |
| Button           | 16px | semibold | —           |

---

## Theming

- **Hook:** `useTheme()` → `{ themeMode, effectiveTheme, setThemeMode, isDark }`
- **Scheme hook:** `useAppColorScheme()` → `'light' | 'dark'`
- **Modes:** `'light'`, `'dark'`, `'system'` (follows OS)
- **Persistence:** AsyncStorage key `@green_seasons_theme`
- Returns `null` during initial load to prevent flash.

**Pattern for any themed component:**

```tsx
const colorScheme = useAppColorScheme();
const colors = Colors[colorScheme];
```

---

## Spacing & Layout

| Purpose                  | Value       |
| ------------------------ | ----------- |
| Screen horizontal pad    | 20px        |
| Screen vertical pad      | 16–24px     |
| Compact gap              | 8px         |
| Standard gap             | 12px        |
| Loose / section gap      | 16px        |
| Section margin bottom    | 12–16px     |

### Border Radius

| Context             | Radius |
| ------------------- | ------ |
| Inputs, small items | 8px    |
| Cards               | 12px   |
| Modals, large areas | 16px   |

### Shadows

```ts
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.1          // 0.2 for elevated buttons
shadowRadius: 4             // 8 for elevated buttons
elevation: 2                // 4 for elevated buttons
```

---

## UI Primitives (`components/ui/`)

### `IconSymbol`

Cross-platform icon wrapper. SF Symbols on iOS, Material Icons on Android/web.

```tsx
<IconSymbol name="leaf.fill" size={24} color={colors.primary} />
```

Mapped symbols: `house.fill`, `paperplane.fill`, `leaf.fill`, `cart.fill`, `truck.fill`,
`dollarsign.circle.fill`, `person.fill`, `sun.max.fill`, `moon.fill`, `gear`

### `Toast`

Notification banner. Enters with spring, auto-dismisses.

```tsx
<Toast message="Saved!" type="success" visible={show} onHide={() => setShow(false)} />
```

- Position: absolute top 60, horizontal 16px
- Default duration: 2000ms
- Types: `'success'` (green + checkmark), `'error'` (red + alert)

### `GradientText`

Text with horizontal linear gradient overlay.

```tsx
<GradientText colors={['#2E7D32', '#4CAF50']} style={styles.heading}>
  Green Seasons
</GradientText>
```

### `TabBarBackground`

Platform-specific tab bar blur (iOS only). Returns `undefined` on Android/web.

---

## Shared Components (`components/`)

### `ThemedText`

Type-driven text with automatic theme colors. Accepts `lightColor` / `darkColor` overrides.

Types: `'default'`, `'title'`, `'defaultSemiBold'`, `'subtitle'`, `'link'`

### `ThemedView` family

| Component        | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `ThemedView`     | Base container with theme background                        |
| `LoadingView`    | Centered spinner + optional message                         |
| `ThemedModal`    | Overlay modal — header with close button, scrollable body   |
| `ModalFooter`    | Cancel + Save button pair with loading state                |
| `ThemedDropdown` | Label → selector → scrollable list (max 260px)             |
| `ThemedInput`    | Label + TextInput + error display                           |
| `ThemedSearchBar`| Search icon + input + clear button                         |

**ThemedInput specs:** min height 48px, border 1px, radius 8px, error = red border + message below.

**ThemedModal specs:** max 90% height, rounded 16px, 50% black overlay.

**ThemedDropdown specs:** chevron indicator rotates open/closed, max 260px dropdown height.

### `HapticTab`

Tab bar button with `expo-haptics` light impact on iOS.

### `ThemeToggle`

Three-state button group (Light / Dark / System). Selected state uses `primary` color.

### `OrderListItem`

Order card: date, restaurant name, total, status badge.

### `Collapsible`

Expandable section wrapper with chevron.

---

## Buttons

| Property       | Value                                |
| -------------- | ------------------------------------ |
| Height         | 52px                                 |
| Border radius  | 12px                                 |
| Font           | 16px semibold                        |
| Press feedback | Spring scale 0.95 → 1.0              |
| Loading state  | Spinner replaces label               |
| Shadow         | elevation 4, opacity 0.2             |

| Variant       | Style                                 |
| ------------- | ------------------------------------- |
| `primary`     | `primary` fill, white text            |
| `secondary`   | `accent` (mango) fill, white text     |
| `outline`     | Transparent fill, `border` border     |
| `destructive` | `error` fill, white text              |

---

## Inputs

- Min height: 48px
- Border radius: 8px
- Border: 1px `border` color
- Error state: red border + error message below
- Placeholder color: `textSecondary` at 50% opacity

---

## Screen Layout Patterns

### Dashboard / Home (all roles)

```
SafeAreaView (background fill)
  ScrollView (paddingBottom for tab bar)
    Header (title 28px bold + subtitle textSecondary)
    Summary cards row — 3-column flex, gap 12
    Section heading (20–24px semibold)
    List or grid of items
    Empty state (centered icon + title + subtitle)
```

### Product Grid (explore tab)

- 2-column grid, each card 48% width
- Card: 12px radius, elevation 2
- Image area: 120px height
- Info section: 12px padding
- Add-to-cart button or quantity stepper inline

### Admin Dashboard

- Month selector: row with prev/next chevron buttons
- `ExpandableCard` sections for grouped data
- KPI grid cards
- Embedded charts in sections
- Pull-to-refresh with `primary` tint

---

## Animation Patterns

### Navigation transitions (app/_layout.tsx)

| Screens                         | Animation          | Duration |
| --------------------------------| ------------------ | -------- |
| Auth / Admin / Employee / Tabs  | `fade`             | default  |
| Default screens, order detail   | `slide_from_right` | 250ms    |

### Toast

- Enter: spring, opacity 0→1, translateY -100→0
- Exit: timing 300ms, opacity 1→0

### Buttons

- Press: spring scale 0.95→1 via `react-native-reanimated`

### Parallax header

- `scrollEventThrottle: 16`
- Combined scale + translateY interpolated from scroll offset
- Header height constant: 250px

---

## Accessibility

- `accessibilityRole`: `button`, `header`, `combobox`, `search`, `alert`
- `accessibilityState`: `{ disabled, selected, busy }`
- `accessibilityHint`: on complex interactions
- `accessibilityLiveRegion: 'polite'` on dynamic content
- Minimum hit target: 44×44px; `hitSlop: { top: 10, bottom: 10, left: 10, right: 10 }` for small buttons

---

## Tab Bar

- Active tint: `primary`
- Icon size: 28px
- Cart badge: 10×10px circle, positioned top-right at (-2, -2)
- iOS: haptic feedback on tab press

---

## Navigation Theme

`app/_layout.tsx` builds custom light/dark nav themes from `Colors`, passed to the navigation container. Maps: `primary`, `background`, `card`, `text`, `border`, `notification`.

---

## Constants Quick Reference

| Constant file          | Contents                                        |
| ---------------------- | ----------------------------------------------- |
| `constants/Colors.ts`  | All color tokens, light + dark                  |
| `constants/Routes.ts`  | Route name constants + `USER_ROLES` enum        |
| `constants/Company.ts` | Brand name, tagline, address                    |

---

## Known Design Debt / Redesign Notes

- Spacing values are not centralized — they appear as magic numbers in `StyleSheet.create` blocks across files. A future `constants/Spacing.ts` or `constants/Layout.ts` would help.
- No shared button component exists — button styles are recreated per screen. Consolidating into a `Button` primitive would reduce drift.
- Dark mode has not been validated on all admin screens.
- The `ThemeToggle` component is only accessible from the profile screen; no design pattern exists for surfacing it elsewhere.
