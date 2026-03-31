// Reducer Scout 🧭
// WHY: This reducer replaces 4 independent state values (email, password, errors, isLoading)
// in the LoginScreen. By centralizing this state, we ensure that related updates
// (e.g., clearing an error when a user types in a field) happen atomically,
// and we remove scattered state setters from event handlers.

export interface LoginState {
  email: string;
  password: string;
  errors: {
    email?: string;
    password?: string;
  };
  isLoading: boolean;
}

export type LoginAction =
  | { type: 'SET_FIELD'; field: 'email' | 'password'; value: string }
  | { type: 'SET_ERRORS'; errors: { email?: string; password?: string } }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' };

export const initialLoginState: LoginState = {
  email: '',
  password: '',
  errors: {},
  isLoading: false,
};

export function loginReducer(
  state: LoginState,
  action: LoginAction
): LoginState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        errors: {
          ...state.errors,
          [action.field]: undefined, // Clear error when user types
        },
      };
    case 'SET_ERRORS':
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
    default:
      return state;
  }
}
