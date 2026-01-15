import { AdminOrderListItem } from '@/components/AdminOrderListItem';
import {
  FilterStatus,
  OrderFilterTabs,
  OrderListEmptyState,
} from '@/components/OrderListItem';
import { LoadingView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { getAdminOrders } from '@/lib/supabase';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORDERS_PAGE_SIZE = 50;

export default function AdminOrdersScreen() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

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

      {/* Filter Tabs */}
      <OrderFilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Orders List */}
      {ordersQuery.isLoading && allOrders.length === 0 ? (
        <LoadingView message="Loading orders..." />
      ) : filteredOrders.length === 0 ? (
        <OrderListEmptyState
          activeFilter={activeFilter}
          onClearFilter={() => setActiveFilter('all')}
          emptyMessageAll="No orders found in the database."
        />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.order_id}
          renderItem={({ item }) => <AdminOrderListItem order={item} />}
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
  listContent: {
    padding: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
