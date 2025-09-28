import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
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

  // Mock data for restaurant owner dashboard
  const summaryData = {
    totalOrders: 8,
    pendingOrders: 5,
    thisMonth: 0.0,
  };

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

  const recentOrders = [
    {
      id: '1e7aeaac',
      orderDate: '8/5/2025',
      deliveryDate: '8/5/2025',
      items: 'Celery, Jalapeño, Beet, Malanga, Basil, Paprika, Yuca (Cassava)',
      price: '$30.83',
      status: 'pending',
    },
    {
      id: 'f423e74a',
      orderDate: '7/27/2025',
      deliveryDate: '7/28/2025',
      items: 'Garlic',
      price: '$14.38',
      status: 'pending',
    },
    {
      id: '05b1b54c',
      orderDate: '7/26/2025',
      deliveryDate: '7/30/2025',
      items: 'Paprika',
      price: '$13.30',
      status: 'pending',
    },
    {
      id: '0276d730',
      orderDate: '7/26/2025',
      deliveryDate: '7/30/2025',
      items: 'Jalapeño',
      price: '$11.68',
      status: 'pending',
    },
    {
      id: '741690a3',
      orderDate: '7/26/2025',
      deliveryDate: '7/28/2025',
      items: 'Ripe Plantain',
      price: '$11.14',
      status: 'active',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B'; // warning/yellow
      case 'active':
        return '#3B82F6'; // info/blue
      default:
        return colors.success;
    }
  };

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
                {summaryData.totalOrders}
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
                {summaryData.pendingOrders}
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
                ${summaryData.thisMonth.toFixed(2)}
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

          {recentOrders.map((order, index) => (
            <View key={order.id} style={styles.orderItem}>
              <View
                style={[
                  styles.orderStatusIndicator,
                  { backgroundColor: colors.success },
                ]}
              />
              <View style={styles.orderContent}>
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderId, { color: colors.text }]}>
                    Order #{order.id}
                  </Text>
                  <Text style={[styles.orderPrice, { color: colors.text }]}>
                    {order.price}
                  </Text>
                </View>
                <View style={styles.orderDates}>
                  <Text
                    style={[styles.orderDate, { color: colors.textSecondary }]}
                  >
                    Date: {order.orderDate}
                  </Text>
                  <Text
                    style={[styles.orderDate, { color: colors.textSecondary }]}
                  >
                    Delivery: {order.deliveryDate}
                  </Text>
                </View>
                <Text style={[styles.orderItems, { color: colors.text }]}>
                  Items: {order.items}
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
          ))}

          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              View All Orders ({summaryData.totalOrders})
            </Text>
          </TouchableOpacity>
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
});
