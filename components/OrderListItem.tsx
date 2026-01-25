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
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency } from '@/utils/currency';
import { LoadingView } from './ThemedView';

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

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { label: 'Pending', icon: 'time-outline' },
  in_transit: { label: 'In Transit', icon: 'car-outline' },
  delivered: { label: 'Delivered', icon: 'checkmark-circle-outline' },
};

// --- Shared UI Components ---

export interface OrderFilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  /** Optional override for colors, otherwise uses useAppColorScheme */
  colors?: typeof Colors.light;
}

export function OrderFilterChip({
  label,
  isActive,
  onPress,
  colors: propColors,
}: OrderFilterChipProps) {
  const colorScheme = useAppColorScheme();
  const colors = propColors || Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[
        styles.filterTab,
        isActive && {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        !isActive && {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`Filter by ${label}`}
      accessibilityHint={isActive ? 'Currently active filter' : 'Tap to filter'}
    >
      <Text
        style={[
          styles.filterText,
          isActive ? { color: 'white' } : { color: colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface OrderFilterTabsProps {
  activeFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
}

export function OrderFilterTabs({
  activeFilter,
  onFilterChange,
}: OrderFilterTabsProps) {
  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
      >
        {(Object.keys(FILTER_LABELS) as FilterStatus[]).map(status => (
          <OrderFilterChip
            key={status}
            label={FILTER_LABELS[status]}
            isActive={activeFilter === status}
            onPress={() => onFilterChange(status)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface OrderListEmptyStateProps {
  activeFilter: FilterStatus;
  onClearFilter: () => void;
  emptyMessageAll?: string;
  /** Optional explicit message to override the default text logic */
  message?: string;
  /** Optional explicit control for showing the clear button */
  showClearButton?: boolean;
}

export function OrderListEmptyState({
  activeFilter,
  onClearFilter,
  emptyMessageAll = "You haven't placed any orders yet.",
  message,
  showClearButton,
}: OrderListEmptyStateProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  // Logic to determine if we should show the clear button
  // If showClearButton is provided, use it. Otherwise fallback to checking activeFilter.
  const shouldShowClearButton =
    showClearButton !== undefined ? showClearButton : activeFilter !== 'all';

  // Logic to determine the text to display
  // If message is provided, use it. Otherwise fallback to checking activeFilter.
  const displayMessage =
    message ||
    (activeFilter === 'all'
      ? emptyMessageAll
      : `No orders found with status "${FILTER_LABELS[activeFilter]}".`);

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
        {displayMessage}
      </Text>
      {shouldShowClearButton && (
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

export interface OrderListLayoutProps<T> {
  title: string;
  activeFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  isLoading: boolean;
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
  keyExtractor: (item: T) => string;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  emptyMessage?: string;
  /** Optional extra content to render after the standard filters (e.g. secondary filters) */
  extraFilterContent?: React.ReactNode;
  /** Optional override for the clear filter action */
  onClearFilter?: () => void;
  /** Optional override for the empty state message */
  emptyStateMessage?: string;
  /** Optional control for showing the clear button in empty state */
  showClearButton?: boolean;
}

/**
 * OrderListLayout consolidates the standard "Header + Filter + Loading + List/Empty"
 * pattern used in order history and admin order list screens.
 */
export function OrderListLayout<T>({
  title,
  activeFilter,
  onFilterChange,
  isLoading,
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  isFetchingNextPage = false,
  emptyMessage,
  extraFilterContent,
  onClearFilter,
  emptyStateMessage,
  showClearButton,
}: OrderListLayoutProps<T>) {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <OrderFilterTabs
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
      {extraFilterContent}

      {/* Orders List */}
      {isLoading && data.length === 0 ? (
        <LoadingView message="Loading orders..." />
      ) : data.length === 0 ? (
        <OrderListEmptyState
          activeFilter={activeFilter}
          onClearFilter={onClearFilter || (() => onFilterChange('all'))}
          emptyMessageAll={emptyMessage}
          message={emptyStateMessage}
          showClearButton={showClearButton}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
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
  /** Total amount to display. If omitted, no total is shown. */
  totalAmount?: number;
  /** Finalized total amount. If null/undefined or 0, totalAmount is considered unfinalized. */
  finalTotalAmount?: number | null;
  /**
   * Accessible label for the list item.
   * If omitted, a default label is constructed from order ID, status, dates, and total.
   */
  accessibilityLabel?: string;
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
  totalAmount,
  finalTotalAmount,
  accessibilityLabel,
}: BaseOrderListItemProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  // Determine display amount and finalization status
  const isFinalized = finalTotalAmount != null && finalTotalAmount > 0;
  const displayAmount = isFinalized ? finalTotalAmount : totalAmount;
  const showTotal = totalAmount !== undefined;

  // Default header shows just the Order ID
  const defaultHeader = (
    <Text style={[styles.orderId, { color: colors.text }]}>
      Order #{orderId.slice(0, 8)}
    </Text>
  );

  const statusLabel = STATUS_CONFIG[status].label;
  const formattedAmount = formatCurrency(displayAmount ?? 0);

  const defaultAccessibilityLabel = [
    `Order #${orderId.slice(0, 8)}`,
    statusLabel,
    dateLabel,
    deliveryLabel,
    showTotal ? `Total: ${formattedAmount}` : null,
    !isFinalized && showTotal ? 'Price not finalized' : null,
    'Double tap to view details',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel || defaultAccessibilityLabel}
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
              { backgroundColor: getStatusColor(status, colors) + '20' },
            ]}
          >
            <Ionicons
              name={STATUS_CONFIG[status].icon}
              size={14}
              color={getStatusColor(status, colors)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(status, colors) },
              ]}
            >
              {STATUS_CONFIG[status].label}
            </Text>
          </View>
          {footerContent}
          {showTotal && (
            <View style={styles.amountContainer}>
              <Text
                style={[styles.totalAmount, { color: colors.primary }]}
                accessibilityLabel={`Total: ${formatCurrency(displayAmount ?? 0)}`}
              >
                {formatCurrency(displayAmount ?? 0)}
              </Text>
              {!isFinalized && (
                <Text
                  style={[
                    styles.disclaimerText,
                    { color: colors.textSecondary },
                  ]}
                  accessibilityLabel="Price not finalized"
                >
                  Price not finalized
                </Text>
              )}
            </View>
          )}
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
      totalAmount={order.total_amount}
      finalTotalAmount={order.final_total_amount}
    />
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: {
    padding: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
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
    gap: 12,
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
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
    marginTop: 2,
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
