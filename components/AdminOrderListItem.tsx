import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { AdminOrder } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BaseOrderListItem,
  formatDate,
  styles as baseStyles,
} from './OrderListItem';

interface AdminOrderListItemProps {
  order: AdminOrder;
}

export function AdminOrderListItem({ order }: AdminOrderListItemProps) {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const buyerName =
    order.buyer_first_name || order.buyer_last_name
      ? `${order.buyer_first_name ?? ''} ${order.buyer_last_name ?? ''}`.trim()
      : 'Unknown';

  const headerContent = (
    <View style={styles.orderInfo}>
      <Text style={[baseStyles.orderId, { color: colors.text }]}>
        Order #{order.order_id.slice(0, 8)}
      </Text>
      <Text style={[styles.restaurantName, { color: colors.textSecondary }]}>
        {order.restaurant_name}
      </Text>
      <Text style={[styles.buyerName, { color: colors.textSecondary }]}>
        by {buyerName}
      </Text>
    </View>
  );

  const footerContent = (
    <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>
      {order.items_count} items
    </Text>
  );

  return (
    <BaseOrderListItem
      orderId={order.order_id}
      status={order.status}
      dateLabel={`Date: ${formatDate(order.created_at)}`}
      deliveryLabel={`Delivery: ${formatDate(order.delivery_at)}`}
      onPress={() =>
        router.push({
          pathname: '/order/[id]',
          params: { id: order.order_id },
        })
      }
      headerContent={headerContent}
      footerContent={footerContent}
      headerAlign="flex-start"
      totalAmount={order.total_amount}
      finalTotalAmount={order.final_total_amount}
    />
  );
}

const styles = StyleSheet.create({
  orderInfo: {
    flex: 1,
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
  itemsCount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
