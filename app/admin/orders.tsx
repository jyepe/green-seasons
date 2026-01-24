import { AdminOrderListItem } from '@/components/AdminOrderListItem';
import { FilterStatus, OrderListLayout } from '@/components/OrderListItem';
import { getAdminOrders } from '@/lib/supabase';
import { useInfiniteQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

const ORDERS_PAGE_SIZE = 50;

export default function AdminOrdersScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  // Calculate date range - show all orders from the beginning
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(0); // Beginning of time
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1); // End of current month
    return { start, end };
  }, []);

  // Orders Query with cursor-based pagination
  const ordersQuery = useInfiniteQuery({
    queryKey: [
      'admin-all-orders',
      activeFilter === 'all' ? null : activeFilter,
    ],
    queryFn: async ({ pageParam = null }) => {
      return getAdminOrders(
        dateRange.start,
        dateRange.end,
        ORDERS_PAGE_SIZE,
        pageParam as { created_at: string; id: string } | null,
        null, // restaurantId filter
        activeFilter === 'all' ? null : activeFilter
      );
    },
    initialPageParam: null as { created_at: string; id: string } | null,
    getNextPageParam: lastPage => {
      return lastPage.nextCursor;
    },
    staleTime: 5000, // 5 seconds - refetch on mount if data is stale
  });

  const allOrders = useMemo(
    () => ordersQuery.data?.pages.flatMap(page => page.orders) ?? [],
    [ordersQuery.data]
  );

  const filteredOrders = useMemo(() => {
    // Filtering is handled server-side via `activeFilter` in `getAdminOrders`.
    // We keep this alias for clarity and potential future client-side filters.
    return allOrders;
  }, [allOrders]);

  const loadMore = () => {
    if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
      ordersQuery.fetchNextPage();
    }
  };

  return (
    <OrderListLayout
      title="All Orders"
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      isLoading={ordersQuery.isLoading && allOrders.length === 0}
      data={filteredOrders}
      renderItem={({ item }) => <AdminOrderListItem order={item} />}
      keyExtractor={item => item.order_id}
      onEndReached={loadMore}
      isFetchingNextPage={ordersQuery.isFetchingNextPage}
      emptyMessage="No orders found in the database."
    />
  );
}
