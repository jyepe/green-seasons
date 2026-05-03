// components/profile/ProfileTopBar.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  onSettingsPress?: () => void;
};

/**
 * Pinned top bar for the profile screen — sits above the ScrollView so
 * scrolling sections never appear under the device status bar. The bar's
 * background extends behind the status bar via `paddingTop: insets.top`.
 */
export function ProfileTopBar({ onSettingsPress }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.background,
        },
      ]}
    >
      <Text
        style={[styles.title, { color: colors.text }]}
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
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
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
});
