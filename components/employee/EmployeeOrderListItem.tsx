import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { EmployeeOrder } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type OrderStatus = 'pending' | 'in_transit' | 'delivered';

interface EmployeeOrderListItemProps {
  order: EmployeeOrder;
}

export function EmployeeOrderListItem({ order }: EmployeeOrderListItemProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  const getStatusColor = (status: string) => {
    const orderStatus = status as OrderStatus;
    return colors.orderStatus[orderStatus] ?? colors.textSecondary;
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() =>
        router.push({
          pathname: '/order/[id]',
          params: { id: order.id },
        })
      }
      activeOpacity={0.7}
      accessibilityLabel={`View order details for order #${order.id.slice(0, 8)}`}
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
          <View style={styles.orderInfo}>
            <Text style={[styles.orderId, { color: colors.text }]}>
              Order #{order.id.slice(0, 8)}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </View>
        <View style={styles.orderDates}>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
            Date: {formatDate(order.created_at)}
          </Text>
          <Text style={[styles.orderTotal, { color: colors.primary }]}>
            ${order.total.toFixed(2)}
          </Text>
        </View>
        <View style={styles.orderFooter}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={styles.statusText}>{formatStatus(order.status)}</Text>
          </View>
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
  orderDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
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
