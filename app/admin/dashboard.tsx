import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  ExpandableCard,
  KPICard,
  OrdersByDayChart,
  OrdersCard,
  RevenueByDayChart,
  RevenueByRestaurantChart,
  TopItemsCard,
} from '@/components/admin';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  getAdminChartOrdersByDay,
  getAdminChartRevenueByDay,
  getAdminChartRevenueByRestaurant,
  getAdminMonthKPIs,
  getAdminOrders,
  getAdminTopItems,
  signOutUser,
} from '@/lib/supabase';

const ORDERS_PAGE_SIZE = 10;

export default function AdminDashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Month selection state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Calculate date range for selected month
  const dateRange = useMemo(() => {
    const start = new Date(selectedMonth.year, selectedMonth.month, 1);
    const end = new Date(selectedMonth.year, selectedMonth.month + 1, 1);
    return { start, end };
  }, [selectedMonth]);

  // Format month for display
  const monthLabel = useMemo(() => {
    const date = new Date(selectedMonth.year, selectedMonth.month, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setSelectedMonth(prev => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: newMonth };
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const now = new Date();
    const currentYearMonth = now.getFullYear() * 12 + now.getMonth();
    const selectedYearMonth = selectedMonth.year * 12 + selectedMonth.month;

    // Don't allow going beyond current month
    if (selectedYearMonth >= currentYearMonth) return;

    setSelectedMonth(prev => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: newMonth };
    });
  };

  // Check if we can go to next month
  const canGoNext = useMemo(() => {
    const now = new Date();
    const currentYearMonth = now.getFullYear() * 12 + now.getMonth();
    const selectedYearMonth = selectedMonth.year * 12 + selectedMonth.month;
    return selectedYearMonth < currentYearMonth;
  }, [selectedMonth]);

  // KPIs Query
  const kpisQuery = useQuery({
    queryKey: ['admin-kpis', dateRange.start.toISOString()],
    queryFn: () => getAdminMonthKPIs(dateRange.start, dateRange.end),
  });

  // Top Items Query
  const topItemsQuery = useQuery({
    queryKey: ['admin-top-items', dateRange.start.toISOString()],
    queryFn: () => getAdminTopItems(dateRange.start, dateRange.end, 5),
  });

  // Orders Query
  const ordersQuery = useInfiniteQuery({
    queryKey: ['admin-orders', dateRange.start.toISOString()],
    queryFn: async ({ pageParam = 0 }) => {
      return getAdminOrders(
        dateRange.start,
        dateRange.end,
        ORDERS_PAGE_SIZE,
        pageParam as number
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < ORDERS_PAGE_SIZE) {
        return undefined;
      }
      return allPages.length * ORDERS_PAGE_SIZE;
    },
  });

  const allOrders = useMemo(
    () => ordersQuery.data?.pages.flat() ?? [],
    [ordersQuery.data]
  );

  // Orders by Day Chart Query
  const ordersByDayQuery = useQuery({
    queryKey: ['admin-chart-orders-by-day', dateRange.start.toISOString()],
    queryFn: () => getAdminChartOrdersByDay(dateRange.start, dateRange.end),
  });

  // Revenue by Day Chart Query
  const revenueByDayQuery = useQuery({
    queryKey: ['admin-chart-revenue-by-day', dateRange.start.toISOString()],
    queryFn: () => getAdminChartRevenueByDay(dateRange.start, dateRange.end),
  });

  // Revenue by Restaurant Chart Query
  const revenueByRestaurantQuery = useQuery({
    queryKey: [
      'admin-chart-revenue-by-restaurant',
      dateRange.start.toISOString(),
    ],
    queryFn: () =>
      getAdminChartRevenueByRestaurant(dateRange.start, dateRange.end, 10),
  });

  // Refresh all data
  const onRefresh = useCallback(() => {
    kpisQuery.refetch();
    topItemsQuery.refetch();
    ordersQuery.refetch();
    ordersByDayQuery.refetch();
    revenueByDayQuery.refetch();
    revenueByRestaurantQuery.refetch();
  }, [
    kpisQuery,
    topItemsQuery,
    ordersQuery,
    ordersByDayQuery,
    revenueByDayQuery,
    revenueByRestaurantQuery,
  ]);

  const isRefreshing =
    kpisQuery.isRefetching ||
    topItemsQuery.isRefetching ||
    ordersByDayQuery.isRefetching ||
    ordersQuery.isRefetching;

  // Load more orders
  const loadMoreOrders = () => {
    if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
      ordersQuery.fetchNextPage();
    }
  };

  const hasMoreOrders = !!ordersQuery.hasNextPage;

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error signing out:', error);
      }
      Alert.alert('Logout Failed', 'Unable to sign out. Please try again.', [
        { text: 'OK' },
      ]);
      return;
    }

    // Only navigate if sign out was successful
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Admin Dashboard
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Manage your business
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.error + '15' },
          ]}
          onPress={handleLogout}
          accessibilityLabel="Logout"
          accessibilityRole="button"
          accessibilityHint="Double tap to sign out of your admin account"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Month Selector */}
      <View style={[styles.monthSelector, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={goToPreviousMonth}
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          accessibilityHint="Double tap to view the previous month"
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.monthLabelContainer}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={colors.textSecondary}
          />
          <Text style={[styles.monthLabel, { color: colors.text }]}>
            {monthLabel}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.monthArrow, !canGoNext && styles.monthArrowDisabled]}
          onPress={goToNextMonth}
          disabled={!canGoNext}
          accessibilityLabel="Next month"
          accessibilityRole="button"
          accessibilityHint="Double tap to view the next month"
          accessibilityState={{ disabled: !canGoNext }}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={canGoNext ? colors.primary : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Monthly KPIs */}
        <ExpandableCard title="Monthly Overview" defaultExpanded>
          <KPICard
            ordersCount={kpisQuery.data?.orders_count ?? 0}
            totalRevenue={kpisQuery.data?.total_revenue ?? 0}
            isLoading={kpisQuery.isLoading}
          />
        </ExpandableCard>

        {/* Top 5 Items */}
        <ExpandableCard title="Top Selling Items" defaultExpanded>
          <TopItemsCard
            items={topItemsQuery.data ?? []}
            isLoading={topItemsQuery.isLoading}
          />
        </ExpandableCard>

        {/* Orders by Day Chart */}
        <ExpandableCard title="Orders by Day" defaultExpanded>
          <OrdersByDayChart
            data={ordersByDayQuery.data ?? []}
            isLoading={ordersByDayQuery.isLoading}
          />
        </ExpandableCard>

        {/* Revenue by Day Chart */}
        <ExpandableCard title="Revenue by Day" defaultExpanded>
          <RevenueByDayChart
            data={revenueByDayQuery.data ?? []}
            isLoading={revenueByDayQuery.isLoading}
          />
        </ExpandableCard>

        {/* Revenue by Restaurant Chart */}
        <ExpandableCard title="Revenue by Restaurant" defaultExpanded>
          <RevenueByRestaurantChart
            data={revenueByRestaurantQuery.data ?? []}
            isLoading={revenueByRestaurantQuery.isLoading}
          />
        </ExpandableCard>

        {/* All Orders */}
        <ExpandableCard title="Recent Orders" defaultExpanded>
          <OrdersCard
            orders={allOrders}
            isLoading={ordersQuery.isLoading}
            hasMore={hasMoreOrders}
            onLoadMore={loadMoreOrders}
          />
        </ExpandableCard>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  monthArrow: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthArrowDisabled: {
    opacity: 0.5,
  },
  monthLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  bottomSpacer: {
    height: 32,
  },
});
