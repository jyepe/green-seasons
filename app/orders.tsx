import { OrderListItem } from '@/components/OrderListItem';
import { LoadingView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useOrders } from '@/hooks/useOrders';
import { useUserInfo } from '@/hooks/useUserInfo';
import { OrderStatus } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterStatus = 'all' | OrderStatus;

const FILTER_LABELS: Record<FilterStatus, string> = {
  all: 'All',
  pending: 'Pending',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

export default function OrderHistoryScreen() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { data: userInfo } = useUserInfo();
  const { data: orders = [], isLoading } = useOrders(userInfo?.id);

  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === activeFilter);
  }, [orders, activeFilter]);

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
          Order History
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
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
              onPress={() => setActiveFilter(status)}
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

      {/* Orders List */}
      {isLoading ? (
        <LoadingView message="Loading orders..." />
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={
              activeFilter === 'all' ? 'cube-outline' : 'filter-circle-outline'
            }
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            No Orders Found
          </Text>
          <Text
            style={[styles.emptyStateText, { color: colors.textSecondary }]}
          >
            {activeFilter === 'all'
              ? "You haven't placed any orders yet."
              : `No orders found with status "${FILTER_LABELS[activeFilter]}".`}
          </Text>
          {activeFilter !== 'all' && (
            <TouchableOpacity
              style={[
                styles.clearFilterButton,
                { borderColor: colors.primary },
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text
                style={[
                  styles.clearFilterButtonText,
                  { color: colors.primary },
                ]}
              >
                Clear Filter
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <OrderListItem order={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  listContent: {
    padding: 20,
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
