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
import { useColorScheme } from '@/hooks/useColorScheme';
import type { EmployeeOrder } from '@/lib/supabase';
import { formatCurrency } from '@/utils/currency';

type OrderStatus = 'pending' | 'in_transit' | 'delivered';

type EmployeeOrdersCardProps = {
  orders: EmployeeOrder[];
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

export function EmployeeOrdersCard({
  orders,
  isLoading,
  onViewAll,
}: EmployeeOrdersCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const orderStatus = status as OrderStatus;
    return colors.orderStatus[orderStatus] ?? colors.textSecondary;
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
        const status = order.status as OrderStatus;
        const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
        const statusColor = getStatusColor(order.status);

        return (
          <View
            key={order.id}
            style={[
              styles.orderRow,
              index < orders.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.orderInfo}>
              <Text style={[styles.restaurantName, { color: colors.text }]}>
                Order #{order.id.slice(0, 8)}
              </Text>
            </View>
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={[styles.restaurantName, { color: colors.text }]}>
                  {order.restaurant_name}
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

            <View style={styles.datesRow}>
              <View style={styles.detailItem}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.detailText, { color: colors.textSecondary }]}
                >
                  Created: {formatDate(order.created_at)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.detailText, { color: colors.textSecondary }]}
                >
                  Delivery: {formatDate(order.delivery_at)}
                </Text>
              </View>
            </View>

            <View style={styles.orderFooter}>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                Total: {formatCurrency(order.total)}
              </Text>
            </View>
          </View>
        );
      })}

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
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
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
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalAmount: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
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
