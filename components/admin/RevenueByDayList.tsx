import React from 'react';

import { SimpleDataList } from './AnalyticsScreenLayout';

import type { AdminChartRevenueByDay } from '@/lib/supabase';
import { formatDate } from '@/lib/utils/dateUtils';

type RevenueByDayListProps = {
  data: AdminChartRevenueByDay[];
  isLoading?: boolean;
  onViewAll?: () => void;
};

/**
 * Renders a list of days with their revenue.
 * Uses SimpleDataList to consolidate UI logic.
 */
export function RevenueByDayList({
  data,
  isLoading,
  onViewAll,
}: RevenueByDayListProps) {
  return (
    <SimpleDataList
      data={data}
      isLoading={isLoading}
      onViewAll={onViewAll}
      emptyMessage="No revenue data for this period"
      viewAllText="View All Days"
      mapItem={item => ({
        id: item.day,
        label: formatDate(item.day),
        value: `$${(item.final_revenue || item.revenue).toFixed(2)}`,
      })}
    />
  );
}
