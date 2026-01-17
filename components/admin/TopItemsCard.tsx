import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No items sold this month
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Items */}
      {items.map((item, index) => (
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
            style={[styles.cell, styles.revenueCell, { color: colors.primary }]}
          >
            {formatCurrency(
              (item.final_revenue ?? 0) > 0 ? item.final_revenue! : item.revenue
            )}
          </Text>
        </View>
      ))}

      {onViewAll && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.primary }]}
          onPress={onViewAll}
          accessibilityLabel="View all items"
          accessibilityRole="button"
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All Items
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  loadingContainer: {
    height: 150,
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
