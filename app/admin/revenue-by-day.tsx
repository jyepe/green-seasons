import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { RevenueByDayChart } from '@/components/admin';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getAdminChartRevenueByDay } from '@/lib/supabase';

export default function AdminRevenueByDayScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Get month data from URL params (passed from dashboard)
  const { year, month } = useLocalSearchParams<{
    year: string;
    month: string;
  }>();

  // Parse params with fallback to current month
  const selectedMonth = useMemo(() => {
    const now = new Date();
    return {
      year: year ? parseInt(year, 10) : now.getFullYear(),
      month: month ? parseInt(month, 10) : now.getMonth(),
    };
  }, [year, month]);

  // Calculate date range for selected month
  const dateRange = useMemo(() => {
    const now = new Date();
    const start = new Date(selectedMonth.year, selectedMonth.month, 1);
    const isCurrentMonth =
      selectedMonth.year === now.getFullYear() &&
      selectedMonth.month === now.getMonth();

    // If viewing current month, set end to start of tomorrow to include all of today
    // Otherwise, go to start of next month
    const end = isCurrentMonth
      ? new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
          0,
          0,
          0,
          0
        )
      : new Date(selectedMonth.year, selectedMonth.month + 1, 1);

    return { start, end };
  }, [selectedMonth]);

  // Format month for display
  const monthLabel = useMemo(() => {
    const date = new Date(selectedMonth.year, selectedMonth.month, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // All Revenue by Day Query - pass -1 to get all days
  const revenueByDayQuery = useQuery({
    queryKey: ['admin-all-revenue-by-day', dateRange.start.toISOString()],
    queryFn: () =>
      getAdminChartRevenueByDay(dateRange.start, dateRange.end, -1),
  });

  // Refresh data
  const onRefresh = () => {
    revenueByDayQuery.refetch();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
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
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Revenue by Day
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {monthLabel}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={revenueByDayQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <RevenueByDayChart
          data={revenueByDayQuery.data ?? []}
          isLoading={revenueByDayQuery.isLoading}
        />

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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  bottomSpacer: {
    height: 32,
  },
});
