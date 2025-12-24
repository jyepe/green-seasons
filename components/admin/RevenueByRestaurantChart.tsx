import React from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { CartesianChart, Bar, useChartPressState } from 'victory-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { AdminChartRevenueByRestaurant } from '@/lib/supabase';

type RevenueByRestaurantChartProps = {
  data: AdminChartRevenueByRestaurant[];
  isLoading?: boolean;
};

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;
const BAR_HEIGHT = 40;

export function RevenueByRestaurantChart({
  data,
  isLoading,
}: RevenueByRestaurantChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state, isActive } = useChartPressState({ x: 0, y: { revenue: 0 } });

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

  // Format data for Victory Native
  const chartData = data.map((item, index) => ({
    x: index,
    revenue: item.revenue,
    label: item.restaurant_name.length > 12
      ? item.restaurant_name.substring(0, 12) + '...'
      : item.restaurant_name,
  }));

  const chartHeight = Math.max(200, data.length * BAR_HEIGHT + 60);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <View style={[styles.container, { height: chartHeight }]}>
      {isActive && (
        <View style={styles.tooltip}>
          <Text style={[styles.tooltipText, { color: colors.text }]}>
            {data[Math.round(state.x.value.value)]?.restaurant_name}:{' '}
            {formatCurrency(state.y.revenue.value.value)}
          </Text>
        </View>
      )}
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['revenue']}
        domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
        chartPressState={state}
        axisOptions={{
          tickCount: { x: data.length, y: 5 },
          formatXLabel: (value) => chartData[Math.round(value)]?.label ?? '',
          formatYLabel: formatCurrency,
          labelColor: colors.textSecondary,
          lineColor: colors.border,
        }}
      >
        {({ points, chartBounds }) => (
          <Bar
            points={points.revenue}
            chartBounds={chartBounds}
            color={colors.primary}
            roundedCorners={{ topLeft: 4, topRight: 4 }}
          />
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CHART_WIDTH,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  tooltip: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  tooltipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
