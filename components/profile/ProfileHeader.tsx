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
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
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
      <View style={[styles.center, { paddingTop: insets.top + 64 }]}>
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
                <Text style={[styles.role, { color: colors.textSecondary }]}>
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
