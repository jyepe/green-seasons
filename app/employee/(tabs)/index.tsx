import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';

import { ExpandableCard } from '@/components/admin';
import { EmployeeOrdersCard } from '@/components/employee';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getEmployeeOrders } from '@/lib/supabase';

export default function EmployeeDashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch only 5 most recent orders for dashboard
  const ordersQuery = useQuery({
    queryKey: ['employee-dashboard-orders'],
    queryFn: async () => {
      const result = await getEmployeeOrders(5, null);
      return result.orders;
    },
  });

  const recentOrders = useMemo(
    () => ordersQuery.data ?? [],
    [ordersQuery.data]
  );

  const onRefresh = useCallback(() => {
    ordersQuery.refetch();
  }, [ordersQuery]);

  // Refresh recent orders when dashboard screen comes into focus
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: ['employee-dashboard-orders'],
      });
    }, [queryClient])
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Employee Dashboard
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            View and manage orders
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={ordersQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Recent Orders */}
        <ExpandableCard title="Recent Orders" defaultExpanded>
          <EmployeeOrdersCard
            orders={recentOrders}
            isLoading={ordersQuery.isLoading}
            onViewAll={() => router.push('/employee/orders')}
          />
        </ExpandableCard>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  bottomSpacer: {
    height: 32,
  },
});
