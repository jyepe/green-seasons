import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { AdminChartOrdersByDay } from '@/lib/supabase';

type OrdersByDayChartProps = {
  data: AdminChartOrdersByDay[];
  isLoading?: boolean;
  onViewAll?: () => void;
};

export function OrdersByDayChart({
  data,
  isLoading,
  onViewAll,
}: OrdersByDayChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const parseLocalDate = (dayStr: string) => {
    const [y, m, d] = dayStr.split('-').map(Number);
    return new Date(y, m - 1, d); // local midnight
  };

  const formatDate = (dayStr: string) => {
    const date = parseLocalDate(dayStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No order data for this period
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.map((item, index) => (
        <View
          key={item.day}
          style={[
            styles.dayRow,
            index < data.length - 1 && {
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.dayLabel, { color: colors.text }]}>
            {formatDate(item.day)}
          </Text>
          <Text style={[styles.ordersValue, { color: colors.text }]}>
            {item.orders_count} {item.orders_count === 1 ? 'order' : 'orders'}
          </Text>
        </View>
      ))}

      {onViewAll && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.primary }]}
          onPress={onViewAll}
          accessibilityLabel="View all days"
          accessibilityRole="button"
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All Days
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  dayLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  ordersValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
