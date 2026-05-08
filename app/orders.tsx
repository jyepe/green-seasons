import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOrders } from '@/hooks/useOrders';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import {
  FilterStatus,
  OrderFilterTabs,
  OrderListEmptyState,
} from '@/components/OrderListItem';
import { OrderHistoryKPIRow } from '@/components/OrderHistoryKPIRow';
import { OrderHistoryCard } from '@/components/OrderHistoryCard';
import { ThemedSearchBar, LoadingView } from '@/components/ThemedView';
import { Toast } from '@/components/ui/Toast';
import type { Order } from '@/lib/supabase';

type OrderSection = { title: string; data: Order[] };

function groupOrdersByDate(orders: Order[]): OrderSection[] {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

  const keys: string[] = [];
  const groups: Record<string, Order[]> = {};

  for (const order of orders) {
    const d = new Date(order.created_at);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let key: string;
    if (dayStart.getTime() === todayStart.getTime()) {
      key = 'TODAY';
    } else if (dayStart.getTime() === yesterdayStart.getTime()) {
      key = 'YESTERDAY';
    } else {
      key = d
        .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        .replace(',', '')
        .toUpperCase();
    }
    if (!groups[key]) {
      keys.push(key);
      groups[key] = [];
    }
    groups[key].push(order);
  }

  return keys.map(key => ({
    title: `${key} · ${groups[key].length}`,
    data: groups[key],
  }));
}

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { data: userInfo } = useUserInfo();
  const { data: orders = [], isLoading } = useOrders(userInfo?.id);
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const searchFiltered = useMemo(
    () =>
      searchQuery.trim()
        ? orders.filter(o => o.id.toLowerCase().includes(searchQuery.toLowerCase().trim()))
        : orders,
    [orders, searchQuery]
  );

  const filteredOrders = useMemo(
    () =>
      activeFilter === 'all'
        ? searchFiltered
        : searchFiltered.filter(o => o.status === activeFilter),
    [searchFiltered, activeFilter]
  );

  const kpiCounts = useMemo(() => {
    const now = new Date();
    return {
      thisMonth: orders.filter(o => {
        const d = new Date(o.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length,
      pending: orders.filter(o => o.status === 'pending').length,
      inTransit: orders.filter(o => o.status === 'in_transit').length,
    };
  }, [orders]);

  const filterCounts = useMemo(
    (): Record<FilterStatus, number> => ({
      all: searchFiltered.length,
      pending: searchFiltered.filter(o => o.status === 'pending').length,
      in_transit: searchFiltered.filter(o => o.status === 'in_transit').length,
      delivered: searchFiltered.filter(o => o.status === 'delivered').length,
    }),
    [searchFiltered]
  );

  const sections = useMemo(() => groupOrdersByDate(filteredOrders), [filteredOrders]);

  const handleReorderComplete = (success: boolean) => {
    setToast(
      success
        ? { message: 'Items added to cart', type: 'success' }
        : { message: 'Some items could not be added', type: 'error' }
    );
  };

  if (isLoading) return <LoadingView />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Order History</Text>
        <View style={{ width: 32 }} />
      </View>
      <SectionList<Order, OrderSection>
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <OrderHistoryCard
            order={item}
            onPress={() => router.push(`/order/${item.id}`)}
            onReorderComplete={handleReorderComplete}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={{ paddingTop: Spacing.s4 }}>
            <OrderHistoryKPIRow
              thisMonth={kpiCounts.thisMonth}
              pending={kpiCounts.pending}
              inTransit={kpiCounts.inTransit}
            />
            <View style={styles.searchContainer}>
              <ThemedSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search orders or items"
              />
            </View>
            <OrderFilterTabs
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={filterCounts}
            />
          </View>
        }
        ListEmptyComponent={
          <OrderListEmptyState
            activeFilter={activeFilter}
            onClearFilter={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}
          />
        }
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={!!toast}
          onHide={() => setToast(null)}
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
    paddingHorizontal: Spacing.s5,
    paddingVertical: Spacing.s4,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semibold,
    fontFamily: 'Inter_600SemiBold',
  },
  searchContainer: {
    paddingHorizontal: Spacing.s5,
    paddingBottom: Spacing.s3,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.s5,
    paddingTop: Spacing.s3,
    paddingBottom: Spacing.s2,
  },
  sectionTitle: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    paddingBottom: Spacing.s8,
  },
});
