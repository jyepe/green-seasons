// reducers/checkoutReducer.ts
import type { Restaurant } from '@/lib/supabase';

export type PaymentMethod = 'cash';

export interface CheckoutState {
  step: 0 | 1 | 2 | 3;

  // Restaurant
  selectedRestaurantId: string | null;
  dropdownVisible: boolean;

  // Delivery slot
  selectedSlotId: string | null;
  deliveryDate: Date | null;

  // iOS date picker
  iosPickerVisible: boolean;
  iosTempDate: Date;

  // Driver notes
  specialInstructions: string;

  // Payment
  paymentMethod: PaymentMethod;

  // Review
  agreed: boolean;

  // Confirmed
  placedOrderId: string | null;
  placedTotal: number | null;

  // Toast
  toastMessage: string | null;
}

export const initialCheckoutState: CheckoutState = {
  step: 0,
  selectedRestaurantId: null,
  dropdownVisible: false,
  selectedSlotId: null,
  deliveryDate: null,
  iosPickerVisible: false,
  iosTempDate: new Date(),
  specialInstructions: '',
  paymentMethod: 'cash',
  agreed: false,
  placedOrderId: null,
  placedTotal: null,
  toastMessage: null,
};

export type CheckoutAction =
  | { type: 'SET_SELECTED_RESTAURANT_ID'; payload: string | null }
  | { type: 'TOGGLE_DROPDOWN' }
  | { type: 'SET_DROPDOWN_VISIBLE'; payload: boolean }
  | { type: 'SELECT_ADMIN_RESTAURANT'; payload: Restaurant }
  | { type: 'SET_SLOT'; payload: { slotId: string; slotDate: Date } }
  | { type: 'SET_DELIVERY_DATE'; payload: Date }
  | { type: 'OPEN_IOS_PICKER'; payload: Date }
  | { type: 'SET_IOS_TEMP_DATE'; payload: Date }
  | { type: 'CONFIRM_IOS_DATE' }
  | { type: 'CANCEL_IOS_DATE' }
  | { type: 'SET_SPECIAL_INSTRUCTIONS'; payload: string }
  | { type: 'TOGGLE_AGREEMENT' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: 0 | 1 | 2 | 3 }
  | { type: 'ORDER_PLACED'; payload: { orderId: string; total: number } }
  | { type: 'SHOW_TOAST'; payload: string }
  | { type: 'DISMISS_TOAST' };

export function checkoutReducer(
  state: CheckoutState,
  action: CheckoutAction
): CheckoutState {
  switch (action.type) {
    case 'SET_SELECTED_RESTAURANT_ID':
      return { ...state, selectedRestaurantId: action.payload };

    case 'TOGGLE_DROPDOWN':
      return { ...state, dropdownVisible: !state.dropdownVisible };

    case 'SET_DROPDOWN_VISIBLE':
      return { ...state, dropdownVisible: action.payload };

    case 'SELECT_ADMIN_RESTAURANT':
      return {
        ...state,
        selectedRestaurantId: action.payload.id,
        dropdownVisible: false,
      };

    case 'SET_SLOT':
      return {
        ...state,
        selectedSlotId: action.payload.slotId,
        deliveryDate: action.payload.slotDate,
      };

    case 'SET_DELIVERY_DATE':
      return {
        ...state,
        deliveryDate: action.payload,
        selectedSlotId: null,
      };

    case 'OPEN_IOS_PICKER':
      return {
        ...state,
        iosPickerVisible: true,
        iosTempDate: action.payload,
      };

    case 'SET_IOS_TEMP_DATE':
      return { ...state, iosTempDate: action.payload };

    case 'CONFIRM_IOS_DATE':
      return {
        ...state,
        deliveryDate: state.iosTempDate,
        selectedSlotId: null,
        iosPickerVisible: false,
      };

    case 'CANCEL_IOS_DATE':
      return { ...state, iosPickerVisible: false };

    case 'SET_SPECIAL_INSTRUCTIONS':
      return { ...state, specialInstructions: action.payload };

    case 'TOGGLE_AGREEMENT':
      return { ...state, agreed: !state.agreed };

    case 'NEXT_STEP': {
      if (state.step === 3) return state;
      const next = (state.step + 1) as 0 | 1 | 2 | 3;
      return { ...state, step: next };
    }

    case 'PREV_STEP': {
      if (state.step === 0 || state.step === 3) return state;
      const prev = (state.step - 1) as 0 | 1 | 2;
      return { ...state, step: prev };
    }

    case 'GO_TO_STEP':
      return { ...state, step: action.payload };

    case 'ORDER_PLACED':
      return {
        ...state,
        step: 3,
        placedOrderId: action.payload.orderId,
        placedTotal: action.payload.total,
      };

    case 'SHOW_TOAST':
      return { ...state, toastMessage: action.payload };

    case 'DISMISS_TOAST':
      return { ...state, toastMessage: null };

    default:
      return state;
  }
}
