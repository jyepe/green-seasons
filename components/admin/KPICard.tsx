import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/currency';

type KPICardProps = {
  ordersCount: number;
  totalRevenue: number;
  isLoading?: boolean;
};

export function KPICard({
  ordersCount,
  totalRevenue,
  isLoading,
}: KPICardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.kpiBox, { backgroundColor: colors.primary + '15' }]}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="receipt-outline" size={24} color="#fff" />
        </View>
        <View style={styles.kpiContent}>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
            Total Orders
          </Text>
          <Text style={[styles.kpiValue, { color: colors.text }]}>
            {ordersCount.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={[styles.kpiBox, { backgroundColor: colors.accent + '15' }]}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="cash-outline" size={24} color="#fff" />
        </View>
        <View style={styles.kpiContent}>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
            Total Revenue
          </Text>
          <Text style={[styles.kpiValue, { color: colors.text }]}>
            {formatCurrency(totalRevenue)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});
