import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  /** '24' | '$3.2K' | '…' */
  value: string;
  /** '↑ 12% vs Apr' | 'No orders yet' | undefined */
  sub?: string;
  /** When true, omits sub and renders a skeleton bar in its place. */
  isLoading?: boolean;
};

export function KpiTile({
  icon,
  iconColor,
  label,
  value,
  sub,
  isLoading,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        },
        !isDark && styles.tileShadow,
      ]}
    >
      <View style={[styles.iconChip, { backgroundColor: iconColor + '1F' }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      {isLoading ? (
        <View
          style={[styles.subSkeleton, { backgroundColor: colors.border }]}
        />
      ) : sub ? (
        <Text style={[styles.sub, { color: colors.textTertiary }]}>{sub}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    padding: 14,
  },
  tileShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
    lineHeight: 22,
    marginTop: 10,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  sub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  subSkeleton: {
    width: 80,
    height: 10,
    borderRadius: 4,
    marginTop: 4,
  },
});
