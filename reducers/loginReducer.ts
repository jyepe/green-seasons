export interface LoginState {
  email: string;
  password: string;
  isLoading: boolean;
}

export const initialLoginState: LoginState = {
  email: '',
  password: '',
  isLoading: false,
};

export type LoginAction =
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS' }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'RESET_FORM' };

/**
 * Reducer for the Login screen.
 * Replaces: 3 useState calls (email, password, isLoading).
 * Centralizes: Form input handling and loading state.
 */
export function loginReducer(
  state: LoginState,
  action: LoginAction
): LoginState {
  switch (action.type) {
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return { ...state, isLoading: false };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false };
    case 'RESET_FORM':
      return initialLoginState;
    default:
      return state;
  }
}
