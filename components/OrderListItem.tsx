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
  ScrollView,
} from 'react-native';

// --- Shared Types & Helpers ---

export type FilterStatus = 'all' | OrderStatus;

export const FILTER_LABELS: Record<FilterStatus, string> = {
  all: 'All',
  pending: 'Pending',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

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

// --- Shared UI Components ---

interface OrderFilterTabsProps {
  activeFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
}

export function OrderFilterTabs({
  activeFilter,
  onFilterChange,
}: OrderFilterTabsProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
      >
        {(Object.keys(FILTER_LABELS) as FilterStatus[]).map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              activeFilter === status && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
              activeFilter !== status && {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => onFilterChange(status)}
            accessibilityRole="button"
            accessibilityState={{ selected: activeFilter === status }}
            accessibilityLabel={`Filter by ${FILTER_LABELS[status]}`}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === status
                  ? { color: 'white' }
                  : { color: colors.textSecondary },
              ]}
            >
              {FILTER_LABELS[status]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

interface OrderListEmptyStateProps {
  activeFilter: FilterStatus;
  onClearFilter: () => void;
  emptyMessageAll?: string;
}

export function OrderListEmptyState({
  activeFilter,
  onClearFilter,
  emptyMessageAll = "You haven't placed any orders yet.",
}: OrderListEmptyStateProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeFilter === 'all' ? 'cube-outline' : 'filter-circle-outline'}
        size={64}
        color={colors.textTertiary}
      />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No Orders Found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        {activeFilter === 'all'
          ? emptyMessageAll
          : `No orders found with status "${FILTER_LABELS[activeFilter]}".`}
      </Text>
      {activeFilter !== 'all' && (
        <TouchableOpacity
          style={[styles.clearFilterButton, { borderColor: colors.primary }]}
          onPress={onClearFilter}
          accessibilityRole="button"
          accessibilityLabel="Clear filter"
        >
          <Text
            style={[styles.clearFilterButtonText, { color: colors.primary }]}
          >
            Clear Filter
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

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
  filterContainer: {
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_600SemiBold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearFilterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearFilterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
