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
    colorScheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(17,24,39,0.03)';

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
          style={[styles.label, { color: danger ? colors.error : colors.text }]}
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
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
});
