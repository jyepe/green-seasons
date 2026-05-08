import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight } from '@/constants/Typography';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';

interface KPICardProps {
  value: number;
  label: string;
  accentColor: string;
}

function KPICard({ value, label, accentColor }: KPICardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  return (
    <View
      style={[
        styles.card,
        Shadow.sm,
        { backgroundColor: colors.surface, borderLeftColor: accentColor },
      ]}
    >
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export interface OrderHistoryKPIRowProps {
  thisMonth: number;
  pending: number;
  inTransit: number;
}

export function OrderHistoryKPIRow({ thisMonth, pending, inTransit }: OrderHistoryKPIRowProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  return (
    <View style={styles.row}>
      <KPICard value={thisMonth} label="THIS MONTH" accentColor={colors.primary} />
      <KPICard value={pending} label="PENDING" accentColor={colors.warning} />
      <KPICard value={inTransit} label="IN TRANSIT" accentColor={colors.info} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.s3,
    paddingHorizontal: Spacing.s5,
    paddingBottom: Spacing.s3,
  },
  card: {
    flex: 1,
    borderLeftWidth: 4,
    borderRadius: Radius.md,
    padding: Spacing.s3,
  },
  value: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
  },
  label: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.s1,
    letterSpacing: 0.5,
  },
});
