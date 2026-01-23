import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnalyticsDataList } from './AnalyticsScreenLayout';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import type { AdminOrder, OrderStatus } from '@/lib/supabase';
import { formatCurrency } from '@/utils/currency';

type OrdersCardProps = {
  orders: AdminOrder[];
  isLoading?: boolean;
  onViewAll?: () => void;
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { label: 'Pending', icon: 'time-outline' },
  in_transit: { label: 'In Transit', icon: 'car-outline' },
  delivered: { label: 'Delivered', icon: 'checkmark-circle-outline' },
};

export function OrdersCard({ orders, isLoading, onViewAll }: OrdersCardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    return colors.orderStatus[status] ?? colors.textSecondary;
  };

  return (
    <AnalyticsDataList
      data={orders}
      isLoading={isLoading}
      onViewAll={onViewAll}
      emptyMessage="No orders found"
      viewAllText="View All Orders"
      renderItem={(order, index) => {
        const statusConfig = STATUS_CONFIG[order.status];
        const statusColor = getStatusColor(order.status);
        const buyerName =
          order.buyer_first_name || order.buyer_last_name
            ? `${order.buyer_first_name ?? ''} ${order.buyer_last_name ?? ''}`.trim()
            : 'Unknown';

        const isFinalized = order.final_total_amount > 0;

        return (
          <View
            key={order.order_id}
            style={[
              styles.orderRow,
              index < orders.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={[styles.restaurantName, { color: colors.text }]}>
                  {order.restaurant_name}
                </Text>
                <Text
                  style={[styles.buyerName, { color: colors.textSecondary }]}
                >
                  by {buyerName}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor + '20' },
                ]}
              >
                <Ionicons
                  name={statusConfig.icon}
                  size={14}
                  color={statusColor}
                />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.detailItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.detailText, { color: colors.textSecondary }]}
                >
                  {formatDate(order.created_at)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="cube-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.detailText, { color: colors.textSecondary }]}
                >
                  {order.items_count} items
                </Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[styles.totalAmount, { color: colors.primary }]}>
                  {formatCurrency(
                    isFinalized ? order.final_total_amount : order.total_amount
                  )}
                </Text>
                {!isFinalized && (
                  <Text
                    style={[
                      styles.disclaimerText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Price not finalized
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  orderRow: {
    paddingVertical: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  restaurantName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  buyerName: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  amountContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  disclaimerText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
});
