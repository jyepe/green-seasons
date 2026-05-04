// components/dashboard/RecentOrderRow.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import {
  STATUS_CONFIG,
  formatDate,
  getStatusColor,
} from '@/components/OrderListItem';
import { formatCurrency } from '@/utils/currency';
import type { Order } from '@/lib/supabase';

type Props = {
  order: Order;
  /** When true, suppresses the bottom hairline divider. */
  isLast: boolean;
  onPress: () => void;
};

export function RecentOrderRow({ order, isLast, onPress }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const statusColor = getStatusColor(order.status, colors);
  const total = order.final_total_amount ?? order.total_amount ?? 0;
  const dateLabel = formatDate(order.delivery_at ?? order.created_at);

  return (
    <TouchableOpacity
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.id.slice(0, 8)}, ${
        STATUS_CONFIG[order.status].label
      }, ${dateLabel}, ${formatCurrency(total)}`}
      activeOpacity={0.7}
    >
      <View style={[styles.iconTile, { backgroundColor: statusColor + '1F' }]}>
        <Ionicons
          name={STATUS_CONFIG[order.status].icon}
          size={18}
          color={statusColor}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.id, { color: colors.text }]} numberOfLines={1}>
            #{order.id.slice(0, 8)}
          </Text>
          <Text style={[styles.total, { color: colors.text }]}>
            {formatCurrency(total)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.meta, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {dateLabel}
          </Text>
          <Text style={[styles.reorder, { color: colors.primary }]}>
            Reorder
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  id: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  total: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
  reorder: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
