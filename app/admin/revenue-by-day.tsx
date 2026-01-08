import React from 'react';

import { AnalyticsScreenLayout, RevenueByDayChart } from '@/components/admin';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { getAdminChartRevenueByDay } from '@/lib/supabase';
import type { AdminChartRevenueByDay } from '@/lib/supabase';

export default function AdminRevenueByDayScreen() {
  const { monthLabel, query, onRefresh } = useAnalyticsData<AdminChartRevenueByDay>({
    queryKey: 'admin-all-revenue-by-day',
    queryFn: getAdminChartRevenueByDay,
    limit: -1,
  });

  return (
    <AnalyticsScreenLayout
      title="Revenue by Day"
      subtitle={monthLabel}
      isRefreshing={query.isRefetching}
      onRefresh={onRefresh}
    >
      <RevenueByDayChart
        data={query.data ?? []}
        isLoading={query.isLoading}
      />
    </AnalyticsScreenLayout>
  );
}
