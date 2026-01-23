import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnalyticsDataList } from './AnalyticsScreenLayout';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import type { AdminTopItem } from '@/lib/supabase';
import { formatCurrency } from '@/utils/currency';

type TopItemsCardProps = {
  items: AdminTopItem[];
  isLoading?: boolean;
  onViewAll?: () => void;
};

export function TopItemsCard({
  items,
  isLoading,
  onViewAll,
}: TopItemsCardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      {/* Header - Only show if we have items and not loading */}
      {!isLoading && items.length > 0 && (
        <View style={[styles.row, styles.headerRow]}>
          <Text
            style={[
              styles.headerCell,
              styles.rankCell,
              { color: colors.textSecondary },
            ]}
          >
            #
          </Text>
          <Text
            style={[
              styles.headerCell,
              styles.nameCell,
              { color: colors.textSecondary },
            ]}
          >
            Item
          </Text>
          <Text
            style={[
              styles.headerCell,
              styles.qtyCell,
              { color: colors.textSecondary },
            ]}
          >
            Qty
          </Text>
          <Text
            style={[
              styles.headerCell,
              styles.revenueCell,
              { color: colors.textSecondary },
            ]}
          >
            Revenue
          </Text>
        </View>
      )}

      <AnalyticsDataList
        data={items}
        isLoading={isLoading}
        onViewAll={onViewAll}
        emptyMessage="No items sold this month"
        viewAllText="View All Items"
        renderItem={(item, index) => (
          <View
            key={item.item_id}
            style={[
              styles.row,
              index < items.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.rankCell}>
              <View
                style={[
                  styles.rankBadge,
                  {
                    backgroundColor:
                      index === 0
                        ? colors.primary
                        : index === 1
                          ? colors.accent
                          : colors.textTertiary,
                  },
                ]}
              >
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
            </View>
            <View style={styles.nameCell}>
              <Text
                style={[styles.itemName, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.item_name}
              </Text>
              <Text style={[styles.itemUnit, { color: colors.textSecondary }]}>
                per {item.unit}
              </Text>
            </View>
            <Text style={[styles.cell, styles.qtyCell, { color: colors.text }]}>
              {item.quantity.toLocaleString()}
            </Text>
            <Text
              style={[
                styles.cell,
                styles.revenueCell,
                { color: colors.primary },
              ]}
            >
              {formatCurrency(
                (item.final_revenue ?? 0) > 0
                  ? item.final_revenue!
                  : item.revenue
              )}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerRow: {
    paddingVertical: 8,
  },
  cell: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  headerCell: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rankCell: {
    width: 36,
    alignItems: 'center',
  },
  nameCell: {
    flex: 1,
    paddingRight: 8,
  },
  qtyCell: {
    width: 60,
    textAlign: 'right',
  },
  revenueCell: {
    width: 80,
    textAlign: 'right',
    fontFamily: 'Inter_600SemiBold',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  itemUnit: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
