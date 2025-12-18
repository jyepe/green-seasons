import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOrderDetails } from '@/hooks/useOrderDetails';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
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
  const { data: orderDetails = [], isLoading } = useOrderDetails(id);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString('en-US', {
      month: 'long',
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

  // Helper function to capitalize status
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get order summary (first item contains all order-level info)
  const orderSummary = orderDetails[0];

  // Helper function to escape HTML entities to prevent XSS attacks
  const escapeHtml = (text: string | null | undefined): string => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Generate invoice HTML
  const generateInvoiceHtml = () => {
    if (!orderSummary) return '';

    const itemsHtml = orderDetails
      .map(
        item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.item_name)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.line_total)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice #${escapeHtml(orderSummary.order_id.slice(0, 8))}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              padding: 40px; 
              color: #1f2937;
              background: #fff;
            }
            .invoice-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              margin-bottom: 40px; 
              padding-bottom: 20px;
              border-bottom: 2px solid #16a34a;
            }
            .company-name { 
              font-size: 28px; 
              font-weight: 700; 
              color: #16a34a;
              margin-bottom: 4px;
            }
            .company-tagline {
              font-size: 14px;
              color: #6b7280;
            }
            .invoice-title { 
              text-align: right;
            }
            .invoice-title h1 {
              font-size: 32px; 
              font-weight: 700; 
              color: #1f2937;
              margin-bottom: 8px;
            }
            .invoice-number {
              font-size: 16px;
              color: #6b7280;
            }
            .info-section { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 40px;
            }
            .info-block h3 { 
              font-size: 12px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              color: #6b7280; 
              margin-bottom: 8px;
            }
            .info-block p { 
              font-size: 14px; 
              line-height: 1.6;
              color: #374151;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              background: ${getStatusColor(orderSummary.order_status)};
              color: white;
              margin-top: 8px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 30px;
            }
            th { 
              background: #f9fafb; 
              padding: 14px 12px; 
              text-align: left; 
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              font-weight: 600;
              border-bottom: 2px solid #e5e7eb;
            }
            th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
            th:nth-child(3), th:nth-child(4) { text-align: right; }
            td { 
              font-size: 14px;
              color: #374151;
            }
            .totals { 
              margin-left: auto;
              width: 280px;
            }
            .totals-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .totals-row.total { 
              font-weight: 700; 
              font-size: 18px;
              border-bottom: none;
              padding-top: 16px;
              color: #1f2937;
            }
            .totals-row span:first-child {
              color: #6b7280;
            }
            .totals-row.total span:first-child {
              color: #1f2937;
            }
            .footer { 
              margin-top: 60px; 
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center; 
              color: #9ca3af;
              font-size: 12px;
            }
            .footer p { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div>
              <div class="company-name">Green Seasons</div>
              <div class="company-tagline">Fresh produce delivered to you</div>
            </div>
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <div class="invoice-number">#${escapeHtml(orderSummary.order_id.slice(0, 8).toUpperCase())}</div>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-block">
              <h3>Restaurant</h3>
              <p><strong>${escapeHtml(orderSummary.restaurant_name)}</strong></p>
            </div>
            <div class="info-block">
              <h3>Order Date</h3>
              <p>${formatDate(orderSummary.placed_at)}</p>
            </div>
            <div class="info-block">
              <h3>Delivery Date</h3>
              <p>${formatDate(orderSummary.delivery_at)}</p>
            </div>
            <div class="info-block">
              <h3>Status</h3>
              <span class="status-badge">${escapeHtml(formatStatus(orderSummary.order_status))}</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>${formatCurrency(orderSummary.subtotal)}</span>
            </div>
            <div class="totals-row total">
              <span>Total</span>
              <span>${formatCurrency(orderSummary.total)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your order!</p>
            <p>Green Seasons - Quality Produce for Your Business</p>
          </div>
        </body>
      </html>
    `;
  };

  // Handle PDF preview
  const handlePreviewInvoice = async () => {
    if (!orderSummary) return;

    try {
      setIsGeneratingPdf(true);
      const html = generateInvoiceHtml();
      await Print.printAsync({ html });
    } catch {
      Alert.alert('Error', 'Failed to preview invoice. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle PDF download/share
  const handleDownloadInvoice = async () => {
    if (!orderSummary) return;

    try {
      setIsGeneratingPdf(true);
      const html = generateInvoiceHtml();

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
    } catch {
      Alert.alert('Error', 'Failed to download invoice. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
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
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
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
