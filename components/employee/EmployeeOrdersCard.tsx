import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { EmployeeOrder } from '@/lib/supabase';
import { EmployeeOrderRow } from './EmployeeOrderRow';

type EmployeeOrdersCardProps = {
  orders: EmployeeOrder[];
  isLoading?: boolean;
  onViewAll?: () => void;
};

export function EmployeeOrdersCard({
  orders,
  isLoading,
  onViewAll,
}: EmployeeOrdersCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No orders found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {orders.map((order, index) => {
        return (
          <EmployeeOrderRow
            key={order.id}
            order={order}
            showDivider={index < orders.length - 1}
          />
        );
      })}

      {onViewAll && (
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: colors.primary }]}
          onPress={onViewAll}
          accessibilityLabel="View all orders"
          accessibilityRole="button"
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All Orders
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
