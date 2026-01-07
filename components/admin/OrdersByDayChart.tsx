import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle, matchFont } from '@shopify/react-native-skia';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { AdminChartOrdersByDay } from '@/lib/supabase';

const fontFamily = Platform.select({ ios: 'Helvetica', default: 'sans-serif' });
const fontStyle = {
  fontFamily,
  fontSize: 11,
  fontWeight: '400' as const,
};
const font = matchFont(fontStyle);

type OrdersByDayChartProps = {
  data: AdminChartOrdersByDay[];
  isLoading?: boolean;
};

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = 32;
const CHART_WIDTH = width - HORIZONTAL_PADDING * 2;
const CHART_HEIGHT = 200;

export function OrdersByDayChart({ data, isLoading }: OrdersByDayChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state, isActive } = useChartPressState({
    x: 0,
    y: { orders_count: 0 },
  });

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
          <Text
            style={[
              styles.tooltipText,
              {
                color: colors.text,
                backgroundColor:
                  colorScheme === 'dark'
                    ? 'rgba(0,0,0,0.9)'
                    : 'rgba(255,255,255,0.9)',
              },
            ]}
          >
            {(() => {
              const rawIndex = state.x.value.value;
              const safeIndex = Number.isFinite(rawIndex)
                ? Math.min(
                    chartData.length - 1,
                    Math.max(0, Math.round(rawIndex))
                  )
                : 0;
              const label = chartData[safeIndex]?.label ?? '';
              const value = state.y.orders_count.value.value;
              return `${label}: ${value.toFixed(0)} orders`;
            })()}
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
          font,
          tickCount: { x: Math.min(6, data.length), y: 5 },
          formatXLabel: value => chartData[Math.round(value)]?.label ?? '',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
