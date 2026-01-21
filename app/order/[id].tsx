import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  useOrderDetails,
  ORDER_DETAILS_QUERY_KEY,
} from '@/hooks/useOrderDetails';
import { useEmployee } from '@/hooks/useEmployee';
import { useAdmin } from '@/hooks/useAdmin';
import { updateOrderStatus, updateOrderDeliveryDate } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Toast } from '@/components/ui/Toast';
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
import React, { useCallback, useReducer } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingView } from '@/components/ThemedView';
import { orderReducer, initialState } from '@/reducers/orderReducer';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const {
    data: orderDetails = [],
    isLoading,
    isError,
    error,
  } = useOrderDetails(id);
  const { data: isEmployee = false } = useEmployee();
  const { data: isAdmin = false } = useAdmin();
  const queryClient = useQueryClient();

  const [state, dispatch] = useReducer(orderReducer, initialState);

  const invalidateOrderQueries = useCallback(async () => {
    // Invalidate all order-related and admin dashboard queries efficiently
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [...ORDER_DETAILS_QUERY_KEY, id],
      }),
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            typeof key === 'string' &&
            (key.startsWith('admin-') || key === 'admin-all-orders')
          );
        },
      }),
    ]);
  }, [id, queryClient]);

  const handleChangeStatus = async (
    newStatus: 'pending' | 'in_transit' | 'delivered'
  ) => {
    if (!orderSummary || state.status.isUpdating) return;

    try {
      dispatch({ type: 'SET_STATUS_UPDATING', payload: true });
      dispatch({ type: 'SET_STATUS_DROPDOWN_OPEN', payload: false });
      await updateOrderStatus(orderSummary.order_id, newStatus);

      await invalidateOrderQueries();

      dispatch({ type: 'SET_SHOW_STATUS_TOAST', payload: true });
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error updating order status:', err);
      }
      Alert.alert(
        'Error',
        'Failed to update order status. Please try again later.'
      );
    } finally {
      dispatch({ type: 'SET_STATUS_UPDATING', payload: false });
    }
  };

  const handleDateChange = async (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    // On Android, dismissing the picker returns undefined selectedDate
    if (Platform.OS === 'android') {
      dispatch({ type: 'SET_SHOW_DATE_PICKER', payload: false });
      // Only update if the user clicked "OK" (event.type === 'set')
      if (event.type === 'set' && selectedDate) {
        await saveDeliveryDate(selectedDate);
      }
      return;
    }

    if (selectedDate && orderSummary && Platform.OS === 'ios') {
      // On iOS, we just update the temp date and wait for "Done"
      dispatch({ type: 'SET_TEMP_DATE', payload: selectedDate });
    }
  };

  const saveDeliveryDate = async (date: Date) => {
    if (!orderSummary) return;

    try {
      dispatch({ type: 'SET_DATE_UPDATING', payload: true });
      await updateOrderDeliveryDate(orderSummary.order_id, date);

      await invalidateOrderQueries();

      if (Platform.OS === 'ios') {
        dispatch({ type: 'SET_SHOW_DATE_PICKER', payload: false });
      }

      Alert.alert('Success', 'Delivery date updated successfully');
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error updating delivery date:', err);
      }
      Alert.alert(
        'Error',
        'Failed to update delivery date. Please try again later.'
      );
    } finally {
      dispatch({ type: 'SET_DATE_UPDATING', payload: false });
    }
  };

  const openDatePicker = () => {
    if (orderSummary?.delivery_at) {
      dispatch({
        type: 'SET_TEMP_DATE',
        payload: new Date(orderSummary.delivery_at),
      });
    } else {
      dispatch({ type: 'SET_TEMP_DATE', payload: new Date() });
    }
    dispatch({ type: 'SET_SHOW_DATE_PICKER', payload: true });
  };

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
      dispatch({ type: 'SET_PDF_PREVIEWING', payload: true });
      const html = generateInvoiceHtml(orderDetails, orderSummary);
      await Print.printAsync({ html });
    } catch (err) {
      // Don't show error if user just cancelled the preview
      const isCancelled =
        err instanceof Error &&
        (err.message.toLowerCase().includes('cancel') ||
          err.message.toLowerCase().includes('dismissed'));

      if (!isCancelled) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.error('Error previewing invoice:', err);
        }
        Alert.alert('Error', 'Failed to preview invoice. Please try again.');
      }
    } finally {
      dispatch({ type: 'SET_PDF_PREVIEWING', payload: false });
    }
  };

  // Handle PDF download/share
  const handleDownloadInvoice = async () => {
    if (!orderSummary) return;

    try {
      dispatch({ type: 'SET_PDF_DOWNLOADING', payload: true });
      const html = generateInvoiceHtml(orderDetails, orderSummary);

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
      dispatch({ type: 'SET_PDF_DOWNLOADING', payload: false });
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
        <LoadingView message="Loading order details..." />
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
      <Toast
        message="Order status updated"
        type="success"
        visible={state.status.showToast}
        onHide={() =>
          dispatch({ type: 'SET_SHOW_STATUS_TOAST', payload: false })
        }
      />
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
            {isEmployee || isAdmin ? (
              <TouchableOpacity
                style={[
                  styles.statusDropdown,
                  { borderColor: colors.border },
                  state.status.isUpdating && styles.statusDropdownDisabled,
                ]}
                onPress={() =>
                  dispatch({ type: 'SET_STATUS_DROPDOWN_OPEN', payload: true })
                }
                disabled={state.status.isUpdating}
              >
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(
                        orderSummary.order_status
                      ),
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {formatStatus(orderSummary.order_status)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(orderSummary.order_status),
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {formatStatus(orderSummary.order_status)}
                </Text>
              </View>
            )}
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
            {isAdmin ? (
              <TouchableOpacity
                style={styles.editableDateContainer}
                onPress={openDatePicker}
                disabled={state.date.isUpdating}
              >
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {formatDate(orderSummary.delivery_at)}
                </Text>
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatDate(orderSummary.delivery_at)}
              </Text>
            )}
          </View>

          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Restaurant
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {orderSummary.restaurant.name}
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
              {formatCurrency(
                orderSummary.final_subtotal > 0
                  ? orderSummary.final_subtotal
                  : orderSummary.subtotal
              )}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {formatCurrency(
                orderSummary.final_total > 0
                  ? orderSummary.final_total
                  : orderSummary.total
              )}
            </Text>
          </View>

          {orderSummary.final_total <= 0 && (
            <View
              style={[
                styles.disclaimerContainer,
                { borderTopColor: colors.border },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.disclaimerText, { color: colors.textTertiary }]}
              >
                Price is not finalized
              </Text>
            </View>
          )}
        </View>

        {/* Invoice Actions */}
        <View style={styles.invoiceActions}>
          <TouchableOpacity
            style={[styles.invoiceButton, styles.previewButton]}
            onPress={handlePreviewInvoice}
            disabled={state.pdf.isPreviewing || state.pdf.isDownloading}
            accessibilityLabel="Preview invoice"
            accessibilityRole="button"
          >
            {state.pdf.isPreviewing ? (
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
            disabled={state.pdf.isPreviewing || state.pdf.isDownloading}
            accessibilityLabel="Download invoice as PDF"
            accessibilityRole="button"
          >
            {state.pdf.isDownloading ? (
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
                    {formatCurrency(
                      item.final_unit_price > 0
                        ? item.final_unit_price
                        : item.unit_price
                    )}{' '}
                    each
                  </Text>
                  {item.final_line_total <= 0 && (
                    <View style={styles.itemDisclaimerContainer}>
                      <Ionicons
                        name="information-circle-outline"
                        size={12}
                        color={colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.itemDisclaimerText,
                          { color: colors.textTertiary },
                        ]}
                      >
                        Price not finalized
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.itemPriceContainer}>
                  <Text style={[styles.itemTotal, { color: colors.text }]}>
                    {formatCurrency(
                      item.final_line_total > 0
                        ? item.final_line_total
                        : item.line_total
                    )}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Date Picker Modal/Component */}
      {state.date.showPicker &&
        (Platform.OS === 'ios' ? (
          <Modal
            visible={state.date.showPicker}
            transparent
            animationType="fade"
            onRequestClose={() =>
              dispatch({ type: 'SET_SHOW_DATE_PICKER', payload: false })
            }
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.datePickerModal,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity
                    onPress={() =>
                      dispatch({ type: 'SET_SHOW_DATE_PICKER', payload: false })
                    }
                  >
                    <Text style={{ color: colors.error, fontSize: 16 }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.dropdownTitle,
                      { marginBottom: 0, color: colors.text },
                    ]}
                  >
                    Select Date
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      state.date.tempDate &&
                      saveDeliveryDate(state.date.tempDate)
                    }
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 16,
                        fontWeight: '600',
                      }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={state.date.tempDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  textColor={colors.text}
                  minimumDate={new Date()}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={state.date.tempDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        ))}

      {/* Status Dropdown Modal */}
      <Modal
        visible={state.status.isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          dispatch({ type: 'SET_STATUS_DROPDOWN_OPEN', payload: false })
        }
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() =>
            dispatch({ type: 'SET_STATUS_DROPDOWN_OPEN', payload: false })
          }
        >
          <View
            style={[styles.dropdownModal, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>
              Select Status
            </Text>
            {(['pending', 'in_transit', 'delivered'] as const).map(status => {
              const isActive = orderSummary.order_status === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.dropdownOption,
                    isActive && {
                      backgroundColor: getStatusColor(status) + '20',
                    },
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleChangeStatus(status)}
                  disabled={state.status.isUpdating || isActive}
                >
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(status),
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {formatStatus(status)}
                    </Text>
                  </View>
                  {isActive && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={getStatusColor(status)}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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
  statusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  statusDropdownDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
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
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  disclaimerText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  itemDisclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  itemDisclaimerText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  editableDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 4,
  },
  datePickerModal: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
});
