import React from 'react';

import { SimpleDataList, SimpleListItem } from './AnalyticsScreenLayout';

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
  // Map data to SimpleListItem format
  const listData: SimpleListItem[] = data.map(item => ({
    id: item.day,
    label: formatDate(item.day),
    value: `${item.orders_count} ${item.orders_count === 1 ? 'order' : 'orders'}`,
  }));

  return (
    <SimpleDataList
      data={listData}
      isLoading={isLoading}
      onViewAll={onViewAll}
      emptyMessage="No order data for this period"
      viewAllText="View All Days"
    />
  );
}
