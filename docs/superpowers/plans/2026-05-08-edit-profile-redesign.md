# Edit Profile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin `components/EditProfileForm.tsx` from a flat input list to a grouped section-card layout (Identity, Contact, Security) matching the approved mockup, with the Save button moved to the navigation header and a new Change Password row that sends a Supabase password reset email.

**Architecture:** Single file change — `EditProfileForm.tsx` gets new section-card wrappers around the existing `ThemedInput` fields, a `Stack.Screen headerRight` Save button, a Security card with a `Pressable` Change Password row, and a `Toast` for reset feedback. All existing form logic (reducer, validation, `useUpdateUserInfo` mutation) is unchanged.

**Tech Stack:** React Native `StyleSheet`, Expo Router `Stack.Screen`, `Ionicons` (Expo vector icons), existing `Toast` component, existing `withAlpha` util, existing `resetPassword` lib function.

---

## File map

| File | Change |
|---|---|
| `components/EditProfileForm.tsx` | Full reskin — section cards, header Save, Security row, change-password handler |

No new files. No new components.

---

## Task 1: Create the feature branch

**Files:**
- No file changes — branch setup only

- [ ] **Step 1: Ensure preview is up to date and create branch**

```bash
git checkout preview
git pull origin preview
git checkout -b feature/edit-profile-redesign
```

Expected: branch `feature/edit-profile-redesign` checked out with clean status.

---

## Task 2: Update imports and add new state

**Files:**
- Modify: `components/EditProfileForm.tsx:1-18` (imports block)
- Modify: `components/EditProfileForm.tsx:25-38` (state declarations)

- [ ] **Step 1: Replace the imports block**

Open `components/EditProfileForm.tsx`. Replace everything from line 1 through the last `import` statement with:

```tsx
import { withAlpha } from '@/components/profile/utils';
import { Toast } from '@/components/ui/Toast';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useUpdateUserInfo, useUserInfo } from '@/hooks/useUserInfo';
import type { UpdateUserInfoParams } from '@/lib/supabase';
import { resetPassword } from '@/lib/supabase';
import { initialState, profileReducer } from '@/reducers/editProfileReducer';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useReducer, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedInput } from '@/components/ThemedView';
```

- [ ] **Step 2: Add toast + resetPending state**

Inside `EditProfileForm`, directly after the existing `errors` state declaration (after line ~38), add:

```tsx
const [toastVisible, setToastVisible] = useState(false);
const [toastMessage, setToastMessage] = useState('');
const [toastType, setToastType] = useState<'success' | 'error'>('success');
const [resetPending, setResetPending] = useState(false);
```

---

## Task 3: Add helper functions

**Files:**
- Modify: `components/EditProfileForm.tsx` — add two helpers between the `useEffect` and `handleSave`

- [ ] **Step 1: Add `showToast` helper**

After the `useEffect` block and before `handleSave`, add:

```tsx
const showToast = (message: string, type: 'success' | 'error') => {
  setToastMessage(message);
  setToastType(type);
  setToastVisible(true);
};
```

- [ ] **Step 2: Add `handleChangePassword` handler**

Directly after `showToast`, add:

```tsx
const handleChangePassword = async () => {
  if (!userInfo?.email) return;
  setResetPending(true);
  try {
    await resetPassword({ email: userInfo.email });
    showToast('Reset link sent — check your inbox.', 'success');
  } catch {
    showToast("Couldn't send reset email. Try again.", 'error');
  } finally {
    setResetPending(false);
  }
};
```

---

## Task 4: Move Save to header and add Toast to JSX

**Files:**
- Modify: `components/EditProfileForm.tsx` — `Stack.Screen` options and return block

- [ ] **Step 1: Replace the `Stack.Screen` block**

Find the existing `<Stack.Screen options={{ title: 'Edit Profile', headerBackTitle: 'Profile' }} />` and replace it with:

```tsx
<Stack.Screen
  options={{
    title: 'Edit Profile',
    headerBackTitle: 'Profile',
    headerRight: () => (
      <TouchableOpacity
        onPress={handleSave}
        disabled={updateUserInfoMutation.isPending}
        accessibilityLabel="Save changes"
        accessibilityRole="button"
        accessibilityState={{
          disabled: updateUserInfoMutation.isPending,
          busy: updateUserInfoMutation.isPending,
        }}
        style={{ opacity: updateUserInfoMutation.isPending ? 0.5 : 1 }}
      >
        {updateUserInfoMutation.isPending ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.headerSave, { color: colors.primary }]}>
            Save
          </Text>
        )}
      </TouchableOpacity>
    ),
  }}
/>
```

- [ ] **Step 2: Add `Toast` immediately after `Stack.Screen`**

```tsx
<Toast
  message={toastMessage}
  type={toastType}
  visible={toastVisible}
  onHide={() => setToastVisible(false)}
/>
```

---

## Task 5: Rewrite the ScrollView content with section cards

**Files:**
- Modify: `components/EditProfileForm.tsx` — full ScrollView content replacement

This replaces the flat list of four `ThemedInput` fields and the bottom `TouchableOpacity` Save button.

- [ ] **Step 1: Add the dark-mode card style derivation**

Inside `EditProfileForm`, before the `return` statement (after `handleSave`), add:

```tsx
const isDark = colorScheme === 'dark';
const cardStyle = [
  styles.card,
  { backgroundColor: colors.surface },
  isDark
    ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }
    : styles.cardShadow,
];
```

- [ ] **Step 2: Replace the `ScrollView` content**

Replace everything inside `<ScrollView contentContainerStyle={styles.scrollContent}>…</ScrollView>` with:

