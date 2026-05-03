# Profile Tab Redesign — Restaurant Owner

**Date:** 2026-05-02
**Branch:** `feature/profile-tab-redesign` (off `preview`)
**Scope:** Redesign of `(tabs)/profile.tsx` for the restaurant owner role only. No backend changes, no admin/employee profile changes.

## Goal

Redesign the restaurant owner profile tab to match the Anthropic-design template (`Profile Tab.html` + `profile.jsx`) while binding to existing app data. Visual fidelity to the template is the success criterion; missing backend fields are stubbed visually rather than built.

## Source of truth

The handoff bundle is unpacked at `.design-ref/` (gitignored). Files of interest:

- `.design-ref/project/Profile Tab.html` — top-level tweak defaults and shell layout
- `.design-ref/project/profile.jsx` — full screen implementation (header, sections, rows, toggles)
- `.design-ref/project/colors_and_type.css` — token names (already mirrored in `constants/Colors.ts`)

The template's `EDITMODE-BEGIN` defaults represent the user's final landing state. Everything in this spec mirrors those defaults except where called out.

## Scope decisions

| Decision        | Choice                               | Rationale                                                                                                                                                                                                               |
| --------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Styling         | React Native `StyleSheet` only       | Matches every other screen. Tailwind/NativeWind would require new metro/babel/postcss config and create a hybrid styling vocabulary for one screen. The design has zero requirements that benefit from utility classes. |
| Backend gaps    | Visual-only stubs                    | Business details, notification preferences, Help/Terms have no backend. Stubbed rows show realistic placeholder values; taps surface a "Coming soon" toast (or use local `useState` for toggles).                       |
| Theme toggle    | Row in Preferences                   | Existing inline `<ThemeToggle />` is replaced by a `ProfileToggleRow` labeled "Dark mode" alongside Delivery updates.                                                                                                   |
| Delete account  | Danger row in its own bottom section | Required for app-store compliance; rendered as a single danger row in a no-title section beneath Sign out.                                                                                                              |
| Admin shortcuts | Dropped                              | The current admin conditional buttons (Create Restaurant, Employee Management, Item Management) are out of scope — admins reach those screens through the `/admin` stack.                                               |
| Settings gear   | Navigates to `/profile/edit`         | Pragmatic reuse of the existing edit route.                                                                                                                                                                             |
| Row scope       | Mirror template defaults             | Render only the rows toggled ON in `EDITMODE-BEGIN` (plus our additions: Dark mode, Delete account).                                                                                                                    |

## File layout

```
components/profile/
  ProfileAvatar.tsx        — gradient initials avatar (uses expo-linear-gradient)
  ProfileHeader.tsx        — minimal centered header (avatar + name + role + restaurant)
  ProfileSection.tsx       — labeled card container; auto-strips divider from last child
  ProfileRow.tsx           — icon tile + label + sublabel + value/chevron, danger variant
  ProfileToggleRow.tsx     — icon tile + label + sublabel + RN Switch
  index.ts                 — barrel export
components/UserProfile.tsx — rewritten orchestrator (~150 LOC, wires hooks → sections)
```

Keep `.design-ref/` gitignored.

## Component contracts

### `ProfileAvatar`

```ts
type Props = {
  initials: string; // 1–2 chars
  size?: number; // default 76
};
```

Circular gradient (135deg, `colors.primary` → primaryTint), white initials at 38% size, soft drop shadow tinted with `colors.primary`. Uses `expo-linear-gradient`.

### `ProfileHeader`

```ts
type Props = {
  name: string;
  role?: string; // omitted when falsy
  restaurantName?: string;
};
```

Renders top bar (absolute-positioned title + 36×36 gear button → `/profile/edit`) and a centered avatar/name/role/restaurant block. `paddingTop: insets.top + 8` for the bar; `paddingTop: 72` for the centered block.

### `ProfileSection`

```ts
type Props = {
  title?: string; // uppercase 11px semibold; omitted when falsy
  children: React.ReactNode;
};
```

Wraps children in a rounded surface card with hairline borders between visible children. Filters falsy children before adding dividers; the last visible child has no bottom border. Light mode: shadow. Dark mode: 1px border in `colors.border`.

### `ProfileRow`

```ts
type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: string; // default: alpha-10 of iconColor
  iconColor?: string; // default: colors.primary
  label: string;
  sublabel?: string;
  value?: string;
  trailing?: 'chevron' | 'none'; // default 'chevron'
  danger?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
};
```

`Pressable` with overlay press feedback. 32×32 icon tile, label 14px semibold (red when `danger`), sublabel 12px regular, value 13px medium right-aligned. Chevron 18px in `colors.text3`.

### `ProfileToggleRow`

```ts
type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};
```

Same layout as `ProfileRow` but trailing element is React Native's `Switch` themed with `colors.primary`.

### `UserProfile` (orchestrator)

