import { CreateRestaurantParams } from '@/lib/supabase';

export interface RestaurantOnboardingState {
  formData: CreateRestaurantParams;
  errors: Record<string, string>;
  isLoading: boolean;
  addressValidationError: string | null;
}

export type RestaurantOnboardingAction =
  | { type: 'SET_FIELD'; field: keyof CreateRestaurantParams; value: string }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'START_SUBMISSION' }
  | { type: 'SET_SUBMISSION_ERROR'; error: string }
  | { type: 'RESET_SUBMISSION' }; // Use to stop loading but keep form data, or effectively just stop loading

export const initialState: RestaurantOnboardingState = {
  formData: {
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'US',
  },
  errors: {},
  isLoading: false,
  addressValidationError: null,
};

export function restaurantOnboardingReducer(
  state: RestaurantOnboardingState,
  action: RestaurantOnboardingAction
): RestaurantOnboardingState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      };
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.errors,
      };
    case 'CLEAR_ERROR':
      const { [action.field]: _, ...newErrors } = state.errors;
      return {
        ...state,
        errors: newErrors,
      };
    case 'START_SUBMISSION':
      return {
        ...state,
        isLoading: true,
        addressValidationError: null,
      };
    case 'SET_SUBMISSION_ERROR':
      return {
        ...state,
        isLoading: false,
        addressValidationError: action.error,
      };
    case 'RESET_SUBMISSION':
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
}
