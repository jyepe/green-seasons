import React from 'react';

import { SimpleDataList } from './AnalyticsScreenLayout';

import type { AdminChartOrdersByDay } from '@/lib/supabase';
import { formatDate } from '@/lib/utils/dateUtils';

type OrdersByDayListProps = {
  data: AdminChartOrdersByDay[];
  isLoading?: boolean;
  onViewAll?: () => void;
};

/**
 * Renders a list of days with their order counts.
 * Uses SimpleDataList to consolidate UI logic.
 */
export function OrdersByDayList({
  data,
  isLoading,
  onViewAll,
}: OrdersByDayListProps) {
  return (
    <SimpleDataList
      data={data}
      isLoading={isLoading}
      onViewAll={onViewAll}
      emptyMessage="No order data for this period"
      viewAllText="View All Days"
      mapItem={item => ({
        id: item.day,
        label: formatDate(item.day),
        value: `${item.orders_count} ${item.orders_count === 1 ? 'order' : 'orders'}`,
      })}
    />
  );
}