- Wires `useUserInfo`, `useRestaurant(owned_restaurant_id)`, `useOrders(userInfo?.id)`, `useFavoriteItems`, `useTheme`, `useSignOut`, `useDeleteAccount`.
- Local UI state: `notifDelivery` (default `true`).
- Computes `initials` from name parts (first letter of first + last; fallback to email's first char).
- Computes favorites sublabel: first two item names joined by ", " plus `+N` suffix when count > 2.
- Renders header → sections → footer in a `ScrollView` with `RefreshControl` that parallel-refetches userInfo, restaurant, orders, favorites.
- Bottom padding: 110px to clear the tab bar.

## Section content (final)

| Section        | Rows                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account        | Personal info (sublabel: email) → `/profile/edit` · Business details (sublabel: "EIN, license, tax exempt") → toast "Coming soon"                                                  |
| Orders & Lists | Order history (value: `${count} total`) → `/orders` · My favorites (sublabel: first 2 item names + "+N", value: `${count} items`) → `/favorites`                                   |
| Preferences    | Delivery updates (toggle, default ON, local state) · Dark mode (binary toggle: ON → `setThemeMode('dark')`, OFF → `setThemeMode('light')`; bound state = `isDark` from `useTheme`) |
| Support        | Help center → toast "Coming soon" · Terms & privacy → toast "Coming soon"                                                                                                          |
| (none)         | Sign out (danger, no chevron) → existing `handleSignOut`                                                                                                                           |
| (none)         | Delete account (danger, no chevron) → existing `handleDeleteAccount`                                                                                                               |
| Footer         | "Green Seasons" / `v {Constants.expoConfig?.version ?? '?'} · Hialeah, FL` (uses already-installed `expo-constants`)                                                               |

Icon assignments mirror the template `profile.jsx` exactly. Favorites icon uses literal `#DC2626` to match the template's red regardless of theme.

## Theming rules

- All colors come from `Colors[colorScheme]` via `useAppColorScheme`.
- Card surface: `colors.surface`. Dark mode adds `borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border`.
- Light mode card shadow: `shadowOffset: {0, 2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2`.
- Press feedback overlay: `rgba(255,255,255,0.04)` (dark) / `rgba(17,24,39,0.03)` (light).
- Icon tile bg: `withAlpha(iconColor, 0.10)` — small helper that produces an `rgba()` string from a hex. Lives in `components/profile/utils.ts` (feature-local; not promoted to `lib/` since no other feature needs it yet).

## Loading & error states

| State                                             | Behavior                                                                                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `userInfo` loading                                | Render header skeleton: gray `View` placeholders sized as the name/role/restaurant lines (background = `colors.border`, no animation). Sections still render with empty values. |
| `userInfo` null/error                             | Replace header with the existing "Loading profile..." fallback message.                                                                                                         |
| `restaurant` undefined (no `owned_restaurant_id`) | Hide the restaurant line in the header.                                                                                                                                         |
| `orders` loading                                  | Order history value shows "—" until loaded.                                                                                                                                     |
| `favoriteItems` loading                           | Favorites value shows "—" and sublabel is omitted.                                                                                                                              |
| `favoriteItems` empty                             | Value: "0 items"; sublabel: "Tap to start saving items".                                                                                                                        |

## Accessibility

- Each row: `accessibilityRole="button"`, `accessibilityLabel` = label + (value or sublabel).
- Toggle rows: `accessibilityRole="switch"`, `accessibilityState: { checked }`.
- Header title: `accessibilityRole="header"`.
- Avatar: `accessibilityLabel="Avatar for {name}"`.
- Min touch target 44pt — rows clear this with `12 + 32 + 12 = 56pt` height.

## Verification

- `npm run check-all` (typecheck + ESLint + Prettier) must pass before opening a PR.
- Manual visual check on iOS and Android, light + dark mode:
  - Header with and without a linked restaurant
  - Sections with loading skeleton vs loaded data
  - Favorites with 0, 1, 2, 13 items (sublabel + value)
  - Sign out flow (already tested) and Delete account flow (already tested)
  - Pull-to-refresh
  - Tab bar bottom inset cleared (no overlap)
- No new tests — repo has no test runner configured.

## Out of scope

- Admin / employee profile screens.
- Notification preferences backend.
- Restaurant business-details schema (EIN, license, tax exempt).
- Help center / Terms & privacy hosted pages.
- Receiving window / delivery card / stat strip / verified badge / member since (template features that are OFF in `EDITMODE-BEGIN` defaults).
- Banner header style (template offers minimal vs banner; we render minimal only).
- Settings sub-screen (not needed; theme toggle moved into Preferences).

## Risks

- `expo-linear-gradient` is verified as a direct dep (`~15.0.8`). No install needed.
- Restaurant owners without an `owned_restaurant_id` (newly signed up, pre-onboarding) need a graceful header — covered by the "restaurant undefined" rule above. Confirm the screen still looks right when the field is omitted.
- The favorites sublabel relies on `useFavoriteItems` returning items with a `name` field. If the shape differs, fall back to count-only sublabel.
- Replacing the existing `<ThemeToggle />` (3-way: light/dark/system) with a binary Dark mode toggle removes the explicit "follow system" option from the UI. Users who previously chose System will continue to be on System until they tap the toggle, at which point they pick Light or Dark explicitly. If we need to preserve the System affordance, consider adding a long-press on the toggle or a hidden third state — out of scope for this PR unless the user objects.

## Branch & PR

- Create `feature/profile-tab-redesign` off `preview` (per CLAUDE.md).
- Single PR back to `preview` once `npm run check-all` passes.
- Include before/after screenshots in the PR body (light + dark, iOS).
