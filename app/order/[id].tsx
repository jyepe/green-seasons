import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOrderDetails } from '@/hooks/useOrderDetails';
import {
  formatCurrency,
  formatDate,
  formatStatus,
  generateInvoiceHtml,
} from '@/utils/invoice';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    data: orderDetails = [],
    isLoading,
    isError,
    error,
  } = useOrderDetails(id);
  const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Get order summary (first item contains all order-level info)
  const orderSummary = orderDetails[0];

  // Helper function to get status color
  const getStatusColor = useCallback(
    (status: string) => {
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
    },
    [colors.success]
  );

  // Handle PDF preview
  const handlePreviewInvoice = async () => {
    if (!orderSummary) return;

    try {
      setIsPreviewingPdf(true);
      const html = generateInvoiceHtml(
        orderDetails,
        orderSummary,
        getStatusColor(orderSummary.order_status)
      );
      await Print.printAsync({ html });
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error previewing invoice:', error);
      }
      Alert.alert('Error', 'Failed to preview invoice. Please try again.');
    } finally {
      setIsPreviewingPdf(false);
    }
  };

  // Handle PDF download/share
  const handleDownloadInvoice = async () => {
    if (!orderSummary) return;

    try {
      setIsDownloadingPdf(true);
      const html = generateInvoiceHtml(
        orderDetails,
        orderSummary,
        getStatusColor(orderSummary.order_status)
      );

      // Generate PDF file
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice #${orderSummary.order_id.slice(0, 8)}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        // Fallback for web or unsupported platforms
        if (Platform.OS === 'web') {
          // On web, open in new tab
          window.open(uri, '_blank');
        } else {
          Alert.alert('Download Complete', `Invoice saved to: ${uri}`, [
            { text: 'OK' },
          ]);
        }
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error downloading invoice:', error);
      }
      Alert.alert('Error', 'Failed to download invoice. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isError) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text
          style={{ color: 'red', textAlign: 'center', paddingHorizontal: 16 }}
        >
          {error instanceof Error
            ? error.message
            : 'An error occurred while loading the order details.'}
        </Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!orderSummary) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Order Details
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Order Not Found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            This order could not be found or you don&apos;t have permission to
            view it.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Order Details
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Order ID
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              #{orderSummary.order_id.slice(0, 8)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Status
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(orderSummary.order_status) },
              ]}
            >
              <Text style={styles.statusText}>
                {formatStatus(orderSummary.order_status)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Order Date
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatDate(orderSummary.placed_at)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Delivery Date
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatDate(orderSummary.delivery_at)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Restaurant
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {orderSummary.restaurant_name}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Subtotal
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatCurrency(orderSummary.subtotal)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {formatCurrency(orderSummary.total)}
            </Text>
          </View>
        </View>

        {/* Invoice Actions */}
        <View style={styles.invoiceActions}>
          <TouchableOpacity
            style={[styles.invoiceButton, styles.previewButton]}
            onPress={handlePreviewInvoice}
            disabled={isPreviewingPdf || isDownloadingPdf}
            accessibilityLabel="Preview invoice"
            accessibilityRole="button"
          >
            {isPreviewingPdf ? (
              <ActivityIndicator size="small" color="#16a34a" />
            ) : (
              <>
                <Ionicons name="eye-outline" size={20} color="#16a34a" />
                <Text style={styles.previewButtonText}>Preview Invoice</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.invoiceButton, styles.downloadButton]}
            onPress={handleDownloadInvoice}
            disabled={isPreviewingPdf || isDownloadingPdf}
            accessibilityLabel="Download invoice as PDF"
            accessibilityRole="button"
          >
            {isDownloadingPdf ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.downloadButtonText}>Download PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Order Items Section */}
        <View style={styles.itemsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Order Items ({orderDetails.length})
          </Text>

          {orderDetails.map((item, index) => (
            <View
              key={`${item.item_id}-${index}`}
              style={[styles.itemCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.itemContent}>
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
                      size={32}
                      color={colors.textTertiary}
                    />
                  </View>
                )}

                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {item.item_name}
                  </Text>
                  <Text
                    style={[
                      styles.itemQuantity,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Quantity: {item.quantity}
                  </Text>
                  <Text
                    style={[styles.itemPrice, { color: colors.textSecondary }]}
                  >
                    {formatCurrency(item.unit_price)} each
                  </Text>
                </View>

                <View style={styles.itemPriceContainer}>
                  <Text style={[styles.itemTotal, { color: colors.text }]}>
                    {formatCurrency(item.line_total)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  itemsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  invoiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  previewButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  downloadButton: {
    backgroundColor: '#16a34a',
  },
  previewButtonText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  itemCard: {
    padding: 16,
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
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
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
});
