import type { Restaurant, UserInfo } from '@/lib/supabase';

export type PaymentMethod = 'net30' | 'credit' | 'cash';

export interface CheckoutState {
  // Restaurant Information
  selectedRestaurantId: string | null;
  restaurantName: string;
  dropdownVisible: boolean;

  // Contact Information
  contactPerson: string;
  phoneNumber: string;
  email: string;

  // Delivery Information
  deliveryAddress: string;
  deliveryDate: Date | null;
  specialInstructions: string;

  // iOS Date Picker State
  iosPickerVisible: boolean;
  iosTempDate: Date;

  // Payment
  paymentMethod: PaymentMethod;
}

export const initialCheckoutState: CheckoutState = {
  selectedRestaurantId: null,
  restaurantName: '',
  dropdownVisible: false,
  contactPerson: '',
  phoneNumber: '',
  email: '',
  deliveryAddress: '',
  deliveryDate: null,
  specialInstructions: '',
  iosPickerVisible: false,
  iosTempDate: new Date(),
  paymentMethod: 'cash',
};

export type CheckoutAction =
  | { type: 'SET_SELECTED_RESTAURANT_ID'; payload: string | null }
  | { type: 'TOGGLE_DROPDOWN' }
  | { type: 'SET_DROPDOWN_VISIBLE'; payload: boolean }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_DELIVERY_DATE'; payload: Date }
  | { type: 'SET_SPECIAL_INSTRUCTIONS'; payload: string }
  | { type: 'SET_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'OPEN_IOS_PICKER'; payload: Date }
  | { type: 'SET_IOS_TEMP_DATE'; payload: Date }
  | { type: 'CONFIRM_IOS_DATE' }
  | { type: 'CANCEL_IOS_DATE' }
  | {
      type: 'SELECT_ADMIN_RESTAURANT';
      payload: Restaurant;
    }
  | {
      type: 'SYNC_RESTAURANT_DATA';
      payload: {
        restaurant: Restaurant | null;
        selectedRestaurant: Restaurant | null;
      };
    }
  | {
      type: 'SYNC_CONTACT_DATA';
      payload: {
        isUserAdmin: boolean;
        userInfo: UserInfo | null;
        ownerInfo: UserInfo | null;
      };
    };

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

    case 'SET_EMAIL':
      return { ...state, email: action.payload };

    case 'SET_DELIVERY_DATE':
      return { ...state, deliveryDate: action.payload };

    case 'SET_SPECIAL_INSTRUCTIONS':
      return { ...state, specialInstructions: action.payload };

    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };

    case 'OPEN_IOS_PICKER':
      return {
        ...state,
        iosTempDate: action.payload,
        iosPickerVisible: true,
      };

    case 'SET_IOS_TEMP_DATE':
      return { ...state, iosTempDate: action.payload };

    case 'CONFIRM_IOS_DATE':
      return {
        ...state,
        deliveryDate: state.iosTempDate,
        iosPickerVisible: false,
      };

    case 'CANCEL_IOS_DATE':
      return { ...state, iosPickerVisible: false };

    case 'SELECT_ADMIN_RESTAURANT': {
      const rest = action.payload;
      const formattedAddress = [
        rest.address_line1,
        rest.address_line2,
        [rest.city, rest.postal_code].filter(Boolean).join(', '),
        rest.country,
      ]
        .filter(part => part && part.trim().length > 0)
        .join('\n');

      return {
        ...state,
        selectedRestaurantId: rest.id,
        restaurantName: rest.name,
        dropdownVisible: false,
        deliveryAddress: formattedAddress || '',
      };
    }

    case 'SYNC_RESTAURANT_DATA': {
      const { restaurant, selectedRestaurant } = action.payload;

      if (!restaurant && !selectedRestaurant) {
        // Only clear if we really have no data sources
        // But if we already have data, maybe we shouldn't clear?
        // The original effect cleared it.
        return {
          ...state,
          restaurantName: '',
          deliveryAddress: '',
        };
      }

      const activeRestaurant = selectedRestaurant || restaurant;
      if (!activeRestaurant) return state;

      const formattedAddress = [
        activeRestaurant.address_line1,
        activeRestaurant.address_line2,
        [activeRestaurant.city, activeRestaurant.postal_code]
          .filter(Boolean)
          .join(', '),
        activeRestaurant.country,
      ]
        .filter(part => part && part.trim().length > 0)
        .join('\n');

      return {
        ...state,
        restaurantName: activeRestaurant.name ?? '',
        deliveryAddress: formattedAddress || '',
      };
    }

    case 'SYNC_CONTACT_DATA': {
      const { isUserAdmin, userInfo, ownerInfo } = action.payload;

      let newContactPerson = state.contactPerson;
      let newEmail = state.email;
      let newPhoneNumber = state.phoneNumber;

      if (isUserAdmin && ownerInfo) {
        // Admin has selected a restaurant - use owner info
        const fullName = [ownerInfo.first_name, ownerInfo.last_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        newContactPerson = fullName || '';
        newEmail = ownerInfo.email ?? '';
        newPhoneNumber = ownerInfo.phone ?? '';
      } else if (isUserAdmin && !ownerInfo && userInfo) {
        // Admin without selected restaurant - use admin's own info
        const fullName = [userInfo.first_name, userInfo.last_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        newContactPerson = fullName || userInfo.email || '';
        newEmail = userInfo.email ?? '';
        newPhoneNumber = userInfo.phone ?? '';
      } else if (!isUserAdmin) {
        // Reset to current user info if not admin
        if (userInfo) {
          const fullName = [userInfo.first_name, userInfo.last_name]
            .filter(Boolean)
            .join(' ')
            .trim();
          newContactPerson = fullName || userInfo.email || '';
          newEmail = userInfo.email ?? '';
          newPhoneNumber = userInfo.phone ?? '';
        } else {
          // Clear fields if not admin and no user info
          newContactPerson = '';
          newEmail = '';
          newPhoneNumber = '';
        }
      }

      // Optimization: Only return new object if values changed
      if (
        newContactPerson === state.contactPerson &&
        newEmail === state.email &&
        newPhoneNumber === state.phoneNumber
      ) {
        return state;
      }

      return {
        ...state,
        contactPerson: newContactPerson,
        email: newEmail,
        phoneNumber: newPhoneNumber,
      };
    }

    default:
      return state;
  }
}
