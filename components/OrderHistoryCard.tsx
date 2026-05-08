import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight } from '@/constants/Typography';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { getStatusColor, STATUS_CONFIG } from '@/components/OrderListItem';
import { useAddToCart } from '@/hooks/useCart';
import { getOrderDetails } from '@/lib/supabase';
import { ORDER_DETAILS_QUERY_KEY } from '@/hooks/useOrderDetails';
import { formatCurrency } from '@/utils/currency';
import type { Order } from '@/lib/supabase';

function inferDeliveryWindow(deliveryAt: string | null | undefined): string | null {
  if (!deliveryAt) return null;
  const hour = new Date(deliveryAt).getHours();
  if (hour === 6) return '6–9 AM';
  if (hour === 14) return '2–5 PM';
  return null;
}

function relativeDeliveryDay(deliveryAt: string | null | undefined): string | null {
  if (!deliveryAt) return null;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const delivery = new Date(deliveryAt);
  const deliveryStart = new Date(
    delivery.getFullYear(),
    delivery.getMonth(),
    delivery.getDate()
  );
  const diffDays = Math.round(
    (deliveryStart.getTime() - todayStart.getTime()) / 86_400_000
  );
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return delivery.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatCardDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface OrderHistoryCardProps {
  order: Order;
  onPress: () => void;
  onReorderComplete: (success: boolean) => void;
}

export function OrderHistoryCard({ order, onPress, onReorderComplete }: OrderHistoryCardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();
  const { mutateAsync: addToCart } = useAddToCart();
  const [isReordering, setIsReordering] = useState(false);

  const statusColor = getStatusColor(order.status, colors);
  const { label: statusLabel } = STATUS_CONFIG[order.status];
  const deliveryDay = relativeDeliveryDay(order.delivery_at);
  const deliveryWindow = inferDeliveryWindow(order.delivery_at);
  const deliveryText = deliveryDay
    ? deliveryWindow
      ? `Delivery ${deliveryDay} · ${deliveryWindow}`
      : `Delivery ${deliveryDay}`
    : 'No delivery date';
  const displayId = `#${order.id.slice(0, 8)}`;
  const displayDate = formatCardDate(order.created_at);
  const displayTotal = formatCurrency(order.final_total_amount ?? order.total_amount);
  const priceNotFinal = order.final_total_amount == null;

  const handleReorder = async () => {
    setIsReordering(true);
    try {
      const items = await queryClient.fetchQuery({
        queryKey: [...ORDER_DETAILS_QUERY_KEY, order.id],
        queryFn: () => getOrderDetails(order.id),
        staleTime: 5 * 60 * 1000,
      });
      const results = await Promise.allSettled(
        items.map(item => addToCart({ itemId: item.item_id, quantityDelta: item.quantity }))
      );
      const hasFailures = results.some(r => r.status === 'rejected');
      onReorderComplete(!hasFailures);
    } catch {
      onReorderComplete(false);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        Shadow.sm,
        { backgroundColor: colors.surface, borderLeftColor: statusColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Order ${displayId}, ${displayTotal}, ${statusLabel}`}
    >
      {/* Row 1: ID + date + total */}
      <View style={styles.row}>
        <View style={styles.idDateRow}>
          <Text style={[styles.orderId, { color: colors.text }]}>{displayId}</Text>
          <Text style={[styles.separator, { color: colors.textSecondary }]}> · </Text>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{displayDate}</Text>
        </View>
        <View style={styles.totalColumn}>
          <Text style={[styles.total, { color: colors.primary }]}>{displayTotal}</Text>
          {priceNotFinal && (
            <Text style={[styles.priceNotFinal, { color: colors.textSecondary }]}>
              Price not final
            </Text>
          )}
        </View>
      </View>

      {/* Row 2: delivery + status badge + reorder */}
      <View style={[styles.row, styles.bottomRow]}>
        <Text
          style={[styles.delivery, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {deliveryText}
        </Text>
        <View style={styles.actions}>
          <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <TouchableOpacity
            style={[styles.reorderBtn, { borderColor: colors.primary }]}
            onPress={handleReorder}
            disabled={isReordering}
            accessibilityRole="button"
            accessibilityLabel="Reorder"
          >
            {isReordering ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.reorderText, { color: colors.primary }]}>Reorder</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderRadius: Radius.md,
    padding: Spacing.s4,
    marginHorizontal: Spacing.s5,
    marginBottom: Spacing.s3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomRow: {
    marginTop: Spacing.s2,
  },
  idDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.s2,
  },
  orderId: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },
  separator: {
    fontSize: FontSize.label,
  },
  orderDate: {
    fontSize: FontSize.label,
  },
  totalColumn: {
    alignItems: 'flex-end',
  },
  total: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  priceNotFinal: {
    fontSize: FontSize.small,
    marginTop: 2,
  },
  delivery: {
    fontSize: FontSize.label,
    flex: 1,
    marginRight: Spacing.s2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
  },
  badge: {
    paddingHorizontal: Spacing.s2,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
  },
  reorderBtn: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.s3,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  reorderText: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
  },
});
