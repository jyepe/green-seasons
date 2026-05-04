import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function formatEyebrow(d: Date): string {
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${weekday} · ${monthDay}`;
}

export default function ProductsScreenHeader() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const eyebrow = useMemo(() => formatEyebrow(new Date()), []);

  return (
    <View
      style={styles.header}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`Today's market. ${eyebrow}. Order by 6 PM for next-day delivery.`}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        Today&apos;s market
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Order by 6 PM for next-day delivery.
      </Text>
      <View style={styles.disclaimerRow}>
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={colors.textSecondary}
        />
        <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
          Prices reflect the last finalized day and may change.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
});
