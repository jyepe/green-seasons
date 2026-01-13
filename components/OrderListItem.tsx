import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Order, OrderStatus } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlexStyle,
} from 'react-native';

// --- Shared Helpers ---

export const formatDate = (dateString: string | null | undefined) => {
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

export const formatStatus = (status: OrderStatus) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getStatusColor = (
  status: OrderStatus,
  colors: typeof Colors.light
) => {
  return colors.orderStatus[status];
};

// --- Base Component ---

export interface BaseOrderListItemProps {
  orderId: string;
  status: OrderStatus;
  dateLabel: string;
  deliveryLabel: string;
  onPress: () => void;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  headerAlign?: FlexStyle['alignItems'];
}

/**
 * BaseOrderListItem extracts the shared layout and logic for order list items.
 * Used by both OrderListItem (user) and AdminOrderListItem (admin).
 * Reduces duplication of styles, formatting, and layout structure.
 */
export function BaseOrderListItem({
  orderId,
  status,
  dateLabel,
  deliveryLabel,
  onPress,
  headerContent,
  footerContent,
  headerAlign = 'center',
}: BaseOrderListItemProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  // Default header shows just the Order ID
  const defaultHeader = (
    <Text style={[styles.orderId, { color: colors.text }]}>
      Order #{orderId.slice(0, 8)}
    </Text>
  );

  return (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`View order details for order #${orderId.slice(0, 8)}`}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.orderStatusIndicator,
          { backgroundColor: getStatusColor(status, colors) },
        ]}
      />
      <View style={styles.orderContent}>
        <View style={[styles.orderHeader, { alignItems: headerAlign }]}>
          {headerContent || defaultHeader}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </View>
        <View style={styles.orderDates}>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
            {dateLabel}
          </Text>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
            {deliveryLabel}
          </Text>
        </View>
        <View style={styles.orderFooter}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(status, colors) },
            ]}
          >
            <Text style={styles.statusText}>{formatStatus(status)}</Text>
          </View>
          {footerContent}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// --- Specific Components ---

interface OrderListItemProps {
  order: Order;
}

export function OrderListItem({ order }: OrderListItemProps) {
  const router = useRouter();

  return (
    <BaseOrderListItem
      orderId={order.id}
      status={order.status}
      dateLabel={`Date: ${formatDate(order.order_date || order.created_at)}`}
      deliveryLabel={`Delivery: ${formatDate(order.delivery_at)}`}
      onPress={() =>
        router.push({
          pathname: '/order/[id]',
          params: { id: order.id },
        })
      }
    />
  );
}

export const styles = StyleSheet.create({
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
    marginBottom: 8,
    // alignItems handled via prop
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
});
