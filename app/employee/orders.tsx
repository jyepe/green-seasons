import { EmployeeOrderListItem } from '@/components/employee';
import {
  FilterStatus,
  OrderFilterChip,
  OrderListLayout,
} from '@/components/OrderListItem';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { getEmployeeOrders } from '@/lib/supabase';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';

const ORDERS_PAGE_SIZE = 25;

export default function EmployeeOrdersScreen() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [activeRestaurant, setActiveRestaurant] = useState<string | 'all'>(
    'all'
  );

  // Orders Query with cursor-based pagination
  const ordersQuery = useInfiniteQuery({
    queryKey: ['employee-all-orders'],
    queryFn: async ({ pageParam = null }) => {
      return getEmployeeOrders(
        ORDERS_PAGE_SIZE,
        pageParam as { created_at: string; id: string } | null
      );
    },
    initialPageParam: null as { created_at: string; id: string } | null,
    getNextPageParam: lastPage => lastPage.nextCursor,
  });

  // Refresh orders when screen comes into focus to reflect latest statuses
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['employee-all-orders'] });
    }, [queryClient])
  );

  const allOrders = useMemo(
    () => ordersQuery.data?.pages.flatMap(page => page.orders) ?? [],
    [ordersQuery.data]
  );

  const restaurantOptions = useMemo(() => {
    const names = Array.from(
      new Set(allOrders.map(order => order.restaurant_name).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return names;
  }, [allOrders]);

  // Client-side filtering since the RPC doesn't support status or restaurant filter
  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      const matchesStatus =
        activeFilter === 'all' || order.status === activeFilter;
      const matchesRestaurant =
        activeRestaurant === 'all' ||
        order.restaurant_name === activeRestaurant;
      return matchesStatus && matchesRestaurant;
    });
  }, [allOrders, activeFilter, activeRestaurant]);

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
      renderItem={({ item }) => <EmployeeOrderListItem order={item} />}
      keyExtractor={item => item.id}
      onEndReached={loadMore}
      isFetchingNextPage={ordersQuery.isFetchingNextPage}
      extraFilterContent={
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <OrderFilterChip
              key="all-restaurants"
              label="All Restaurants"
              isActive={activeRestaurant === 'all'}
              onPress={() => setActiveRestaurant('all')}
              colors={colors}
            />

            {restaurantOptions.map(name => (
              <OrderFilterChip
                key={name}
                label={name}
                isActive={activeRestaurant === name}
                onPress={() => setActiveRestaurant(name)}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
      }
      onClearFilter={() => {
        setActiveFilter('all');
        setActiveRestaurant('all');
      }}
      emptyStateMessage={
        activeFilter === 'all' && activeRestaurant === 'all'
          ? 'No orders assigned to you yet.'
          : 'No orders found matching the selected filters.'
      }
      showClearButton={activeFilter !== 'all' || activeRestaurant !== 'all'}
    />
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
});
