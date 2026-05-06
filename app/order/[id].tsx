import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import {
  FontFamily,
  FontSize,
  LetterSpacing,
  LineHeight,
} from '@/constants/Typography';
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
import {
  OrderStatus,
  updateOrderStatus,
  updateOrderDeliveryDate,
} from '@/lib/supabase';
import { STATUS_CONFIG, getStatusColor } from '@/components/OrderListItem';
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
import React, { useReducer, useCallback } from 'react';
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
        predicate: query => {
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
            <Ionicons name="arrow-back" size={24} color={colors.primaryTint} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primaryTint }]}>
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

  const status = orderSummary.order_status as OrderStatus;
  const statusColor = getStatusColor(status, colors);
  const statusInfo = STATUS_CONFIG[status];
  const canChangeStatus = isEmployee || isAdmin;
  const isUnfinalized = orderSummary.final_total <= 0;

  const statusPill = (
    <View
      style={[
        styles.statusPill,
        { backgroundColor: statusColor + '20' },
      ]}
    >
      <Ionicons name={statusInfo.icon} size={14} color={statusColor} />
      <Text style={[styles.statusPillText, { color: statusColor }]}>
        {formatStatus(status).toUpperCase()}
      </Text>
    </View>
  );

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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.primaryTint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primaryTint }]}>
          Order Details
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Row A: Order ID + Status pill */}
          <View style={styles.cardRowSplit}>
            <View style={styles.fieldBlock}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Order ID
              </Text>
              <Text style={[styles.fieldValueLg, { color: colors.text }]}>
                #{orderSummary.order_id.slice(0, 8)}
              </Text>
            </View>
            {canChangeStatus ? (
              <TouchableOpacity
                onPress={() =>
                  dispatch({ type: 'SET_STATUS_DROPDOWN_OPEN', payload: true })
                }
                disabled={state.status.isUpdating}
                accessibilityRole="button"
                accessibilityLabel={`Status: ${formatStatus(status)}`}
                accessibilityHint="Tap to change status"
                style={state.status.isUpdating && styles.disabledOpacity}
              >
                {statusPill}
              </TouchableOpacity>
            ) : (
              statusPill
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Row B: Dates 2-col */}
          <View style={styles.cardRowSplit}>
            <View style={[styles.fieldBlock, styles.flex1]}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Order Date
              </Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                {formatDate(orderSummary.placed_at)}
              </Text>
            </View>
            <View style={[styles.fieldBlock, styles.flex1]}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Delivery Date
              </Text>
              {isAdmin ? (
                <TouchableOpacity
                  style={styles.editableDateContainer}
                  onPress={openDatePicker}
                  disabled={state.date.isUpdating}
                  accessibilityRole="button"
                  accessibilityLabel="Edit delivery date"
                >
                  <Text
                    style={[styles.fieldValue, { color: colors.primary }]}
                  >
                    {formatDate(orderSummary.delivery_at)}
                  </Text>
                  <Ionicons name="pencil" size={14} color={colors.primary} />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {formatDate(orderSummary.delivery_at)}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Row C: Restaurant */}
          <View style={styles.fieldBlock}>
            <Text
              style={[styles.fieldLabel, { color: colors.textSecondary }]}
            >
              Restaurant
            </Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>
              {orderSummary.restaurant.name}
            </Text>
          </View>
        </View>

        {/* Totals Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, { color: colors.text }]}>
              Subtotal
            </Text>
            <Text style={[styles.totalsValue, { color: colors.text }]}>
              {formatCurrency(
                orderSummary.final_subtotal > 0
                  ? orderSummary.final_subtotal
                  : orderSummary.subtotal
              )}
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              styles.dividerTight,
              { backgroundColor: colors.border },
            ]}
          />

          <View style={styles.totalsRow}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
              {formatCurrency(
                orderSummary.final_total > 0
                  ? orderSummary.final_total
                  : orderSummary.total
              )}
            </Text>
          </View>

          {isUnfinalized && (
            <View
              style={[
                styles.disclaimerBanner,
                { backgroundColor: colors.inputBackground },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={18}
                color={colors.info}
              />
              <Text
                style={[
                  styles.disclaimerBannerText,
                  { color: colors.textSecondary },
                ]}
              >
                Price is not finalized and may be subject to change upon
                delivery based on exact weights.
              </Text>
            </View>
          )}
        </View>

        {/* Invoice Actions */}
        <View style={styles.invoiceActions}>
          <TouchableOpacity
            style={[
              styles.invoiceButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary,
              },
              styles.previewButton,
            ]}
            onPress={handlePreviewInvoice}
            disabled={state.pdf.isPreviewing || state.pdf.isDownloading}
            accessibilityLabel="Preview invoice"
            accessibilityRole="button"
          >
            {state.pdf.isPreviewing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="eye-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[styles.invoiceButtonText, { color: colors.primary }]}
                >
                  Preview Invoice
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.invoiceButton,
              { backgroundColor: colors.primary },
              Shadow.button,
            ]}
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
                <Text style={[styles.invoiceButtonText, { color: '#fff' }]}>
                  Download PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Order Items Section */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Order Items
            </Text>
            <View
              style={[
                styles.countChip,
                { backgroundColor: colors.inputBackground },
              ]}
            >
              <Text
                style={[styles.countChipText, { color: colors.textSecondary }]}
              >
                {orderDetails.length} items
              </Text>
            </View>
          </View>

          {orderDetails.map((item, index) => {
            const unitPrice =
              item.final_unit_price > 0
                ? item.final_unit_price
                : item.unit_price;
            const lineTotal =
              item.final_line_total > 0
                ? item.final_line_total
                : item.line_total;
            const itemUnfinalized = item.final_line_total <= 0;

            return (
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
                      style={[
                        styles.itemMeta,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Qty: {item.quantity} × {formatCurrency(unitPrice)}
                    </Text>
                  </View>

                  <View style={styles.itemPriceContainer}>
                    <Text style={[styles.itemTotal, { color: colors.text }]}>
                      {formatCurrency(lineTotal)}
                    </Text>
                    {itemUnfinalized && (
                      <View
                        style={[
                          styles.estPriceBadge,
                          { backgroundColor: colors.accentSoft },
                        ]}
                      >
                        <Text
                          style={[
                            styles.estPriceBadgeText,
                            { color: colors.accentWarm },
                          ]}
                        >
                          Est. Price
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
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
            {(['pending', 'in_transit', 'delivered'] as const).map(
              optionStatus => {
                const isActive = orderSummary.order_status === optionStatus;
                const optionColor = getStatusColor(optionStatus, colors);
                const optionInfo = STATUS_CONFIG[optionStatus];
                return (
                  <TouchableOpacity
                    key={optionStatus}
                    style={[
                      styles.dropdownOption,
                      isActive && {
                        backgroundColor: optionColor + '20',
                      },
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleChangeStatus(optionStatus)}
                    disabled={state.status.isUpdating || isActive}
                  >
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: optionColor + '20' },
                      ]}
                    >
                      <Ionicons
                        name={optionInfo.icon}
                        size={14}
                        color={optionColor}
                      />
                      <Text
                        style={[styles.statusPillText, { color: optionColor }]}
                      >
                        {formatStatus(optionStatus).toUpperCase()}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={optionColor}
                      />
                    )}
                  </TouchableOpacity>
                );
              }
            )}
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
    paddingHorizontal: Spacing.s5,
    paddingVertical: Spacing.s4,
  },
  backButton: {
    padding: Spacing.s1,
  },
  headerTitle: {
    fontSize: FontSize.h1,
    fontFamily: FontFamily.sans.bold,
    letterSpacing: LetterSpacing.h1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.s5,
    paddingBottom: Spacing.s8 + Spacing.s2,
  },
  card: {
    padding: Spacing.s5,
    borderRadius: Radius.lg,
    marginBottom: Spacing.s4,
    ...Shadow.sm,
  },
  cardRowSplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.s4,
  },
  flex1: {
    flex: 1,
  },
  fieldBlock: {
    gap: Spacing.s1,
  },
  fieldLabel: {
    fontSize: FontSize.label,
    fontFamily: FontFamily.sans.regular,
  },
  fieldValue: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.sans.semibold,
  },
  fieldValueLg: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.sans.bold,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.s4,
  },
  dividerTight: {
    marginVertical: Spacing.s3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    paddingHorizontal: Spacing.s3,
    paddingVertical: Spacing.s2,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.sans.semibold,
    letterSpacing: 0.5,
  },
  disabledOpacity: {
    opacity: 0.5,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalsLabel: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.sans.regular,
  },
  totalsValue: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.sans.semibold,
  },
  grandTotalLabel: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.sans.bold,
  },
  grandTotalValue: {
    fontSize: FontSize.h1,
    fontFamily: FontFamily.sans.bold,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.s2,
    padding: Spacing.s3,
    borderRadius: Radius.md,
    marginTop: Spacing.s4,
  },
  disclaimerBannerText: {
    flex: 1,
    fontSize: FontSize.label,
    fontFamily: FontFamily.sans.regular,
    lineHeight: FontSize.label * LineHeight.normal,
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: Spacing.s3,
    marginBottom: Spacing.s6,
  },
  invoiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: Spacing.s4,
    borderRadius: Radius.md,
    gap: Spacing.s2,
  },
  previewButton: {
    borderWidth: 1.5,
  },
  invoiceButtonText: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.sans.semibold,
  },
  itemsSection: {
    marginBottom: Spacing.s5,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.s4,
  },
  sectionTitle: {
    fontSize: FontSize.h1,
    fontFamily: FontFamily.sans.bold,
    letterSpacing: LetterSpacing.h1,
  },
  countChip: {
    paddingHorizontal: Spacing.s3,
    paddingVertical: Spacing.s1,
    borderRadius: Radius.pill,
  },
  countChipText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.sans.semibold,
  },
  itemCard: {
    padding: Spacing.s3,
    borderRadius: Radius.md,
    marginBottom: Spacing.s3,
    ...Shadow.sm,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    marginRight: Spacing.s3,
  },
  itemImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: Radius.sm,
    marginRight: Spacing.s3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.s1,
  },
  itemName: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.sans.bold,
  },
  itemMeta: {
    fontSize: FontSize.label,
    fontFamily: FontFamily.sans.regular,
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
    marginLeft: Spacing.s3,
    gap: Spacing.s1,
  },
  itemTotal: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.sans.bold,
  },
  estPriceBadge: {
    paddingHorizontal: Spacing.s2,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  estPriceBadgeText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.sans.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.s8 + Spacing.s2,
  },
  emptyTitle: {
    fontSize: FontSize.h2,
    fontFamily: FontFamily.sans.semibold,
    marginTop: Spacing.s4,
    marginBottom: Spacing.s2,
  },
  emptySubtitle: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.sans.regular,
    textAlign: 'center',
  },
  editableDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.s5,
  },
  dropdownModal: {
    width: '100%',
    maxWidth: 300,
    borderRadius: Radius.lg,
    padding: Spacing.s4,
    ...Shadow.md,
  },
  dropdownTitle: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.sans.semibold,
    marginBottom: Spacing.s4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.s3,
    paddingHorizontal: Spacing.s1,
    borderBottomWidth: 1,
  },
  datePickerModal: {
    width: '100%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing.s5,
    position: 'absolute',
    bottom: 0,
    padding: Spacing.s4,
    ...Shadow.md,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s4,
    paddingHorizontal: Spacing.s2,
  },
});
