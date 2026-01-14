import { AdminOrderListItem } from '@/components/AdminOrderListItem';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { getAdminOrders, OrderStatus } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { LoadingView } from '@/components/ThemedView';
import { useInfiniteQuery } from '@tanstack/react-query';

type FilterStatus = 'all' | OrderStatus;

const FILTER_LABELS: Record<FilterStatus, string> = {
  all: 'All',
  pending: 'Pending',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

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
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {(Object.keys(FILTER_LABELS) as FilterStatus[]).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                activeFilter === status && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
                activeFilter !== status && {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setActiveFilter(status)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === status
                    ? { color: 'white' }
                    : { color: colors.textSecondary },
                ]}
              >
                {FILTER_LABELS[status]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {ordersQuery.isLoading && allOrders.length === 0 ? (
        <LoadingView message="Loading orders..." />
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={
              activeFilter === 'all' ? 'cube-outline' : 'filter-circle-outline'
            }
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            No Orders Found
          </Text>
          <Text
            style={[styles.emptyStateText, { color: colors.textSecondary }]}
          >
            {activeFilter === 'all'
              ? 'No orders found in the database.'
              : `No orders found with status "${FILTER_LABELS[activeFilter]}".`}
          </Text>
          {activeFilter !== 'all' && (
            <TouchableOpacity
              style={[
                styles.clearFilterButton,
                { borderColor: colors.primary },
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text
                style={[
                  styles.clearFilterButtonText,
                  { color: colors.primary },
                ]}
              >
                Clear Filter
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  filterContainer: {
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearFilterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearFilterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
