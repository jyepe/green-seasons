# Profile Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the restaurant-owner profile tab to match the Anthropic-design template, using existing app data and React Native `StyleSheet`. No backend changes.

**Architecture:** Decompose into reusable pieces under `components/profile/` (Avatar, Section, Row, ToggleRow, Header, utils) and rewrite `components/UserProfile.tsx` as a thin orchestrator that wires existing TanStack Query hooks (`useUserInfo`, `useRestaurant`, `useOrders`, `useFavoriteItems`, `useTheme`) to those pieces. Visual-only stubs surface a Toast for rows whose backend doesn't exist yet.

**Tech Stack:** React Native (Expo 54), Expo Router 6, TypeScript strict, `@expo/vector-icons` (Ionicons), `expo-linear-gradient`, `expo-constants`, `react-native-safe-area-context`, TanStack Query.

**Verification gate:** This repo has **no test runner** (per `CLAUDE.md`). Each task's verification step is `npm run check-all` (typecheck + ESLint + Prettier). The final task adds manual visual checks against the design template.

**Branch:** `feature/profile-tab-redesign` (already created off `preview`). Spec: `docs/superpowers/specs/2026-05-02-profile-tab-redesign-design.md`. Local design reference: `.design-ref/` (gitignored).

---

## Task 1: Add `withAlpha` helper

**Files:**
- Create: `components/profile/utils.ts`

- [ ] **Step 1: Create the helper file**

```ts
// components/profile/utils.ts

/**
 * Convert a #RRGGBB hex string + alpha (0–1) into an `rgba(r, g, b, a)` string.
 * Used for icon-tile backgrounds where we want a transparent tint of the icon's
 * own color in a way that works in both light and dark mode.
 */
export function withAlpha(hex: string, alpha: number): string {
  const trimmed = hex.replace('#', '');
  const r = parseInt(trimmed.slice(0, 2), 16);
  const g = parseInt(trimmed.slice(2, 4), 16);
  const b = parseInt(trimmed.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS (typecheck + lint + prettier all green).

- [ ] **Step 3: Commit**

```bash
git add components/profile/utils.ts
git commit -m "feat(profile): add withAlpha helper for icon-tile backgrounds"
```

---

## Task 2: Build `ProfileAvatar`

**Files:**
- Create: `components/profile/ProfileAvatar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/profile/ProfileAvatar.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  initials: string;
  size?: number;
};

export function ProfileAvatar({ initials, size = 76 }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  // Light: forest green → mid-green tint. Dark: mid-green → mint-soft for visible contrast.
  const gradientEnd =
    colorScheme === 'dark' ? colors.mintSoft : colors.primaryTint;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.27,
        shadowRadius: 16,
        elevation: 6,
      }}
      accessibilityRole="image"
      accessibilityLabel={`Avatar with initials ${initials}`}
    >
      <LinearGradient
        colors={[colors.primary, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: size / 2 }]}
      >
        <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/profile/ProfileAvatar.tsx
git commit -m "feat(profile): add ProfileAvatar with gradient initials"
```

---

## Task 3: Build `ProfileSection`

**Files:**
- Create: `components/profile/ProfileSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/profile/ProfileSection.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  title?: string;
  children: React.ReactNode;
};

/**
 * Card container that auto-strips the bottom divider from the last visible row.
 * Children that render `null` (e.g. when conditionally rendered) are filtered
 * out before the last-child decision is made, so the rule is "last *visible*
 * child has no bottom border" rather than "last child in JSX order."
 */
export function ProfileSection({ title, children }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const visible = React.Children.toArray(children).filter(Boolean);
  if (visible.length === 0) return null;

  const decorated = visible.map((child, i) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(
      child as React.ReactElement<{ isLast?: boolean }>,
      { isLast: i === visible.length - 1 }
    );
  });

  return (
    <View style={styles.wrap}>
      {title ? (
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {title}
        </Text>
      ) : null}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.border : 'transparent',
            borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
            shadowOpacity: isDark ? 0 : 0.06,
          },
        ]}
      >
        {decorated}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
  },
  title: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/profile/ProfileSection.tsx
