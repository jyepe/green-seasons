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
