import React from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { AdminChartOrdersByDay } from '@/lib/supabase';

type OrdersByDayChartProps = {
  data: AdminChartOrdersByDay[];
  isLoading?: boolean;
};

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;
const CHART_HEIGHT = 200;

export function OrdersByDayChart({ data, isLoading }: OrdersByDayChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state, isActive } = useChartPressState({ x: 0, y: { orders_count: 0 } });

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
          No order data for this period
        </Text>
      </View>
    );
  }

  // Format data for Victory Native
  const chartData = data.map((item, index) => ({
    x: index,
    orders_count: item.orders_count,
    label: new Date(item.day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <View style={styles.container}>
      {isActive && (
        <View style={styles.tooltip}>
          <Text style={[styles.tooltipText, { color: colors.text }]}>
            {chartData[Math.round(state.x.value.value)]?.label}:{' '}
            {state.y.orders_count.value.value.toFixed(0)} orders
          </Text>
        </View>
      )}
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['orders_count']}
        domainPadding={{ left: 20, right: 20, top: 20 }}
        chartPressState={state}
        axisOptions={{
          tickCount: { x: Math.min(6, data.length), y: 5 },
          formatXLabel: (value) => chartData[Math.round(value)]?.label ?? '',
          labelColor: colors.textSecondary,
          lineColor: colors.border,
        }}
      >
        {({ points }) => (
          <>
            <Line
              points={points.orders_count}
              color={colors.primary}
              strokeWidth={2}
              curveType="natural"
            />
            {points.orders_count.map((point, index) => (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y ?? 0}
                r={4}
                color={colors.primary}
              />
            ))}
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
  },
  loadingContainer: {
    height: CHART_HEIGHT,
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
