import React from 'react';

import {
  AnalyticsScreenLayout,
  RevenueByRestaurantList,
} from '@/components/admin';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { getAdminChartRevenueByRestaurant } from '@/lib/supabase';
import type { AdminChartRevenueByRestaurant } from '@/lib/supabase';

export default function AdminRestaurantsScreen() {
  const { monthLabel, query, onRefresh } =
    useAnalyticsData<AdminChartRevenueByRestaurant>({
      queryKey: 'admin-all-restaurants',
      queryFn: getAdminChartRevenueByRestaurant,
      limit: -1,
    });

  return (
    <AnalyticsScreenLayout
      title="All Restaurants"
      subtitle={monthLabel}
      isRefreshing={query.isRefetching}
      onRefresh={onRefresh}
      contentPadding={false}
    >
      <RevenueByRestaurantList
        data={query.data ?? []}
        isLoading={query.isLoading}
      />
    </AnalyticsScreenLayout>
  );
}
