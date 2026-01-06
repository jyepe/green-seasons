import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getEmployeeTruckLoadSummary } from '@/lib/supabase';

export default function EmployeeTruckLoadScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const truckLoadQuery = useQuery({
    queryKey: ['employee-truck-load-summary'],
    queryFn: () => getEmployeeTruckLoadSummary(),
  });

  const onRefresh = useCallback(() => {
    truckLoadQuery.refetch();
  }, [truckLoadQuery]);

  const items = truckLoadQuery.data ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Truck Load
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Items you need to deliver today
        </Text>
      </View>

      {truckLoadQuery.isLoading && items.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading truck load...
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="cube-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nothing to deliver
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            There are no in-transit orders scheduled for delivery today.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={truckLoadQuery.isRefetching}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {items.map(item => (
            <View key={item.item_id} style={styles.itemCard}>
              {item.item_image_url ? (
                <Image
                  source={{ uri: item.item_image_url }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.itemImagePlaceholder,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={colors.textTertiary}
                  />
                </View>
              )}

              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.item_name}
                </Text>
                <Text
                  style={[styles.itemMeta, { color: colors.textSecondary }]}
                >
                  {item.total_quantity} units
                </Text>
                <Text
                  style={[styles.itemMeta, { color: colors.textSecondary }]}
                >
                  {item.orders_count} order
                  {item.orders_count === 1 ? '' : 's'} across{' '}
                  {item.restaurants_count} restaurant
                  {item.restaurants_count === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
  },
  itemImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});