git commit -m "feat(profile): add ProfileSection container with auto last-row divider stripping"
```

---

## Task 4: Build `ProfileRow`

**Files:**
- Create: `components/profile/ProfileRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/profile/ProfileRow.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { withAlpha } from './utils';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  value?: string;
  trailing?: 'chevron' | 'none';
  danger?: boolean;
  onPress?: () => void;
  /** Injected by ProfileSection — last visible row has no bottom border. */
  isLast?: boolean;
  accessibilityHint?: string;
};

export function ProfileRow({
  icon,
  iconBg,
  iconColor,
  label,
  sublabel,
  value,
  trailing = 'chevron',
  danger,
  onPress,
  isLast,
  accessibilityHint,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const resolvedIconColor = iconColor ?? colors.primary;
  const resolvedIconBg = iconBg ?? withAlpha(resolvedIconColor, 0.1);
  const pressOverlay =
    colorScheme === 'dark'
      ? 'rgba(255,255,255,0.04)'
      : 'rgba(17,24,39,0.03)';

  const a11yLabel = [label, value, sublabel].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? pressOverlay : 'transparent',
          borderBottomColor: colors.border,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={accessibilityHint}
    >
      <View style={[styles.iconTile, { backgroundColor: resolvedIconBg }]}>
        <Ionicons name={icon} size={16} color={resolvedIconColor} />
      </View>
      <View style={styles.body}>
        <Text
          style={[
            styles.label,
            { color: danger ? colors.error : colors.text },
          ]}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text
            style={[styles.sublabel, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={[styles.value, { color: colors.textSecondary }]}>
          {value}
        </Text>
      ) : null}
      {trailing === 'chevron' ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.07,
  },
  sublabel: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_400Regular',
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/profile/ProfileRow.tsx
git commit -m "feat(profile): add ProfileRow with icon tile, sublabel, value and chevron"
```

---

## Task 5: Build `ProfileToggleRow`

**Files:**
- Create: `components/profile/ProfileToggleRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/profile/ProfileToggleRow.tsx
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { withAlpha } from './utils';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Injected by ProfileSection — last visible row has no bottom border. */
  isLast?: boolean;
};

export function ProfileToggleRow({
  icon,
  iconBg,
  iconColor,
  label,
  sublabel,
  value,
  onValueChange,
  isLast,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const resolvedIconColor = iconColor ?? colors.primary;
  const resolvedIconBg = iconBg ?? withAlpha(resolvedIconColor, 0.1);
  const trackOff = colorScheme === 'dark' ? '#3A4148' : '#D1D5DB';

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
    >
      <View style={[styles.iconTile, { backgroundColor: resolvedIconBg }]}>
        <Ionicons name={icon} size={16} color={resolvedIconColor} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {sublabel ? (
          <Text
            style={[styles.sublabel, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: trackOff, true: colors.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={trackOff}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.07,
  },
  sublabel: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/profile/ProfileToggleRow.tsx
git commit -m "feat(profile): add ProfileToggleRow with native Switch"
```

---

## Task 6: Build `ProfileHeader`

**Files:**
- Create: `components/profile/ProfileHeader.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/profile/ProfileHeader.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { ProfileAvatar } from './ProfileAvatar';

type Props = {
  name: string;
  role?: string;
  restaurantName?: string;
  initials: string;
  onSettingsPress?: () => void;
  /** When true, render gray placeholder pills instead of name/role/restaurant text. */
  isLoading?: boolean;
};

export function ProfileHeader({
  name,
  role,
  restaurantName,
  initials,
  onSettingsPress,
  isLoading,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <View>
      {/* Top bar: absolute so the centered avatar/name block sits *below* it */}
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <Text
          style={[styles.topBarTitle, { color: colors.text }]}
          accessibilityRole="header"
        >
          Profile
        </Text>
        <Pressable
          onPress={onSettingsPress}
          style={[
            styles.gear,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <Ionicons
            name="settings-outline"
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* Centered minimal header */}
      <View
        style={[
          styles.center,
          { paddingTop: insets.top + 64 },
        ]}
      >
        <ProfileAvatar initials={initials} size={76} />
        <View style={styles.nameBlock}>
          {isLoading ? (
            <>
              <View
                style={[
                  styles.skeletonName,
                  { backgroundColor: colors.border },
                ]}
              />
              <View
                style={[
                  styles.skeletonLine,
                  { backgroundColor: colors.border, marginTop: 6 },
                ]}
              />
            </>
          ) : (
            <>
              <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
              {role ? (
                <Text
                  style={[styles.role, { color: colors.textSecondary }]}
                >
                  {role}
                </Text>
              ) : null}
              {restaurantName ? (
                <View style={styles.restaurantRow}>
                  <Ionicons
                    name="storefront-outline"
                    size={13}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.restaurant,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {restaurantName}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.17,
  },
  gear: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  center: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  nameBlock: {
    marginTop: 10,
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.22,
  },
  role: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  restaurant: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  skeletonName: {
    width: 160,
    height: 22,
    borderRadius: 6,
  },
  skeletonLine: {
    width: 110,
    height: 13,
    borderRadius: 4,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/profile/ProfileHeader.tsx
git commit -m "feat(profile): add ProfileHeader with top bar + centered minimal block"
```

---

## Task 7: Add barrel export

**Files:**
- Create: `components/profile/index.ts`

- [ ] **Step 1: Create the barrel**

```ts
// components/profile/index.ts
export { ProfileAvatar } from './ProfileAvatar';
export { ProfileHeader } from './ProfileHeader';
export { ProfileRow } from './ProfileRow';
export { ProfileSection } from './ProfileSection';
export { ProfileToggleRow } from './ProfileToggleRow';
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/profile/index.ts
git commit -m "feat(profile): add barrel export for profile components"
```

---

## Task 8: Rewrite `UserProfile.tsx` orchestrator

**Files:**
- Modify: `components/UserProfile.tsx` (full rewrite)

- [ ] **Step 1: Replace the file with the new orchestrator**

```tsx
// components/UserProfile.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  ProfileHeader,
  ProfileRow,
  ProfileSection,
  ProfileToggleRow,
} from '@/components/profile';
import { Toast } from '@/components/ui/Toast';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme, useTheme } from '@/hooks/useTheme';
import { useFavoriteItems } from '@/hooks/useFavorite';
import { useOrders } from '@/hooks/useOrders';
import { useRestaurant } from '@/hooks/useRestaurant';
import {
  useDeleteAccount,
  useSignOut,
  useUserInfo,
} from '@/hooks/useUserInfo';

const FAVORITES_PREVIEW_LIMIT = 2;

function computeInitials(
  firstName?: string,
  lastName?: string,
  email?: string
): string {
  const parts = [firstName, lastName].filter(Boolean) as string[];
  if (parts.length > 0) {
    return parts
      .map(p => p[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2);
  }
  return (email?.[0] ?? '?').toUpperCase();
}

function titleCaseRole(role?: string): string | undefined {
  if (!role) return undefined;
  return role
    .split('_')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
}

function buildFavoritesSublabel(
  items: { name?: string }[] | undefined
): string | undefined {
  if (!items || items.length === 0) return 'Tap to start saving items';
  const named = items.filter(i => !!i.name) as { name: string }[];
  if (named.length === 0) return undefined;
  const head = named.slice(0, FAVORITES_PREVIEW_LIMIT).map(i => i.name);
  const remainder = items.length - head.length;
  return remainder > 0 ? `${head.join(', ')} +${remainder}` : head.join(', ');
}

export default function UserProfile() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { isDark, setThemeMode } = useTheme();

  const signOut = useSignOut();
  const deleteAccount = useDeleteAccount();
  const { data: userInfo, refetch: refetchUserInfo } = useUserInfo();
  const { data: restaurant, refetch: refetchRestaurant } = useRestaurant(
    userInfo?.owned_restaurant_id
  );
  const { data: orders, refetch: refetchOrders } = useOrders(userInfo?.id);
  const { data: favoriteItems, refetch: refetchFavorites } = useFavoriteItems();

  const [notifDelivery, setNotifDelivery] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const showComingSoon = useCallback(() => {
    setToast({ visible: true, message: 'Coming soon' });
  }, []);
  const hideToast = useCallback(() => {
    setToast(t => ({ ...t, visible: false }));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUserInfo(),
        refetchRestaurant(),
        refetchOrders(),
        refetchFavorites(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchUserInfo, refetchRestaurant, refetchOrders, refetchFavorites]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  }, [signOut, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/auth/login');
            } catch (error) {
              if (__DEV__) {
                // eslint-disable-next-line no-console
                console.error('Failed to delete account:', error);
              }
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again.'
              );
            }
          },
        },
      ]
    );
  }, [deleteAccount, router]);

  const fullName = useMemo(() => {
    if (!userInfo) return '';
    const parts = [userInfo.first_name, userInfo.last_name].filter(
      Boolean
    ) as string[];
    return parts.length > 0 ? parts.join(' ') : (userInfo.email ?? 'User');
  }, [userInfo]);

  const initials = useMemo(
    () =>
      computeInitials(
        userInfo?.first_name,
        userInfo?.last_name,
        userInfo?.email
      ),
    [userInfo?.first_name, userInfo?.last_name, userInfo?.email]
  );

  const favoritesSublabel = buildFavoritesSublabel(favoriteItems);
  const favoritesValue =
    favoriteItems !== undefined ? `${favoriteItems.length} items` : '—';
  const ordersValue = orders !== undefined ? `${orders.length} total` : '—';
  const appVersion = Constants.expoConfig?.version ?? '?';

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityLabel="User Profile Screen"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <ProfileHeader
          name={fullName}
          role={titleCaseRole(userInfo?.role)}
          restaurantName={restaurant?.name}
          initials={initials}
          onSettingsPress={() => router.push('/profile/edit')}
          isLoading={!userInfo}
        />

        {/* Account */}
        <ProfileSection title="Account">
          <ProfileRow
            icon="person-outline"
            label="Personal info"
            sublabel={userInfo?.email}
            onPress={() => router.push('/profile/edit')}
          />
          <ProfileRow
            icon="business-outline"
            iconColor={colors.accentWarm}
            label="Business details"
            sublabel="EIN, license, tax exempt"
            onPress={showComingSoon}
          />
        </ProfileSection>

        {/* Orders & Lists */}
        <ProfileSection title="Orders & Lists">
          <ProfileRow
            icon="receipt-outline"
            label="Order history"
            value={ordersValue}
            onPress={() => router.push('/orders')}
          />
          <ProfileRow
            icon="heart-outline"
            iconColor="#DC2626"
            label="My favorites"
            sublabel={favoritesSublabel}
            value={favoritesValue}
            onPress={() => router.push('/favorites')}
          />
        </ProfileSection>

        {/* Preferences */}
        <ProfileSection title="Preferences">
          <ProfileToggleRow
            icon="notifications-outline"
            label="Delivery updates"
            sublabel="Push when order status changes"
            value={notifDelivery}
            onValueChange={setNotifDelivery}
          />
          <ProfileToggleRow
            icon="moon-outline"
            iconColor={colors.info}
            label="Dark mode"
            value={isDark}
            onValueChange={next => {
              void setThemeMode(next ? 'dark' : 'light');
            }}
          />
        </ProfileSection>

        {/* Support */}
        <ProfileSection title="Support">
          <ProfileRow
            icon="help-circle-outline"
            label="Help center"
            onPress={showComingSoon}
          />
          <ProfileRow
            icon="shield-checkmark-outline"
            iconColor={colors.textSecondary}
            label="Terms & privacy"
            onPress={showComingSoon}
          />
        </ProfileSection>

        {/* Sign out */}
        <ProfileSection>
          <ProfileRow
            icon="log-out-outline"
            iconColor={colors.error}
            label="Sign out"
            danger
            trailing="none"
            onPress={handleSignOut}
          />
        </ProfileSection>

        {/* Delete account */}
        <ProfileSection>
          <ProfileRow
            icon="trash-outline"
            iconColor={colors.error}
            label="Delete account"
            danger
            trailing="none"
            onPress={handleDeleteAccount}
          />
        </ProfileSection>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[styles.footerBrand, { color: colors.textSecondary }]}
          >
            Green Seasons
          </Text>
          <Text
            style={[styles.footerVersion, { color: colors.textTertiary }]}
          >
            v {appVersion} · Hialeah, FL
          </Text>
        </View>
      </ScrollView>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 110,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
```

- [ ] **Step 2: Run check-all**

Run: `npm run check-all`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/UserProfile.tsx
git commit -m "feat(profile): rewrite UserProfile as orchestrator over new profile components"
```

---

## Task 9: Manual visual verification

**Files:** none (verification only)

This task does not modify code. It exists to make sure the redesign actually looks like the template before opening a PR.

- [ ] **Step 1: Start the dev server and load the profile tab**

Run: `npm start`

Open the app on iOS Simulator (or Android emulator) and a real device if available. Sign in as a restaurant owner with a linked restaurant. Navigate to the Profile tab.

- [ ] **Step 2: Visually compare against the design template**

Open `.design-ref/project/Profile Tab.html` in a browser for reference (the template renders as static HTML). Compare each region:

  - Top bar: "Profile" title left, gear button right, sits above the avatar.
  - Header: 76px gradient avatar with initials, name (22px bold) below, role ("Restaurant Owner" or similar) below name, storefront icon + restaurant name on a single row.
  - Five sections in this order: Account · Orders & Lists · Preferences · Support · (no-title) Sign out · (no-title) Delete account.
  - Footer: "Green Seasons" / "v {version} · Hialeah, FL".

- [ ] **Step 3: Run through interactions**

  - Tap the gear → routes to `/profile/edit`.
  - Tap "Personal info" → routes to `/profile/edit`.
  - Tap "Business details" → toast "Coming soon" appears at top.
  - Tap "Order history" → routes to `/orders`.
  - Tap "My favorites" → routes to `/favorites`. Confirm sublabel shows real item names.
  - Toggle "Delivery updates" → switch animates, persists locally during the session.
  - Toggle "Dark mode" → app theme flips immediately. Toggle again to flip back.
  - Tap "Help center" / "Terms & privacy" → toast "Coming soon".
  - Tap "Sign out" → completes the existing sign-out flow.
  - Tap "Delete account" → confirmation Alert appears (cancel out — do not actually delete).
  - Pull down to refresh → spinner appears, queries refetch.

- [ ] **Step 4: Test edge cases**

  - Sign in as a restaurant owner who has **no** linked restaurant. Confirm the storefront row is hidden.
  - Sign in as a user with **no favorites**. Confirm the favorites row shows "0 items" and sublabel "Tap to start saving items".
  - Toggle dark mode and re-verify everything (cards have a hairline border, no shadow; text is legible).

- [ ] **Step 5: Final check-all and commit if anything was tweaked**

Run: `npm run check-all`
Expected: PASS.

If you tweaked any code during verification, commit those changes:

```bash
git add -A
git commit -m "fix(profile): visual tweaks from manual verification"
```

- [ ] **Step 6: Push the branch and open a PR**

```bash
git push -u origin feature/profile-tab-redesign
```

Open a PR back to `preview` with:
- A short description summarizing the redesign.
- Before/after screenshots (light + dark, iOS).
- A note that no backend was changed and three rows ("Business details", "Help center", "Terms & privacy") surface a "Coming soon" toast pending future work.
