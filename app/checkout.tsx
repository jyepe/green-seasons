import React, { useEffect, useReducer } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAdmin } from '@/hooks/useAdmin';
import { useCreateOrder } from '@/hooks/useOrders';
import {
  getAllRestaurants,
  getUserInfoById,
  type Restaurant,
} from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import {
  checkoutReducer,
  initialCheckoutState,
  type PaymentMethod,
} from '../reducers/checkoutReducer';

type PaymentOption = {
  value: PaymentMethod;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CheckoutScreen() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const { data: userInfo, isLoading: isUserInfoLoading } = useUserInfo();
  const { data: isUserAdmin } = useAdmin();
  const restaurantId = userInfo?.owned_restaurant_id;
  const { data: restaurant, isLoading: isRestaurantLoading } =
    useRestaurant(restaurantId);
  const createOrderMutation = useCreateOrder();

  // Get all restaurants for admin dropdown
  const { data: allRestaurants = [] } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: getAllRestaurants,
    enabled: isUserAdmin === true,
  });

  const [state, dispatch] = useReducer(
    checkoutReducer,
    initialCheckoutState,
    initial => ({
      ...initial,
      selectedRestaurantId: restaurantId || null,
    })
  );

  // Update selectedRestaurantId when restaurantId (from props/user) becomes available
  useEffect(() => {
    if (restaurantId && !state.selectedRestaurantId) {
      dispatch({ type: 'SET_SELECTED_RESTAURANT_ID', payload: restaurantId });
    }
  }, [restaurantId, state.selectedRestaurantId]);

  // Load restaurant data when selected restaurant changes
  const { data: selectedRestaurant } = useRestaurant(
    state.selectedRestaurantId || undefined
  );

  // Get owner info when admin selects a restaurant
  const { data: ownerInfo } = useQuery({
    queryKey: ['owner-info', selectedRestaurant?.owner_id],
    queryFn: () =>
      selectedRestaurant?.owner_id
        ? getUserInfoById(selectedRestaurant.owner_id)
        : null,
    enabled:
      isUserAdmin === true &&
      !!selectedRestaurant?.owner_id &&
      !!state.selectedRestaurantId,
  });

  // Sync state with restaurant data
  useEffect(() => {
    dispatch({
      type: 'SYNC_RESTAURANT_DATA',
      payload: {
        restaurant: restaurant || null,
        selectedRestaurant: selectedRestaurant || null,
      },
    });
  }, [restaurant, selectedRestaurant]);

  // Sync contact info based on user/admin status and available data
  useEffect(() => {
    dispatch({
      type: 'SYNC_CONTACT_DATA',
      payload: {
        isUserAdmin: !!isUserAdmin,
        userInfo: userInfo || null,
        ownerInfo: ownerInfo || null,
      },
    });
  }, [isUserAdmin, ownerInfo, userInfo]);

  // Handle restaurant selection for admin
  const handleRestaurantSelect = (rest: Restaurant) => {
    dispatch({ type: 'SELECT_ADMIN_RESTAURANT', payload: rest });
  };

  const handleAndroidDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (event.type === 'set' && selectedDate) {
      dispatch({ type: 'SET_DELIVERY_DATE', payload: selectedDate });
    }
  };

  const handleShowDatePicker = () => {
    const baseDate = state.deliveryDate ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: 'date',
        display: 'calendar',
        onChange: handleAndroidDateChange,
        minimumDate: new Date(),
      });
    } else {
      dispatch({ type: 'OPEN_IOS_PICKER', payload: baseDate });
    }
  };

  const handleIosDateChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (selectedDate) {
      dispatch({ type: 'SET_IOS_TEMP_DATE', payload: selectedDate });
    }
  };

  const handleIosConfirm = () => {
    dispatch({ type: 'CONFIRM_IOS_DATE' });
  };

  const handleIosCancel = () => {
    dispatch({ type: 'CANCEL_IOS_DATE' });
  };

  const paymentOptions: PaymentOption[] = [
    {
      value: 'cash',
      icon: 'cash',
      label: 'Cash on Delivery',
    },
  ];

  const isLoadingDetails =
    isUserInfoLoading || (!!restaurantId && isRestaurantLoading);

  const handlePlaceOrder = async () => {
    const activeRestaurantId = isUserAdmin
      ? state.selectedRestaurantId
      : restaurantId;

    if (!activeRestaurantId) {
      Alert.alert(
        'Error',
        'Restaurant information is missing. Please select a restaurant.'
      );
      return;
    }

    if (!state.deliveryDate) {
      Alert.alert(
        'Delivery Date Required',
        'Please select a preferred delivery date before placing your order.'
      );
      return;
    }

    try {
      const order = await createOrderMutation.mutateAsync({
        restaurantId: activeRestaurantId,
        deliveryAt: state.deliveryDate,
        paymentMethod: state.paymentMethod,
      });
      Alert.alert(
        'Order Placed Successfully!',
        `Your order has been placed. Order ID: ${order.id.substring(0, 8)}...\nTotal: $${order.total_amount.toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace(
                isUserAdmin ? '/admin/(tabs)/cart' : '/(tabs)/cart'
              );
            },
          },
        ]
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to place order. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const deliveryDateLabel = state.deliveryDate
    ? formatDate(state.deliveryDate)
    : 'Select delivery date';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Checkout',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        {isLoadingDetails ? (
          <View
            style={styles.loadingContainer}
            accessible={true}
            accessibilityLabel="Loading checkout details"
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading checkout details...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() =>
              dispatch({ type: 'SET_DROPDOWN_VISIBLE', payload: false })
            }
          >
            {!restaurant && (
              <View
                style={[
                  styles.notice,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.noticeTitle, { color: colors.text }]}
                  accessibilityRole="header"
                >
                  Restaurant details missing
                </Text>
                <Text
                  style={[styles.noticeBody, { color: colors.textSecondary }]}
                >
                  We couldn&apos;t find a restaurant linked to your account. Add
                  one to keep your checkout information up to date.
                </Text>
              </View>
            )}

            {/* Restaurant Information Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.sectionTitle, { color: colors.text }]}
                accessibilityRole="header"
              >
                Restaurant Information
              </Text>

              <View style={styles.fullColumn}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Restaurant Name
                </Text>
                {isUserAdmin ? (
                  <View>
                    <TouchableOpacity
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.border,
                          borderWidth: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        },
                      ]}
                      onPress={() => dispatch({ type: 'TOGGLE_DROPDOWN' })}
                      accessibilityRole="combobox"
                      accessibilityLabel="Select a restaurant"
                      accessibilityState={{ expanded: state.dropdownVisible }}
                    >
                      <Text
                        style={{
                          color: state.restaurantName
                            ? colors.text
                            : colors.textSecondary,
                          fontSize: 16,
                          flex: 1,
                        }}
                      >
                        {state.restaurantName || 'Select a restaurant'}
                      </Text>
                      <Ionicons
                        name={
                          state.dropdownVisible ? 'chevron-up' : 'chevron-down'
                        }
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                    {state.dropdownVisible && (
                      <View
                        style={[
                          styles.dropdown,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <ScrollView
                          style={styles.dropdownScroll}
                          nestedScrollEnabled
                        >
                          {allRestaurants.map(rest => (
                            <TouchableOpacity
                              key={rest.id}
                              style={[
                                styles.dropdownItem,
                                state.selectedRestaurantId === rest.id && {
                                  backgroundColor: colors.primary + '20',
                                },
                              ]}
                              onPress={() => handleRestaurantSelect(rest)}
                              accessibilityRole="button"
                              accessibilityLabel={rest.name}
                              accessibilityState={{
                                selected:
                                  state.selectedRestaurantId === rest.id,
                              }}
                            >
                              <Text
                                style={[
                                  styles.dropdownItemText,
                                  { color: colors.text },
                                  state.selectedRestaurantId === rest.id && {
                                    color: colors.primary,
                                    fontWeight: '600',
                                  },
                                ]}
                              >
                                {rest.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.input,
                      styles.readOnlyInput,
                      {
                        backgroundColor: colors.inputBackground,
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Text style={{ color: colors.text, fontSize: 16 }}>
                      {state.restaurantName}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.fullColumn}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Contact Person
                </Text>
                <View
                  style={[
                    styles.input,
                    styles.readOnlyInput,
                    {
                      backgroundColor: colors.inputBackground,
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Text style={{ color: colors.text, fontSize: 16 }}>
                    {state.contactPerson}
                  </Text>
                </View>
              </View>

              <View style={styles.fullColumn}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Phone Number
                </Text>
                <View
                  style={[
                    styles.input,
                    styles.readOnlyInput,
                    {
                      backgroundColor: colors.inputBackground,
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Text style={{ color: colors.text, fontSize: 16 }}>
                    {state.phoneNumber}
                  </Text>
                </View>
              </View>

              <View style={styles.fullColumn}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Email
                </Text>
                {isUserAdmin ? (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                    value={state.email}
                    onChangeText={text =>
                      dispatch({ type: 'SET_EMAIL', payload: text })
                    }
                    placeholder="Enter email address"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Email address"
                  />
                ) : (
                  <View
                    style={[
                      styles.input,
                      styles.readOnlyInput,
                      {
                        backgroundColor: colors.inputBackground,
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Text style={{ color: colors.text, fontSize: 16 }}>
                      {state.email}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Delivery Information Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.sectionTitle, { color: colors.text }]}
                accessibilityRole="header"
              >
                Delivery Information
              </Text>

              <View style={styles.fullColumn}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Delivery Address
                </Text>
                <View
                  style={[
                    styles.input,
                    styles.textArea,
                    styles.readOnlyInput,
                    {
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                >
                  <Text
                    style={{ color: colors.text, fontSize: 16, lineHeight: 22 }}
                  >
                    {state.deliveryAddress}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfColumn}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Preferred Delivery Date
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.dateInput,
                      {
                        backgroundColor: colors.inputBackground,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={handleShowDatePicker}
                    accessibilityRole="button"
                    accessibilityLabel={`Preferred Delivery Date, ${deliveryDateLabel}`}
                    accessibilityHint="Opens date picker"
                  >
                    <Text
                      style={[
                        styles.dateValue,
                        {
                          color: state.deliveryDate
                            ? colors.text
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {deliveryDateLabel}
                    </Text>
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fullColumn}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Special Instructions (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                    },
                  ]}
                  value={state.specialInstructions}
                  onChangeText={text =>
                    dispatch({
                      type: 'SET_SPECIAL_INSTRUCTIONS',
                      payload: text,
                    })
                  }
                  placeholder="Loading dock instructions, specific requirements, etc."
                  placeholderTextColor={colors.tabIconDefault}
                  multiline
                  numberOfLines={4}
                  accessibilityLabel="Special Instructions"
                />
              </View>
            </View>

            {/* Payment Method Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.sectionTitle, { color: colors.text }]}
                accessibilityRole="header"
              >
                Payment Method
              </Text>

              {paymentOptions.map(option => {
                const selected = state.paymentMethod === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.paymentOption}
                    onPress={() =>
                      dispatch({
                        type: 'SET_PAYMENT_METHOD',
                        payload: option.value,
                      })
                    }
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={option.label}
                  >
                    <View
                      style={[
                        styles.radio,
                        { borderColor: colors.border },
                        selected && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      {selected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.paymentIcon}>
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={colors.text}
                      />
                    </View>
                    <Text style={[styles.paymentText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Footer with Place Order Button */}
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              {
                backgroundColor: colors.primary,
                opacity: createOrderMutation.isPending ? 0.6 : 1,
              },
            ]}
            onPress={handlePlaceOrder}
            disabled={createOrderMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Place Order"
            accessibilityState={{
              disabled: createOrderMutation.isPending,
              busy: createOrderMutation.isPending,
            }}
          >
            {createOrderMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>

        {Platform.OS === 'ios' && (
          <Modal
            transparent
            animationType="slide"
            visible={state.iosPickerVisible}
            onRequestClose={handleIosCancel}
          >
            <View style={styles.modalBackdrop}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={handleIosCancel}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel date selection"
                  >
                    <Text
                      style={[
                        styles.modalAction,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={[styles.modalTitle, { color: colors.text }]}
                    accessibilityRole="header"
                  >
                    Select delivery date
                  </Text>
                  <TouchableOpacity
                    onPress={handleIosConfirm}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm date selection"
                  >
                    <Text
                      style={[styles.modalAction, { color: colors.primary }]}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={state.iosTempDate}
                  mode="date"
                  display="inline"
                  onChange={handleIosDateChange}
                  themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                  textColor={colors.text}
                  style={styles.iosPicker}
                  minimumDate={new Date()}
                />
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </>
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
    paddingBottom: 32,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notice: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noticeBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfColumn: {
    flex: 1,
  },
  fullColumn: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 50,
  },
  readOnlyInput: {
    opacity: 0.85,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
    lineHeight: 22,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  paymentIcon: {
    marginRight: 12,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  placeOrderButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    width: '100%',
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownItemText: {
    fontSize: 16,
  },
});
