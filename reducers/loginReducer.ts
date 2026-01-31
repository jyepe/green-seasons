import { Reducer } from 'react';

// -----------------------------------------------------------------------------
// State & Types
// -----------------------------------------------------------------------------

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
  | { type: 'LOGIN_END' }
  | { type: 'RESET_FORM' };

/**
 * Login Reducer
 *
 * Replaces scattered useState calls for email, password, and loading status.
 * Centralizes the login form state and submission lifecycle.
 */
export const loginReducer: Reducer<LoginState, LoginAction> = (
  state,
  action
) => {
  switch (action.type) {
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_END':
      return { ...state, isLoading: false };
    case 'RESET_FORM':
      return initialLoginState;
    default:
      return state;
  }
};
