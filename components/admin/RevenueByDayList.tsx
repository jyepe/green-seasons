import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnalyticsDataList } from './AnalyticsScreenLayout';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import type { AdminChartRevenueByDay } from '@/lib/supabase';
import { formatDate } from '@/lib/utils/dateUtils';

type RevenueByDayListProps = {
  data: AdminChartRevenueByDay[];
  isLoading?: boolean;
  onViewAll?: () => void;
};

export function RevenueByDayList({
  data,
  isLoading,
  onViewAll,
}: RevenueByDayListProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <AnalyticsDataList
      data={data}
      isLoading={isLoading}
      onViewAll={onViewAll}
      emptyMessage="No revenue data for this period"
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
          <Text style={[styles.revenueValue, { color: colors.text }]}>
            {formatCurrency(item.final_revenue || item.revenue)}
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
  revenueValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
