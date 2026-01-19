import { EmployeeOrderListItem } from '@/components/employee';
import {
  FILTER_LABELS,
  FilterStatus,
  OrderFilterChip,
  OrderListEmptyState,
} from '@/components/OrderListItem';
import { LoadingView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { getEmployeeOrders } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';

const ORDERS_PAGE_SIZE = 25;

export default function EmployeeOrdersScreen() {
  const router = useRouter();
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          All Orders
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {(Object.keys(FILTER_LABELS) as FilterStatus[]).map(status => (
            <OrderFilterChip
              key={status}
              label={FILTER_LABELS[status]}
              isActive={activeFilter === status}
              onPress={() => setActiveFilter(status)}
              colors={colors}
            />
          ))}
        </ScrollView>
      </View>

      {/* Restaurant Filter Chips */}
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

      {/* Orders List */}
      {ordersQuery.isLoading && allOrders.length === 0 ? (
        <LoadingView message="Loading orders..." />
      ) : filteredOrders.length === 0 ? (
        <OrderListEmptyState
          activeFilter={activeFilter}
          onClearFilter={() => {
            setActiveFilter('all');
            setActiveRestaurant('all');
          }}
          message={
            activeFilter === 'all' && activeRestaurant === 'all'
              ? 'No orders assigned to you yet.'
              : 'No orders found matching the selected filters.'
          }
          showClearButton={activeFilter !== 'all' || activeRestaurant !== 'all'}
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <EmployeeOrderListItem order={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            ordersQuery.isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  listContent: {
    padding: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