```tsx
{/* IDENTITY */}
<View style={cardStyle}>
  <Text
    style={[styles.sectionLabel, { color: colors.textSecondary }]}
    accessibilityRole="header"
  >
    IDENTITY
  </Text>
  <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
    What teammates and Green Seasons see.
  </Text>
  <ThemedInput
    label="First Name"
    value={firstName}
    onChangeText={text => {
      dispatch({ type: 'SET_FIRST_NAME', payload: text });
      if (errors.firstName) setErrors({ ...errors, firstName: undefined });
    }}
    placeholder="First Name"
    accessibilityLabel="First Name"
    containerStyle={styles.inputTop}
    error={errors.firstName}
  />
  <ThemedInput
    label="Last Name"
    value={lastName}
    onChangeText={text => {
      dispatch({ type: 'SET_LAST_NAME', payload: text });
      if (errors.lastName) setErrors({ ...errors, lastName: undefined });
    }}
    placeholder="Last Name"
    accessibilityLabel="Last Name"
    containerStyle={styles.inputBottom}
    error={errors.lastName}
  />
</View>

{/* CONTACT */}
<View style={cardStyle}>
  <Text
    style={[styles.sectionLabel, { color: colors.textSecondary }]}
    accessibilityRole="header"
  >
    CONTACT
  </Text>
  <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
    Used for order updates and receipts.
  </Text>
  <ThemedInput
    label="Email"
    value={email}
    onChangeText={text => {
      dispatch({ type: 'SET_EMAIL', payload: text });
      if (errors.email) setErrors({ ...errors, email: undefined });
    }}
    placeholder="Email"
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}
    accessibilityLabel="Email"
    containerStyle={styles.inputTop}
    error={errors.email}
  />
  <ThemedInput
    label="Phone Number"
    value={phone}
    onChangeText={text => dispatch({ type: 'SET_PHONE', payload: text })}
    placeholder="Phone Number"
    keyboardType="phone-pad"
    accessibilityLabel="Phone Number"
    containerStyle={styles.inputBottom}
  />
</View>

{/* SECURITY */}
<View style={cardStyle}>
  <Text
    style={[
      styles.sectionLabel,
      { color: colors.textSecondary },
      styles.sectionLabelNoSubtitle,
    ]}
    accessibilityRole="header"
  >
    SECURITY
  </Text>
  <Pressable
    onPress={handleChangePassword}
    disabled={resetPending || !userInfo?.email}
    style={({ pressed }) => [
      styles.passwordRow,
      {
        borderTopColor: colors.border,
        backgroundColor: pressed
          ? isDark
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(17,24,39,0.03)'
          : 'transparent',
      },
    ]}
    accessibilityRole="button"
    accessibilityLabel="Change password, sends a reset link to your email"
  >
    <View
      style={[
        styles.iconTile,
        { backgroundColor: withAlpha(colors.primary, 0.12) },
      ]}
    >
      <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
    </View>
    <View style={styles.rowBody}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>
        Change password
      </Text>
      <Text style={[styles.rowSublabel, { color: colors.textTertiary }]}>
        Sends a reset link to your email
      </Text>
    </View>
    {resetPending ? (
      <ActivityIndicator size="small" color={colors.textTertiary} />
    ) : (
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    )}
  </Pressable>
</View>
```

---

## Task 6: Replace the StyleSheet

**Files:**
- Modify: `components/EditProfileForm.tsx` — `StyleSheet.create({…})` block

- [ ] **Step 1: Replace the entire `StyleSheet.create` call**

Delete the existing `const styles = StyleSheet.create({…})` block and replace it with:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.s4,
    gap: Spacing.s4,
  },
  headerSave: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    borderRadius: 14,
    padding: Spacing.s4,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 14,
  },
  sectionLabelNoSubtitle: {
    marginBottom: 0,
  },
  inputTop: {
    marginBottom: Spacing.s3,
  },
  inputBottom: {
    marginBottom: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  rowSublabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});
```

---

## Task 7: Verify, commit, and open PR

**Files:**
- No code changes — verification and git ops only

- [ ] **Step 1: Run the full check suite**

```bash
npm run check-all
```

Expected: no TypeScript errors, no lint errors, no Prettier violations. Fix any issues before continuing.

- [ ] **Step 2: Manual smoke-check (if a device/simulator is available)**

```bash
npm run android   # or: npm run ios
```

Navigate to the edit profile screen from any role (restaurant owner, admin, or employee). Verify:
- Three section cards render correctly in light and dark mode
- "Save" appears in the navigation header; bottom button is gone
- Editing a field and tapping Save shows the success alert and navigates back
- Editing nothing and tapping Save shows "No changes to save"
- Empty first/last name shows red validation errors under the inputs
- Tapping "Change password" shows the spinner, then the green toast

- [ ] **Step 3: Commit**

```bash
git add components/EditProfileForm.tsx
git commit -m "feat: redesign edit profile page with section cards and security row"
```

- [ ] **Step 4: Push and open PR**

```bash
git push -u origin feature/edit-profile-redesign
gh pr create \
  --base preview \
  --title "feat: redesign edit profile page" \
  --body "$(cat <<'EOF'
## Summary
- Reskins EditProfileForm with grouped section cards (Identity, Contact, Security)
- Moves Save button from bottom of scroll to navigation header right
- Adds Change Password row (Security section) that sends a Supabase password reset email and shows a Toast

## Test plan
- [ ] Light mode: three cards render with correct labels and subtitles
- [ ] Dark mode: cards show hairline border instead of shadow
- [ ] Save (changed fields): success alert → navigates back
- [ ] Save (no changes): "No changes to save" alert
- [ ] Save (empty required field): red border + error message under input
- [ ] Change password: spinner during send → success toast on completion
- [ ] Change password (error): error toast shown
- [ ] All three roles (restaurant_owner, admin, employee) reach the screen correctly
- [ ] npm run check-all passes

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
