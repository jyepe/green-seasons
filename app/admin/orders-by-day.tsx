import React from 'react';

import { AnalyticsScreenLayout, OrdersByDayList } from '@/components/admin';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { getAdminChartOrdersByDay } from '@/lib/supabase';
import type { AdminChartOrdersByDay } from '@/lib/supabase';

export default function AdminOrdersByDayScreen() {
  const { monthLabel, query, onRefresh } =
    useAnalyticsData<AdminChartOrdersByDay>({
      queryKey: 'admin-all-orders-by-day',
      queryFn: getAdminChartOrdersByDay,
      limit: -1,
    });

  return (
    <AnalyticsScreenLayout
      title="Orders by Day"
      subtitle={monthLabel}
      isRefreshing={query.isRefetching}
      onRefresh={onRefresh}
    >
      <OrdersByDayList data={query.data ?? []} isLoading={query.isLoading} />
    </AnalyticsScreenLayout>
  );
}
