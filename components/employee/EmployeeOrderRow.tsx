import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { EmployeeOrder } from '@/lib/supabase';
import { formatCurrency } from '@/utils/currency';

type OrderStatus = 'pending' | 'in_transit' | 'delivered';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { label: 'Pending', icon: 'time-outline' },
  in_transit: { label: 'In Transit', icon: 'car-outline' },
  delivered: { label: 'Delivered', icon: 'checkmark-circle-outline' },
};

type EmployeeOrderRowProps = {
  order: EmployeeOrder;
  showDivider?: boolean;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  showChevron?: boolean;
};

export function EmployeeOrderRow({
  order,
  showDivider,
  onPress,
  containerStyle,
  showChevron,
}: EmployeeOrderRowProps) {
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

  const status = order.status as OrderStatus;
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const statusColor = getStatusColor(order.status);

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[
        styles.orderRow,
        showDivider && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        containerStyle,
      ]}
      {...(onPress
        ? {
            onPress,
            activeOpacity: 0.7,
            accessibilityRole: 'button' as const,
            accessibilityLabel: `View order ${order.id}`,
          }
        : null)}
    >
      <View style={styles.orderInfo}>
        <Text style={[styles.orderId, { color: colors.text }]}>
          Order #{order.id.slice(0, 8)}
        </Text>
      </View>

      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={[styles.restaurantName, { color: colors.text }]}>
            {order.restaurant_name}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '20' },
            ]}
          >
            <Ionicons name={statusConfig.icon} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusConfig.label}
            </Text>
          </View>
          {showChevron && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          )}
        </View>
      </View>

      <View style={styles.datesRow}>
        <View style={styles.detailItem}>
          <Ionicons
            name="time-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Created: {formatDate(order.created_at)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Delivery: {formatDate(order.delivery_at)}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={[styles.totalAmount, { color: colors.primary }]}>
          Total: {formatCurrency(order.total)}
        </Text>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  orderRow: {
    paddingVertical: 12,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderId: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
});
