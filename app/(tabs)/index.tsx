import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useOrders } from '@/hooks/useOrders';
import { useAdmin } from '@/hooks/useAdmin';
import {
  DashboardHeader,
  KpiRow,
  KpiTile,
  RecentOrdersCard,
  aggregateMtd,
  formatChange,
  formatCompactDollars,
  previousMonthLabel,
} from '@/components/dashboard';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const { data: userInfo } = useUserInfo();
  const { data: restaurant } = useRestaurant(userInfo?.owned_restaurant_id);
  const { data: orders = [], isLoading: ordersLoading } = useOrders(
    userInfo?.id
  );
  const { data: isUserAdmin, isLoading: isAdminLoading } = useAdmin();

  const now = useMemo(() => new Date(), []);
  const mtd = useMemo(() => aggregateMtd(orders, now), [orders, now]);
  const prevLabel = useMemo(() => previousMonthLabel(now), [now]);
  const recent = useMemo(() => orders.slice(0, 3), [orders]);

  // Existing admin redirect — preserved verbatim from prior implementation.
  useEffect(() => {
    if (!isAdminLoading && isUserAdmin === true) {
      router.replace('/admin/(tabs)');
    }
  }, [isUserAdmin, isAdminLoading, router]);

  if (!isAdminLoading && isUserAdmin === true) {
    return null;
  }

  const ordersValue = ordersLoading ? '…' : String(mtd.ordersThisMonth);
  const ordersSub = ordersLoading
    ? undefined
    : formatChange(mtd.ordersThisMonth, mtd.ordersLastMonth, prevLabel);

  const spendValue = ordersLoading
    ? '…'
    : formatCompactDollars(mtd.spendThisMonthCents);
  const spendSub = ordersLoading
    ? undefined
    : formatChange(mtd.spendThisMonthCents, mtd.spendLastMonthCents, prevLabel);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <DashboardHeader
          firstName={userInfo?.first_name || 'there'}
          restaurantName={restaurant?.name}
          isLoading={!userInfo}
        />

        <KpiRow>
          <KpiTile
            icon="cube-outline"
            iconColor={colors.primary}
            label="Orders MTD"
            value={ordersValue}
            sub={ordersSub}
            isLoading={ordersLoading}
          />
          <KpiTile
            icon="cash-outline"
            iconColor={colors.accentWarm}
            label="Spend MTD"
            value={spendValue}
            sub={spendSub}
            isLoading={ordersLoading}
          />
        </KpiRow>

        <RecentOrdersCard
          orders={recent}
          isLoading={ordersLoading}
          onSeeAll={() => router.push('/orders')}
          onBrowseProduce={() => router.push('/(tabs)/explore')}
          onPressRow={id =>
            router.push({
              pathname: '/order/[id]',
              params: { id },
            })
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
