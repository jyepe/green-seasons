import React from 'react';

import { AnalyticsScreenLayout, TopItemsCard } from '@/components/admin';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { getAdminTopItems } from '@/lib/supabase';
import type { AdminTopItem } from '@/lib/supabase';

export default function AdminTopItemsScreen() {
  const { monthLabel, query, onRefresh } = useAnalyticsData<AdminTopItem>({
    queryKey: 'admin-all-top-items',
    queryFn: getAdminTopItems,
    limit: -1,
  });

  return (
    <AnalyticsScreenLayout
      title="Top Selling Items"
      subtitle={monthLabel}
      isRefreshing={query.isRefetching}
      onRefresh={onRefresh}
    >
      <TopItemsCard
        items={query.data ?? []}
        isLoading={query.isLoading}
      />
    </AnalyticsScreenLayout>
  );
}
