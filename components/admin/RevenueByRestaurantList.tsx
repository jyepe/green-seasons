import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import type { AdminChartRevenueByRestaurant } from '@/lib/supabase';

type RevenueByRestaurantListProps = {
  data: AdminChartRevenueByRestaurant[];
  isLoading?: boolean;
  onViewAll?: () => void;
};

export function RevenueByRestaurantList({
  data,
  isLoading,
  onViewAll,
}: RevenueByRestaurantListProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  // Sort by revenue descending to ensure proper ranking even if RPC ordering changes
  const topRestaurants = useMemo(() => {
    return [...data].sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No restaurant data for this period
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {topRestaurants.map((restaurant, index) => (
        <View
          key={restaurant.restaurant_id}
          style={[
            styles.restaurantRow,
            index < topRestaurants.length - 1 && {
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.restaurantInfo}>
            <Text style={[styles.rank, { color: colors.textSecondary }]}>
              #{index + 1}
            </Text>
            <View style={styles.restaurantDetails}>
              <Text style={[styles.restaurantName, { color: colors.text }]}>
                {restaurant.restaurant_name}
              </Text>
              <View style={styles.statsRow}>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Revenue:{' '}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatCurrency(restaurant.revenue)}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: colors.textSecondary, marginLeft: 16 },
                  ]}
                >
                  Orders:{' '}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {restaurant.orders_count}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ))}

      {onViewAll && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.primary }]}
          onPress={onViewAll}
          accessibilityLabel="View all restaurants"
          accessibilityRole="button"
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All Restaurants
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  restaurantRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rank: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginRight: 12,
    minWidth: 32,
  },
  restaurantDetails: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
