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
  | { type: 'LOGIN_END' };

/**
 * Reducer for the Login screen.
 * Replaces: 3 useState calls (email, password, isLoading).
 * Centralizes: Form updates and loading state management.
 */
export function loginReducer(
  state: LoginState,
  action: LoginAction
): LoginState {
  switch (action.type) {
    case 'SET_EMAIL':
      return {
        ...state,
        email: action.payload,
      };
    case 'SET_PASSWORD':
      return {
        ...state,
        password: action.payload,
      };
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_END':
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
}
