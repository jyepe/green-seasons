import React from 'react';

import { SimpleDataList, SimpleListItem } from './AnalyticsScreenLayout';

import type { AdminChartRevenueByDay } from '@/lib/supabase';
import { formatDate } from '@/utils/dateUtils';

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
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Map data to SimpleListItem format
  const listData: SimpleListItem[] = data.map(item => ({
    id: item.day,
    label: formatDate(item.day),
    value: formatCurrency(item.final_revenue || item.revenue),
  }));

  return (
    <SimpleDataList
      data={listData}
      isLoading={isLoading}
      onViewAll={onViewAll}
      emptyMessage="No revenue data for this period"
      viewAllText="View All Days"
    />
  );
}
