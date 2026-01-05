import { EmployeeOrderListItem } from '@/components/employee';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getEmployeeOrders } from '@/lib/supabase';
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
import { useInfiniteQuery } from '@tanstack/react-query';

type OrderStatus = 'pending' | 'in_transit' | 'delivered';
type FilterStatus = 'all' | OrderStatus;

const FILTER_LABELS: Record<FilterStatus, string> = {
  all: 'All',
  pending: 'Pending',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

const ORDERS_PAGE_SIZE = 25;

export default function EmployeeOrdersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

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

  const allOrders = useMemo(
    () => ordersQuery.data?.pages.flatMap(page => page.orders) ?? [],
    [ordersQuery.data]
  );

  // Client-side filtering since the RPC doesn't support status filter
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') {
      return allOrders;
    }
    return allOrders.filter(order => order.status === activeFilter);
  }, [allOrders, activeFilter]);

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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading orders...
          </Text>
        </View>
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
              ? 'No orders assigned to you yet.'
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
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
