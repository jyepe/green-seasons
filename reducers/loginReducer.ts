export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginState {
  formData: LoginFormData;
  isLoading: boolean;
}

export const initialLoginState: LoginState = {
  formData: {
    email: '',
    password: '',
  },
  isLoading: false,
};

export type LoginAction =
  | { type: 'SET_FIELD'; field: keyof LoginFormData; value: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' }
  | { type: 'RESET_FORM' };

/**
 * Reducer for the Login screen.
 * Replaces: useState calls for email, password, and isLoading.
 * Centralizes: Form updates and loading state transitions.
 */
export function loginReducer(
  state: LoginState,
  action: LoginAction
): LoginState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
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
      return initialLoginState;

    default:
      return state;
  }
}
