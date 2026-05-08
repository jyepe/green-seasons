# Edit Profile Redesign

**Date:** 2026-05-08
**Branch:** `feature/edit-profile-redesign` (off `preview`)
**Scope:** Redesign of `components/EditProfileForm.tsx`. No backend changes, no new routes, no role restrictions.

## Goal

Replace the flat list of inputs with a section-card layout matching the provided mockup (`Light.png`). All logic — reducer, validation, mutation — stays exactly the same. Visual change only, plus a new Security section with a Change Password row.

## Design reference

Screenshot: `c:\Users\yepej\Downloads\Light.png`

## Scope decisions

| Decision | Choice | Rationale |
|---|---|---|
| Architecture | Lightweight reskin — one file changed | Section card pattern is ~10 lines of style; no second consumer exists to justify extraction |
| Save button | `Stack.Screen` header right button (text) | Matches mockup; removes redundant bottom button |
| Change password | Send Supabase password reset email → Toast | No form screen needed; consistent with magic-link auth already in app |
| Password sublabel | "Sends a reset link to your email" | Explains the action without requiring `password_changed_at` tracking |
| Page header | No avatar — sections only | Matches mockup exactly; consistent with screenshot |
| Role access | Identical for all roles | Admin, employee, restaurant_owner all see same content |
| Validation / mutation | Unchanged | Same `editProfileReducer`, same `useUpdateUserInfo` mutation |

## Visual design

### Section cards

Three labeled surface cards, vertically stacked with `16px` gap, horizontal padding `16px`:

| Card | Section label | Subtitle | Contents |
|---|---|---|---|
| Identity | `IDENTITY` | "What teammates and Green Seasons see." | First Name, Last Name inputs |
| Contact | `CONTACT` | "Used for order updates and receipts." | Email, Phone Number inputs |
| Security | `SECURITY` | *(none)* | Change password row |

Section label: 11px semibold, `colors.textSecondary`, uppercase, letter-spacing 0.6px.
Subtitle: 12px regular, `colors.textTertiary`, margin-bottom 14px.

Card styles:
- Light: `background: colors.surface`, `borderRadius: 14`, shadow `0 2px 8px rgba(0,0,0,0.07)`, elevation 2
- Dark: `background: colors.surface`, `borderRadius: 14`, `borderWidth: StyleSheet.hairlineWidth`, `borderColor: colors.border`

### Input fields

Use existing `ThemedInput` component. No changes to input appearance. Labels (`First Name`, `Last Name`, etc.) are 13px semibold, `colors.text`.

### Change password row

Pressable row inside the Security card:
- 36×36 icon tile: `borderRadius: 10`, background `rgba(colors.primary, 0.12)` — use existing `withAlpha` helper from `components/profile/utils.ts`
- Icon: `lock-closed-outline` (Ionicons), 18px, `colors.primary`
- Label: "Change password", 14px semibold, `colors.text`
- Sublabel: "Sends a reset link to your email", 12px regular, `colors.textTertiary`
- Trailing: chevron-forward, 18px, `colors.textTertiary`
- Top border: `StyleSheet.hairlineWidth`, `colors.border` (separator from section label)

### Save button (header)

Passed via `Stack.Screen options.headerRight`. Text "Save", 15px semibold, `colors.primary`. Disabled + opacity 0.5 while `updateUserInfoMutation.isPending`.

Bottom `TouchableOpacity` save button removed.

### Spacing

- Card gap: `Spacing.s4` (16px)
- Outer horizontal padding: `Spacing.s4` (16px)
- Card inner padding: 16px
- Input-to-input gap within a card: `Spacing.s3` (12px)
- Section label → subtitle → first input gap: 3px / 14px respectively

### Theming

All colors via `Colors[colorScheme]` using `useAppColorScheme()`. No hardcoded hex values.

## Change password behavior

```
User taps row
  → call Supabase auth.resetPasswordForEmail(userInfo.email)
  → on success: show Toast type="success" message="Reset link sent — check your inbox."
  → on error:   show Toast type="error"   message="Couldn't send reset email. Try again."
```

Uses existing `Toast` component. No navigation, no modal.

The Supabase client call is `supabase.auth.resetPasswordForEmail(email)` — already available via the existing client in `lib/supabase.ts`. No new lib function needed; call directly in the component since it's one-off UI-only logic.

## Files changed

| File | Change |
|---|---|
| `components/EditProfileForm.tsx` | Full reskin — section cards, header Save, Security row, change-password handler |

No new files. No new components.

## Loading & error states

| State | Behavior |
|---|---|
| `isUserLoading` | Existing centered `ActivityIndicator` — unchanged |
| Save pending | Header Save button disabled + 0.5 opacity; existing behavior preserved |
| Save error | Existing `Alert.alert('Error', ...)` — unchanged |
| Reset email sending | Row shows `ActivityIndicator` in place of chevron while in flight |
| Reset email success | Toast: "Reset link sent — check your inbox." |
| Reset email error | Toast: "Couldn't send reset email. Try again." |

## Accessibility

- Section label `View`: `accessibilityRole="header"`
- Change password row: `accessibilityRole="button"`, `accessibilityLabel="Change password, sends a reset link to your email"`
- Header Save button: `accessibilityLabel="Save changes"`, `accessibilityState={{ disabled: isPending, busy: isPending }}`
- All existing `ThemedInput` accessibility labels unchanged

## Verification

- `npm run check-all` must pass before opening PR
- Manual check: light + dark mode, all three roles (admin, employee, restaurant_owner)
- Change password: tap → loading chevron → toast appears → no navigation occurs
- Save: edit a field → tap Save → success alert → navigates back
- Save: no changes → "No changes to save" alert — existing behavior preserved
- Validation errors: empty required field → red border + error message below input — existing behavior preserved
