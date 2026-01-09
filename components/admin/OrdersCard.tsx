import { Ionicons } from '@expo/vector-icons';
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
import type { AdminOrder, OrderStatus } from '@/lib/supabase';
import { formatCurrency } from '@/utils/currency';

type OrdersCardProps = {
  orders: AdminOrder[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
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

export function OrdersCard({
  orders,
  isLoading,
  hasMore,
  onLoadMore,
  onViewAll,
}: OrdersCardProps) {
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

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No orders found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {orders.map((order, index) => {
        const statusConfig = STATUS_CONFIG[order.status];
        const statusColor = getStatusColor(order.status);
        const buyerName =
          order.buyer_first_name || order.buyer_last_name
            ? `${order.buyer_first_name ?? ''} ${order.buyer_last_name ?? ''}`.trim()
            : 'Unknown';

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
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                {formatCurrency(order.total_amount)}
              </Text>
            </View>
          </View>
        );
      })}

      {hasMore && (
        <TouchableOpacity
          style={[styles.loadMoreButton, { borderColor: colors.border }]}
          onPress={onLoadMore}
          disabled={isLoading}
          accessibilityLabel="Load more orders"
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.loadMoreText, { color: colors.primary }]}>
              Load More
            </Text>
          )}
        </TouchableOpacity>
      )}

      {onViewAll && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.primary }]}
          onPress={onViewAll}
          accessibilityLabel="View all orders"
          accessibilityRole="button"
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All Orders
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
  totalAmount: {
    marginLeft: 'auto',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  loadMoreButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
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
