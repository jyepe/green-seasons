import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useOrders } from '@/hooks/useOrders';
import { useAdmin } from '@/hooks/useAdmin';
import { OrderListItem } from '@/components/OrderListItem';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: userInfo } = useUserInfo();
  const { data: restaurant } = useRestaurant(userInfo?.owned_restaurant_id);
  const { data: orders = [], isLoading: ordersLoading } = useOrders(
    userInfo?.id
  );
  const { data: isUserAdmin, isLoading: isAdminLoading } = useAdmin();

  // Check if user is admin and redirect to admin dashboard
  useEffect(() => {
    // Only redirect if we have a definitive answer (not loading) and user is admin
    if (!isAdminLoading && isUserAdmin === true) {
      router.replace('/admin/');
    }
  }, [isUserAdmin, isAdminLoading, router]);

  // Don't render the home screen if user is admin (will redirect)
  if (!isAdminLoading && isUserAdmin === true) {
    return null;
  }

  // Calculate stats from orders
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order =>
    ['pending', 'in_transit'].includes(order.status)
  ).length;

  // Calculate this month's total
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthTotal = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return (
      orderDate.getMonth() === currentMonth &&
      orderDate.getFullYear() === currentYear
    );
  }).length;

  // Get recent orders (first 4)
  const recentOrders = orders.slice(0, 4);

  const quickActions = [
    {
      icon: 'time-outline',
      title: 'Order History',
      onPress: () => router.push('/orders'),
      disabled: false,
    },
    {
      icon: 'heart-outline',
      title: 'My Favorites',
      onPress: () => router.push('/favorites'),
      disabled: false,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Welcome back, {userInfo?.first_name || 'Tony'}!
          </Text>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
            Managing orders for {restaurant?.name || 'your restaurant'}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View
            style={[styles.summaryCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.summaryIcon, { backgroundColor: colors.success }]}
            >
              <Ionicons name="cube-outline" size={24} color="white" />
            </View>
            <View style={styles.summaryContent}>
              <Text
                style={[styles.summaryTitle, { color: colors.textSecondary }]}
              >
                Total Orders
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {ordersLoading ? '...' : totalOrders}
              </Text>
            </View>
          </View>

          <View
            style={[styles.summaryCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.summaryIcon, { backgroundColor: colors.warning }]}
            >
              <Ionicons name="time-outline" size={24} color="white" />
            </View>
            <View style={styles.summaryContent}>
              <Text
                style={[styles.summaryTitle, { color: colors.textSecondary }]}
              >
                Pending Orders
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {ordersLoading ? '...' : pendingOrders}
              </Text>
            </View>
          </View>

          <View
            style={[styles.summaryCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.summaryIcon, { backgroundColor: colors.info }]}
            >
              <Ionicons name="trending-up-outline" size={24} color="white" />
            </View>
            <View style={styles.summaryContent}>
              <Text
                style={[styles.summaryTitle, { color: colors.textSecondary }]}
              >
                This Month Orders
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {ordersLoading ? '...' : thisMonthTotal}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickActionButton,
                  { backgroundColor: colors.surface },
                  action.disabled && styles.quickActionButtonDisabled,
                ]}
                onPress={action.onPress}
                disabled={action.disabled}
              >
                <Ionicons
                  name={action.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={action.disabled ? colors.textTertiary : colors.text}
                />
                <Text
                  style={[
                    styles.quickActionText,
                    {
                      color: action.disabled
                        ? colors.textTertiary
                        : colors.text,
                    },
                  ]}
                >
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.recentOrdersSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Orders
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Your latest produce orders
          </Text>

          {ordersLoading ? (
            <View style={styles.loadingContainer}>
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading orders...
              </Text>
            </View>
          ) : recentOrders.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="cube-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                No Orders Yet
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Start ordering fresh produce for your restaurant
              </Text>
            </View>
          ) : (
            recentOrders.map(order => (
              <OrderListItem key={order.id} order={order} />
            ))
          )}

          {!ordersLoading && orders.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/orders')}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View All Orders ({totalOrders})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  summarySection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryContent: {
    alignItems: 'center',
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  quickActionButtonDisabled: {
    opacity: 0.5,
  },
  recentOrdersSection: {
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
  },
  viewAllButton: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
