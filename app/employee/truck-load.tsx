import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getEmployeeTruckLoadSummary } from '@/lib/supabase';
import { generateLoadingSheetHtml, pluralize } from '@/utils/invoice';

export default function EmployeeTruckLoadScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);

  const truckLoadQuery = useQuery({
    queryKey: ['employee-truck-load-summary'],
    queryFn: () => getEmployeeTruckLoadSummary(),
    staleTime: 0, // Always consider data stale for loading sheet (needs to be current)
    refetchOnMount: true, // Refetch when component mounts (navigating to tab)
    refetchOnWindowFocus: false, // Don't refetch when window/tab gains focus
  });

  const onRefresh = useCallback(() => {
    truckLoadQuery.refetch();
  }, [truckLoadQuery]);

  const items = truckLoadQuery.data ?? [];

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Generic PDF action handler
  const handlePdfAction = async (actionType: 'preview' | 'download') => {
    if (!items || items.length === 0) {
      Alert.alert(
        'No Items',
        'There are no items to generate a loading sheet for.'
      );
      return;
    }

    const isPreview = actionType === 'preview';
    const setLoading = isPreview ? setIsPreviewingPdf : setIsDownloadingPdf;

    try {
      setLoading(true);
      const deliveryDate = new Date();
      const html = generateLoadingSheetHtml(items, deliveryDate);

      if (isPreview) {
        // Direct print preview
        await Print.printAsync({ html });
      } else {
        // Generate PDF file for download/share
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });

        // Check if sharing is available
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Loading Sheet - ${deliveryDate.toLocaleDateString()}`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          // Fallback for web or unsupported platforms
          if (Platform.OS === 'web') {
            // On web, open in new tab
            window.open(uri, '_blank');
          } else {
            Alert.alert('Download Complete', `Loading sheet saved to: ${uri}`, [
              { text: 'OK' },
            ]);
          }
        }
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error(
          `Error ${isPreview ? 'previewing' : 'downloading'} loading sheet:`,
          error
        );
      }
      Alert.alert(
        'Error',
        `Failed to ${isPreview ? 'preview' : 'download'} loading sheet. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF preview (direct print)
  const handlePreviewLoadingSheet = () => handlePdfAction('preview');

  // Handle PDF download/share
  const handleDownloadLoadingSheet = () => handlePdfAction('download');

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
              Items you need to deliver today
            </Text>
          </View>
          {items.length > 0 && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handlePreviewLoadingSheet}
                disabled={isPreviewingPdf || isDownloadingPdf}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: isPreviewingPdf || isDownloadingPdf ? 0.6 : 1,
                  },
                ]}
              >
                {isPreviewingPdf ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="print-outline" size={20} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDownloadLoadingSheet}
                disabled={isPreviewingPdf || isDownloadingPdf}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: isPreviewingPdf || isDownloadingPdf ? 0.6 : 1,
                  },
                ]}
              >
                {isDownloadingPdf ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="download-outline" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
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
          {items.map(item => {
            const isExpanded = expandedItems.has(item.item_id);
            return (
              <View
                key={item.item_id}
                style={[styles.itemCard, { backgroundColor: colors.surface }]}
              >
                <View style={styles.itemHeader}>
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
                      {item.total_quantity}{' '}
                      {pluralize('unit', item.total_quantity)} total
                    </Text>
                    <Text
                      style={[styles.itemMeta, { color: colors.textSecondary }]}
                    >
                      {item.restaurants?.length ?? 0}{' '}
                      {pluralize('restaurant', item.restaurants?.length ?? 0)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleItem(item.item_id)}
                    style={styles.expandButton}
                  >
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {isExpanded &&
                  item.restaurants &&
                  item.restaurants.length > 0 && (
                    <View
                      style={[
                        styles.restaurantsList,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      {item.restaurants.map(restaurant => (
                        <View
                          key={restaurant.restaurant_id}
                          style={styles.restaurantRow}
                        >
                          <View style={styles.restaurantInfo}>
                            <Ionicons
                              name="restaurant-outline"
                              size={18}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.restaurantName,
                                { color: colors.text },
                              ]}
                            >
                              {restaurant.restaurant_name}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.restaurantQuantity,
                              { color: colors.primary },
                            ]}
                          >
                            {restaurant.quantity}{' '}
                            {pluralize('unit', restaurant.quantity)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
              </View>
            );
          })}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  expandButton: {
    padding: 4,
    marginLeft: 8,
  },
  restaurantsList: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  restaurantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  restaurantName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  restaurantQuantity: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
