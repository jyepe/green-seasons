import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { AdminOrder, Order, OrderStatus } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OrderListItemProps {
  order: Order | AdminOrder;
}

function isAdminOrder(order: Order | AdminOrder): order is AdminOrder {
  return 'order_id' in order;
}

export function OrderListItem({ order }: OrderListItemProps) {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const orderId = isAdminOrder(order) ? order.order_id : order.id;
  const orderDate = isAdminOrder(order)
    ? order.created_at
    : order.order_date || order.created_at;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    return colors.orderStatus[status];
  };

  const formatStatus = (status: OrderStatus) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderAdminInfo = () => {
    if (!isAdminOrder(order)) return null;

    const buyerName =
      order.buyer_first_name || order.buyer_last_name
        ? `${order.buyer_first_name ?? ''} ${order.buyer_last_name ?? ''}`.trim()
        : 'Unknown';

    return (
      <View style={styles.orderInfo}>
        <Text style={[styles.orderId, { color: colors.text }]}>
          Order #{orderId.slice(0, 8)}
        </Text>
        <Text style={[styles.restaurantName, { color: colors.textSecondary }]}>
          {order.restaurant_name}
        </Text>
        <Text style={[styles.buyerName, { color: colors.textSecondary }]}>
          by {buyerName}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() =>
        router.push({
          pathname: '/order/[id]',
          params: { id: orderId },
        })
      }
      activeOpacity={0.7}
      accessibilityLabel={`View order details for order #${orderId.slice(0, 8)}`}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.orderStatusIndicator,
          { backgroundColor: getStatusColor(order.status) },
        ]}
      />
      <View style={styles.orderContent}>
        <View style={styles.orderHeader}>
          {isAdminOrder(order) ? (
            renderAdminInfo()
          ) : (
            <Text style={[styles.orderId, { color: colors.text }]}>
              Order #{orderId.slice(0, 8)}
            </Text>
          )}

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </View>
        <View style={styles.orderDates}>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
            Date: {formatDate(orderDate)}
          </Text>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
            Delivery: {formatDate(order.delivery_at)}
          </Text>
        </View>
        <View
          style={[
            styles.orderFooter,
            isAdminOrder(order) ? styles.adminFooter : null,
          ]}
        >
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={styles.statusText}>{formatStatus(order.status)}</Text>
          </View>
          {isAdminOrder(order) && (
            <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>
              {order.items_count} items
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  orderStatusIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  orderContent: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  restaurantName: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  buyerName: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  orderDates: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  orderFooter: {
    alignItems: 'flex-start',
  },
  adminFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  itemsCount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
