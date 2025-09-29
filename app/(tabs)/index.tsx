import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useOrders } from '@/hooks/useOrders';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: userInfo } = useUserInfo();
  const { data: restaurant } = useRestaurant(userInfo?.owned_restaurant_id);
  const { data: orders = [], isLoading: ordersLoading } = useOrders(
    userInfo?.id
  );

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B'; // warning/yellow
      case 'in_transit':
        return '#3B82F6'; // info/blue
      case 'delivered':
        return '#16A34A'; // success/green
      default:
        return colors.success;
    }
  };

  // Calculate stats from orders
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order =>
    ['pending', 'in_transit'].includes(order.status)
  ).length;

  // Calculate this month's total
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthTotal = orders
    .filter(order => {
      const orderDate = new Date(order.created_at);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // Get recent orders (first 5)
  const recentOrders = orders.slice(0, 5);

  const quickActions = [
    {
      icon: 'time-outline',
      title: 'Order History',
    },
    {
      icon: 'heart-outline',
      title: 'My Favorites',
    },
    {
      icon: 'cube-outline',
      title: 'Track Orders',
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
            <View
              style={[styles.summaryIcon, { backgroundColor: colors.success }]}
            >
              <Ionicons name="cube-outline" size={24} color="white" />
            </View>
          </View>

          <View
            style={[styles.summaryCard, { backgroundColor: colors.surface }]}
          >
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
            <View
              style={[styles.summaryIcon, { backgroundColor: colors.warning }]}
            >
              <Ionicons name="time-outline" size={24} color="white" />
            </View>
          </View>

          <View
            style={[styles.summaryCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.summaryContent}>
              <Text
                style={[styles.summaryTitle, { color: colors.textSecondary }]}
              >
                This Month
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {ordersLoading ? '...' : formatCurrency(thisMonthTotal)}
              </Text>
            </View>
            <View
              style={[styles.summaryIcon, { backgroundColor: colors.info }]}
            >
              <Ionicons name="trending-up-outline" size={24} color="white" />
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
                ]}
              >
                <Ionicons
                  name={action.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={colors.text}
                />
                <Text style={[styles.quickActionText, { color: colors.text }]}>
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
              <View key={order.id} style={styles.orderItem}>
                <View
                  style={[
                    styles.orderStatusIndicator,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                />
                <View style={styles.orderContent}>
                  <View style={styles.orderHeader}>
                    <Text style={[styles.orderId, { color: colors.text }]}>
                      Order #{order.id.slice(0, 8)}
                    </Text>
                    <Text style={[styles.orderPrice, { color: colors.text }]}>
                      {formatCurrency(order.total_amount)}
                    </Text>
                  </View>
                  <View style={styles.orderDates}>
                    <Text
                      style={[
                        styles.orderDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Date: {formatDate(order.order_date)}
                    </Text>
                    <Text
                      style={[
                        styles.orderDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Delivery: {formatDate(order.delivery_date)}
                    </Text>
                  </View>
                  <Text style={[styles.orderItems, { color: colors.text }]}>
                    Order #{order.id.slice(0, 8)}
                  </Text>
                  <View style={styles.orderFooter}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(order.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}

          {!ordersLoading && orders.length > 0 && (
            <TouchableOpacity style={styles.viewAllButton}>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
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
  recentOrdersSection: {
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  orderPrice: {
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
  orderItems: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  orderFooter: {
    alignItems: 'flex-start',
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
