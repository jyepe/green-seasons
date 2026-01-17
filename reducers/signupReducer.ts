export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export interface SignupState {
  formData: SignupFormData;
  errors: Record<string, string>;
  isLoading: boolean;
}

export const initialSignupState: SignupState = {
  formData: {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  },
  errors: {},
  isLoading: false,
};

export type SignupAction =
  | { type: 'SET_FIELD'; field: keyof SignupFormData; value: string }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'SET_ALL_ERRORS'; errors: Record<string, string> }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' }
  | { type: 'RESET_FORM' };

/**
 * Reducer for the Signup screen.
 * Replaces: 3 useState calls (formData, isLoading, errors) and scattered setters.
 * Centralizes: Form updates, validation error setting, and loading state transitions.
 */
export function signupReducer(
  state: SignupState,
  action: SignupAction
): SignupState {
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

    case 'SET_ALL_ERRORS':
      return {
        ...state,
        errors: action.errors,
      };

    case 'SUBMIT_START':
      return {
        ...state,
        isLoading: true,
      };

    case 'SUBMIT_END':
      return {
        ...state,
        isLoading: false,
      };

    case 'RESET_FORM':
      return initialSignupState;

    default:
      return state;
  }
}
