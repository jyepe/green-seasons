// -----------------------------------------------------------------------------
// Reducer & Types for EditProfileForm
// -----------------------------------------------------------------------------
// Why: Centralizes form state to handle initialization and field updates in one place.
// Replaces 5 separate useState calls and simplifies the initialization effect.

export type ProfileState = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isInitialized: boolean;
};

export type ProfileAction =
  | {
      type: 'INITIALIZE';
      payload: {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
      };
    }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_FIRST_NAME'; payload: string }
  | { type: 'SET_LAST_NAME'; payload: string }
  | { type: 'SET_PHONE'; payload: string };

export const initialState: ProfileState = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  isInitialized: false,
};

export function profileReducer(
  state: ProfileState,
  action: ProfileAction
): ProfileState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        ...action.payload,
        isInitialized: true,
      };
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'SET_FIRST_NAME':
      return { ...state, firstName: action.payload };
    case 'SET_LAST_NAME':
      return { ...state, lastName: action.payload };
    case 'SET_PHONE':
      return { ...state, phone: action.payload };
    default:
      return state;
  }
}
