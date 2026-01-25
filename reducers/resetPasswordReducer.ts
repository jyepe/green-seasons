export interface ResetPasswordState {
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  isAuthenticated: boolean | null;
}

export const initialResetPasswordState: ResetPasswordState = {
  password: '',
  confirmPassword: '',
  isLoading: false,
  isAuthenticated: null,
};

export type ResetPasswordAction =
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_CONFIRM_PASSWORD'; payload: string }
  | { type: 'AUTH_SUCCESS' }
  | { type: 'AUTH_FAILURE' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' };

/**
 * Reducer for the Reset Password screen.
 * Replaces: 4 useState calls (password, confirmPassword, isLoading, isAuthenticated).
 * Centralizes: Authentication status verification and password submission flow.
 */
export function resetPasswordReducer(
  state: ResetPasswordState,
  action: ResetPasswordAction
): ResetPasswordState {
  switch (action.type) {
    case 'SET_PASSWORD':
      return {
        ...state,
        password: action.payload,
      };
    case 'SET_CONFIRM_PASSWORD':
      return {
        ...state,
        confirmPassword: action.payload,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
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
    default:
      return state;
  }
}
