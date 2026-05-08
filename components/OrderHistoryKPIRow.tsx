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
  backgroundColor: string;
  textColor: string;
  textSecondaryColor: string;
}

function KPICard({ value, label, accentColor, backgroundColor, textColor, textSecondaryColor }: KPICardProps) {
  return (
    <View
      style={[
        styles.card,
        Shadow.sm,
        { backgroundColor, borderLeftColor: accentColor },
      ]}
    >
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
      <Text style={[styles.label, { color: textSecondaryColor }]}>{label}</Text>
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
      <KPICard
        value={thisMonth}
        label="THIS MONTH"
        accentColor={colors.primary}
        backgroundColor={colors.surface}
        textColor={colors.text}
        textSecondaryColor={colors.textSecondary}
      />
      <KPICard
        value={pending}
        label="PENDING"
        accentColor={colors.warning}
        backgroundColor={colors.surface}
        textColor={colors.text}
        textSecondaryColor={colors.textSecondary}
      />
      <KPICard
        value={inTransit}
        label="IN TRANSIT"
        accentColor={colors.info}
        backgroundColor={colors.surface}
        textColor={colors.text}
        textSecondaryColor={colors.textSecondary}
      />
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
