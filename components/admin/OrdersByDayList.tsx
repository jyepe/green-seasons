import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnalyticsDataList } from './AnalyticsScreenLayout';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import type { AdminChartOrdersByDay } from '@/lib/supabase';
import { formatDate } from '@/lib/utils/dateUtils';

type OrdersByDayListProps = {
  data: AdminChartOrdersByDay[];
  isLoading?: boolean;
  onViewAll?: () => void;
};

export function OrdersByDayList({
  data,
  isLoading,
  onViewAll,
}: OrdersByDayListProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <AnalyticsDataList
      data={data}
      isLoading={isLoading}
      onViewAll={onViewAll}
      emptyMessage="No order data for this period"
      viewAllText="View All Days"
      renderItem={(item, index) => (
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
      )}
    />
  );
}

const styles = StyleSheet.create({
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
});
