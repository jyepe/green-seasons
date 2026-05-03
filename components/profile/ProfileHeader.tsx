// components/profile/ProfileHeader.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { ProfileAvatar } from './ProfileAvatar';

type Props = {
  name: string;
  role?: string;
  restaurantName?: string;
  initials: string;
  /** When true, render gray placeholder pills instead of name/role/restaurant text. */
  isLoading?: boolean;
};

/**
 * Centered avatar/name/role/restaurant block for the profile screen.
 * Designed to live INSIDE the ScrollView (so it scrolls with sections).
 * The pinned top bar lives in `ProfileTopBar`, rendered above the ScrollView.
 */
export function ProfileHeader({
  name,
  role,
  restaurantName,
  initials,
  isLoading,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.center}>
      {isLoading ? (
        <View
          style={[styles.avatarSkeleton, { backgroundColor: colors.border }]}
        />
      ) : (
        <ProfileAvatar initials={initials} size={76} />
      )}
      <View style={styles.nameBlock}>
        {isLoading ? (
          <>
            <View
              style={[styles.skeletonName, { backgroundColor: colors.border }]}
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
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {role ? (
              <Text
                style={[styles.role, { color: colors.textSecondary }]}
                numberOfLines={1}
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
                  style={[styles.restaurant, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {restaurantName}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
    fontWeight: '400',
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
  avatarSkeleton: {
    width: 76,
    height: 76,
    borderRadius: 38,
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
