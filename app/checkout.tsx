// app/checkout.tsx
import React, { useEffect, useMemo, useReducer, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAdmin } from '@/hooks/useAdmin';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { getAllRestaurants, type Restaurant } from '@/lib/supabase';
import { Toast } from '@/components/ui/Toast';
import {
  CheckoutFooter,
  CheckoutStepper,
  CheckoutTopBar,
  StepConfirmed,
  StepDelivery,
  StepPayment,
  StepReview,
  generateDeliverySlots,
  type DeliverySlot,
  type StepperStep,
} from '@/components/checkout';
import {
  checkoutReducer,
  initialCheckoutState,
} from '../reducers/checkoutReducer';

const STEPS: StepperStep[] = [
  { id: 'delivery', label: 'Delivery' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
];

const ARRIVES_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

function CheckoutScreenInner() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const { data: userInfo, isLoading: isUserInfoLoading } = useUserInfo();
  const { data: isUserAdmin } = useAdmin();
  const restaurantId = userInfo?.owned_restaurant_id;
  const { data: restaurant, isLoading: isRestaurantLoading } =
    useRestaurant(restaurantId);
  const createOrderMutation = useCreateOrder();
  const { data: cartItems = [] } = useCart();

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

  const slots = useMemo(() => generateDeliverySlots(new Date()), []);

  // Prime the default slot once when slots are generated.
  useEffect(() => {
    if (!state.selectedSlotId && !state.deliveryDate && slots.length > 0) {
      dispatch({
        type: 'SET_SLOT',
        payload: { slotId: slots[0].id, slotDate: slots[0].date },
      });
    }
  }, [slots, state.selectedSlotId, state.deliveryDate]);

  // Mirror restaurantId into reducer when it loads (owner path).
  useEffect(() => {
    if (restaurantId && !state.selectedRestaurantId) {
      dispatch({ type: 'SET_SELECTED_RESTAURANT_ID', payload: restaurantId });
    }
  }, [restaurantId, state.selectedRestaurantId]);

  const { data: selectedRestaurant } = useRestaurant(
    state.selectedRestaurantId || undefined
  );
  const activeRestaurant = selectedRestaurant ?? restaurant ?? null;

  const handleSelectRestaurant = (rest: Restaurant) => {
    dispatch({ type: 'SELECT_ADMIN_RESTAURANT', payload: rest });
  };

  const handleSelectSlot = (slot: DeliverySlot) => {
    dispatch({
      type: 'SET_SLOT',
      payload: { slotId: slot.id, slotDate: slot.date },
    });
  };

  const handleAndroidDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (event.type === 'set' && selectedDate) {
      dispatch({ type: 'SET_DELIVERY_DATE', payload: selectedDate });
    }
  };

  const handlePickOtherDate = () => {
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

  const customDate =
    !state.selectedSlotId && state.deliveryDate ? state.deliveryDate : null;

  const subtotal = useMemo(
    () => cartItems.reduce((acc, line) => acc + line.line_subtotal, 0),
    [cartItems]
  );
  const totals = {
    subtotal,
    delivery: 0,
    tax: 0,
    discount: 0,
    total: subtotal,
  };

  const selectedSlot = useMemo(() => {
    if (state.selectedSlotId) {
      return slots.find(s => s.id === state.selectedSlotId) ?? null;
    }
    return null;
  }, [slots, state.selectedSlotId]);

  const slotSummary = selectedSlot
    ? { day: selectedSlot.day, window: selectedSlot.window }
    : customDate
      ? { day: ARRIVES_FORMAT.format(customDate), window: 'Anytime' }
      : { day: 'Pending', window: 'Pending' };

  const addressLine = activeRestaurant
    ? [
        activeRestaurant.address_line1,
        activeRestaurant.address_line2,
        [activeRestaurant.city, activeRestaurant.postal_code]
          .filter(Boolean)
          .join(', '),
        activeRestaurant.country,
      ]
        .filter(part => part && part.trim().length > 0)
        .join(', ')
    : '';

  const addressSummary = {
    label: activeRestaurant?.name ?? 'Select a restaurant',
    line: addressLine,
    iconName: 'storefront-outline' as const,
  };

  const ctaLabel = (() => {
    if (state.step === 0) return 'Continue to payment';
    if (state.step === 1) return 'Continue to review';
    if (state.step === 2) return `Place order · $${totals.total.toFixed(2)}`;
    return '';
  })();

  const ctaDisabled = (() => {
    if (state.step === 0) {
      return (
        !state.selectedRestaurantId ||
        (!state.selectedSlotId && !state.deliveryDate)
      );
    }
    if (state.step === 1) return false;
    if (state.step === 2) return !state.agreed;
    return true;
  })();

  const [placing, setPlacing] = useState(false);

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
        'Please select a delivery date before placing your order.'
      );
      return;
    }

    setPlacing(true);
    try {
      const order = await createOrderMutation.mutateAsync({
        restaurantId: activeRestaurantId,
        deliveryAt: state.deliveryDate,
        paymentMethod: 'cash',
      });
      dispatch({
        type: 'ORDER_PLACED',
        payload: { orderId: order.id, total: order.total_amount },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to place order. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setPlacing(false);
    }
  };

  const handleFooterPress = () => {
    if (state.step === 2) {
      void handlePlaceOrder();
      return;
    }
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    if (state.step === 0) {
      router.back();
      return;
    }
    if (state.step === 3) {
      router.replace(isUserAdmin ? '/admin/(tabs)' : '/(tabs)');
      return;
    }
    dispatch({ type: 'PREV_STEP' });
  };

  const handleTrackOrder = () => {
    if (state.placedOrderId) {
      router.replace({
        pathname: '/order/[id]',
        params: { id: state.placedOrderId },
      });
    }
  };

  const handleKeepShopping = () => {
    router.replace(isUserAdmin ? '/admin/(tabs)' : '/(tabs)');
  };

  // On the Confirmed step, override hardware back / iOS-gesture back so the user
  // can't pop back to the cart with a placed-order screen still mounted behind.
  useEffect(() => {
    if (state.step !== 3) return undefined;
    const unsubscribe = navigation.addListener(
      'beforeRemove',
      (event: { preventDefault: () => void }) => {
        event.preventDefault();
        router.replace(isUserAdmin ? '/admin/(tabs)' : '/(tabs)');
      }
    );
    return unsubscribe;
  }, [state.step, navigation, router, isUserAdmin]);

  const isLoadingDetails =
    isUserInfoLoading || (!!restaurantId && isRestaurantLoading);

  const showStepper = state.step !== 3;
  const stepFooter = state.step === 3 ? null : state.step;

  const arrivesLabel = state.deliveryDate
    ? ARRIVES_FORMAT.format(state.deliveryDate)
    : '';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <CheckoutTopBar colors={colors} step={state.step} onBack={handleBack} />
        {showStepper && (
          <CheckoutStepper
            colors={colors}
            step={state.step as 0 | 1 | 2}
            steps={STEPS}
          />
        )}
        {isLoadingDetails ? (
          <View
            style={styles.loading}
            accessible
            accessibilityLabel="Loading checkout details"
            accessibilityLiveRegion="polite"
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading checkout details…
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              state.step !== 3 && styles.scrollContentWithFooter,
            ]}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() =>
              state.dropdownVisible &&
              dispatch({ type: 'SET_DROPDOWN_VISIBLE', payload: false })
            }
          >
            {!activeRestaurant && state.step !== 3 && (
              <View
                style={[
                  styles.notice,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.noticeTitle, { color: colors.text }]}>
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

            {state.step === 0 && (
              <StepDelivery
                colors={colors}
                isAdmin={!!isUserAdmin}
                restaurant={activeRestaurant}
                allRestaurants={allRestaurants}
                selectedRestaurantId={state.selectedRestaurantId}
                dropdownVisible={state.dropdownVisible}
                onToggleDropdown={() => dispatch({ type: 'TOGGLE_DROPDOWN' })}
                onSelectRestaurant={handleSelectRestaurant}
                slots={slots}
                selectedSlotId={state.selectedSlotId}
                onSelectSlot={handleSelectSlot}
                onPickOtherDate={handlePickOtherDate}
                customDate={customDate}
                onSelectCustomDate={handlePickOtherDate}
                notes={state.specialInstructions}
                onChangeNotes={text =>
                  dispatch({
                    type: 'SET_SPECIAL_INSTRUCTIONS',
                    payload: text,
                  })
                }
              />
            )}

            {state.step === 1 && <StepPayment colors={colors} />}

            {state.step === 2 && (
              <StepReview
                colors={colors}
                items={cartItems}
                address={addressSummary}
                slot={slotSummary}
                totals={totals}
                agreed={state.agreed}
                onToggleAgree={() => dispatch({ type: 'TOGGLE_AGREEMENT' })}
              />
            )}

            {state.step === 3 && state.placedOrderId && (
              <StepConfirmed
                colors={colors}
                orderId={state.placedOrderId}
                arrivesLabel={arrivesLabel}
                windowLabel={slotSummary.window}
                address={addressSummary}
                total={state.placedTotal ?? totals.total}
                email={userInfo?.email ?? ''}
                onTrack={handleTrackOrder}
                onKeepShopping={handleKeepShopping}
              />
            )}
          </ScrollView>
        )}

        {stepFooter !== null && !isLoadingDetails && (
          <CheckoutFooter
            colors={colors}
            step={stepFooter as 0 | 1 | 2}
            total={totals.total}
            ctaLabel={ctaLabel}
            ctaDisabled={ctaDisabled}
            placing={placing}
            onPress={handleFooterPress}
          />
        )}

        <Toast
          message={state.toastMessage ?? ''}
          type="success"
          visible={!!state.toastMessage}
          onHide={() => dispatch({ type: 'DISMISS_TOAST' })}
        />

        {Platform.OS === 'ios' && (
          <Modal
            transparent
            animationType="slide"
            visible={state.iosPickerVisible}
            onRequestClose={() => dispatch({ type: 'CANCEL_IOS_DATE' })}
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
                    onPress={() => dispatch({ type: 'CANCEL_IOS_DATE' })}
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
                    onPress={() => dispatch({ type: 'CONFIRM_IOS_DATE' })}
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
                  onChange={(_e, d) => {
                    if (d) dispatch({ type: 'SET_IOS_TEMP_DATE', payload: d });
                  }}
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

export default function CheckoutScreen() {
  return <CheckoutScreenInner />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  scrollContentWithFooter: {
    paddingBottom: 200,
  },
  notice: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 18,
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
});
