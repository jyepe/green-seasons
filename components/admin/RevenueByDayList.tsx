import React from 'react';

import { SimpleDataList } from './AnalyticsScreenLayout';

import type { AdminChartRevenueByDay } from '@/lib/supabase';
import { formatDate } from '@/lib/utils/dateUtils';
import { formatCurrency } from '@/utils/currency';

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
        value: formatCurrency(item.final_revenue || item.revenue),
      })}
    />
  );
}
