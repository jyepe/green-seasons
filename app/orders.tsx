import {
  OrderListItem,
  FilterStatus,
  OrderFilterTabs,
  OrderListEmptyState,
} from '@/components/OrderListItem';
import { LoadingView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useOrders } from '@/hooks/useOrders';
import { useUserInfo } from '@/hooks/useUserInfo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      <OrderFilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Orders List */}
      {isLoading ? (
        <LoadingView message="Loading orders..." />
      ) : filteredOrders.length === 0 ? (
        <OrderListEmptyState
          activeFilter={activeFilter}
          onClearFilter={() => setActiveFilter('all')}
        />
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
  listContent: {
    padding: 20,
  },
});
