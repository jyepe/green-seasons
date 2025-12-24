import React from 'react';
import { ActivityIndicator, Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { CartesianChart, Area, useChartPressState } from 'victory-native';
import { matchFont } from '@shopify/react-native-skia';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { AdminChartRevenueByDay } from '@/lib/supabase';

const fontFamily = Platform.select({ ios: 'Helvetica', default: 'sans-serif' });
const fontStyle = {
  fontFamily,
  fontSize: 11,
  fontWeight: '400' as const,
};
const font = matchFont(fontStyle);

type RevenueByDayChartProps = {
  data: AdminChartRevenueByDay[];
  isLoading?: boolean;
};

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;
const CHART_HEIGHT = 200;

export function RevenueByDayChart({ data, isLoading }: RevenueByDayChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state, isActive } = useChartPressState({ x: 0, y: { revenue: 0 } });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No revenue data for this period
        </Text>
      </View>
    );
  }

  // Format data for Victory Native
  const chartData = data.map((item, index) => ({
    x: index,
    revenue: item.revenue,
    label: new Date(item.day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <View style={styles.container}>
      {isActive && (
        <View style={styles.tooltip}>
          <Text style={[styles.tooltipText, { color: colors.text }]}>
            {chartData[Math.round(state.x.value.value)]?.label}:{' '}
            {formatCurrency(state.y.revenue.value.value)}
          </Text>
        </View>
      )}
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['revenue']}
        domainPadding={{ left: 20, right: 20, top: 20 }}
        chartPressState={state}
        axisOptions={{
          font,
          tickCount: { x: Math.min(6, data.length), y: 5 },
          formatXLabel: (value) => chartData[Math.round(value)]?.label ?? '',
          formatYLabel: formatCurrency,
          labelColor: colors.textSecondary,
          lineColor: colors.border,
        }}
      >
        {({ points }) => (
          <Area
            points={points.revenue}
            y0={CHART_HEIGHT - 40}
            color={colors.accent}
            curveType="natural"
            opacity={0.3}
          />
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
