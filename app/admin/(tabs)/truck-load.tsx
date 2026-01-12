import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import {
  adminFinalizePricingForDay,
  getAdminTruckLoadSummary,
} from '@/lib/supabase';

type EditedPrices = Record<string, string>;

export default function AdminTruckLoadScreen() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();
  const [editedPrices, setEditedPrices] = useState<EditedPrices>({});

  const truckLoadQuery = useQuery({
    queryKey: ['admin-truck-load-summary'],
    queryFn: () => getAdminTruckLoadSummary(),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const items = truckLoadQuery.data ?? [];
      // Only send items that have not been finalized yet
      const nonFinalizedItems = items.filter(item => !item.finalized);
      const prices = nonFinalizedItems
        .filter(item => editedPrices[item.item_id]) // Only items with a price entered
        .map(item => ({
          item_id: item.item_id,
          final_unit_price: parseFloat(editedPrices[item.item_id]),
        }));
      return adminFinalizePricingForDay(new Date(), prices);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Prices have been finalized.');
      queryClient.invalidateQueries({ queryKey: ['admin-truck-load-summary'] });
      setEditedPrices({});
    },
    onError: error => {
      Alert.alert(
        'Error',
        `Failed to finalize prices: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    },
  });

  const onRefresh = useCallback(() => {
    truckLoadQuery.refetch();
  }, [truckLoadQuery]);

  const items = truckLoadQuery.data ?? [];

  const handlePriceChange = (itemId: string, value: string) => {
    // Allow only valid decimal input with max 2 decimal places
    let sanitized = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      sanitized = parts[0] + '.' + parts[1].slice(0, 2);
    }

    setEditedPrices(prev => ({
      ...prev,
      [itemId]: sanitized,
    }));
  };

  const getDisplayPrice = (itemId: string): string => {
    return editedPrices[itemId] ?? '';
  };

  const handleFinalizePrices = () => {
    const nonFinalizedItems = items.filter(item => !item.finalized);

    if (nonFinalizedItems.length === 0) {
      Alert.alert('No Items', 'All items have already been finalized.');
      return;
    }

    Alert.alert(
      'Finalize Prices',
      'Are you sure you want to finalize the prices for today? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          style: 'destructive',
          onPress: () => finalizeMutation.mutate(),
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Truck Load
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Set final prices for today&apos;s deliveries
            </Text>
          </View>
        </View>
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
          <Ionicons name="cube-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nothing to deliver
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            There are no items scheduled for delivery today.
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
            <View
              key={item.item_id}
              style={[styles.itemCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.itemHeader}>
                <View style={styles.imageContainer}>
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
                  {item.finalized && (
                    <Text
                      style={[styles.finalizedText, { color: colors.success }]}
                    >
                      Price finalized
                    </Text>
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {item.item_name}
                  </Text>
                </View>

                <View style={styles.priceInputContainer}>
                  <Text
                    style={[
                      styles.dollarSign,
                      {
                        color: item.finalized
                          ? colors.textTertiary
                          : colors.text,
                      },
                    ]}
                  >
                    $
                  </Text>
                  <TextInput
                    style={[
                      styles.priceInput,
                      {
                        color: item.finalized
                          ? colors.textTertiary
                          : colors.text,
                        borderColor: colors.border,
                        backgroundColor: item.finalized
                          ? colors.border
                          : colors.background,
                      },
                    ]}
                    value={getDisplayPrice(item.item_id)}
                    onChangeText={value =>
                      handlePriceChange(item.item_id, value)
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textTertiary}
                    editable={!item.finalized}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleFinalizePrices}
            disabled={finalizeMutation.isPending}
            style={[
              styles.finalizeButton,
              {
                backgroundColor: colors.primary,
                opacity: finalizeMutation.isPending ? 0.6 : 1,
              },
            ]}
          >
            {finalizeMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.finalizeButtonText}>Finalize Prices</Text>
              </>
            )}
          </TouchableOpacity>
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  imageContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalizedText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
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
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  dollarSign: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginRight: 4,
  },
  priceInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textAlign: 'right',
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  finalizeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  finalizeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
