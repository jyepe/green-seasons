import { CartItem } from '@/lib/supabase';

export interface ProductsScreenState {
  searchQuery: string;
  currentPage: number;
  pendingItemId: string | null;
  showToast: boolean;
  stepperItems: Record<string, number>;
}

export type ProductsScreenAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SYNC_CART_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_TO_CART_START'; payload: string }
  | { type: 'ADD_TO_CART_SUCCESS' }
  | { type: 'ADD_TO_CART_ERROR' }
  | {
      type: 'UPDATE_QUANTITY_OPTIMISTIC';
      payload: { itemId: string; quantity: number };
    }
  | {
      type: 'UPDATE_QUANTITY_ERROR';
      payload: { itemId: string; quantity: number };
    }
  | { type: 'HIDE_TOAST' };

export const initialState: ProductsScreenState = {
  searchQuery: '',
  currentPage: 1,
  pendingItemId: null,
  showToast: false,
  stepperItems: {},
};

export function productsScreenReducer(
  state: ProductsScreenState,
  action: ProductsScreenAction
): ProductsScreenState {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
        currentPage: 1, // Resets page when search changes
      };
    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };
    case 'SYNC_CART_ITEMS': {
      const updatedStepperItems = Object.fromEntries(
        action.payload.map(item => [item.item_id, item.quantity])
      );
      return {
        ...state,
        stepperItems: updatedStepperItems,
        pendingItemId: null,
      };
    }
    case 'ADD_TO_CART_START':
      return {
        ...state,
        pendingItemId: action.payload,
      };
    case 'ADD_TO_CART_SUCCESS':
      return {
        ...state,
        pendingItemId: null,
        showToast: true,
      };
    case 'ADD_TO_CART_ERROR':
      return {
        ...state,
        pendingItemId: null,
      };
    case 'UPDATE_QUANTITY_OPTIMISTIC':
      return {
        ...state,
        pendingItemId: action.payload.itemId,
        stepperItems: {
          ...state.stepperItems,
          [action.payload.itemId]: action.payload.quantity,
        },
      };
    case 'UPDATE_QUANTITY_ERROR': {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        const { [itemId]: _, ...rest } = state.stepperItems;
        return {
          ...state,
          pendingItemId: null,
          stepperItems: rest,
        };
      }
      return {
        ...state,
        pendingItemId: null,
        stepperItems: {
          ...state.stepperItems,
          [itemId]: quantity,
        },
      };
    }
    case 'HIDE_TOAST':
      return {
        ...state,
        showToast: false,
      };
    default:
      return state;
  }
}
