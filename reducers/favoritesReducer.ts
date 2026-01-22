import { CartItem } from '@/lib/supabase';

export type FavoritesState = {
  pendingItemId: string | null;
  showToast: boolean;
  toastMessage: string;
  stepperItems: Record<string, number>;
};

export const initialFavoritesState: FavoritesState = {
  pendingItemId: null,
  showToast: false,
  toastMessage: 'Item added to cart!',
  stepperItems: {},
};

export type FavoritesAction =
  | { type: 'SET_PENDING_ITEM'; payload: string | null }
  | { type: 'SHOW_TOAST'; payload: string }
  | { type: 'HIDE_TOAST' }
  | { type: 'SYNC_CART_ITEMS'; payload: CartItem[] }
  | {
      type: 'UPDATE_QUANTITY_OPTIMISTIC';
      payload: { itemId: string; quantity: number };
    }
  | {
      type: 'UPDATE_QUANTITY_REVERT';
      payload: { itemId: string; quantity: number };
    }
  | { type: 'REMOVE_FROM_FAVORITES_SUCCESS'; payload: string };

export function favoritesReducer(
  state: FavoritesState,
  action: FavoritesAction
): FavoritesState {
  switch (action.type) {
    case 'SET_PENDING_ITEM':
      return {
        ...state,
        pendingItemId: action.payload,
      };

    case 'SHOW_TOAST':
      return {
        ...state,
        showToast: true,
        toastMessage: action.payload,
      };

    case 'HIDE_TOAST':
      return {
        ...state,
        showToast: false,
      };

    case 'SYNC_CART_ITEMS': {
      const updatedStepper: Record<string, number> = {};
      action.payload.forEach(cartItem => {
        updatedStepper[cartItem.item_id] = cartItem.quantity;
      });
      return {
        ...state,
        stepperItems: updatedStepper,
      };
    }

    case 'UPDATE_QUANTITY_OPTIMISTIC': {
      const { itemId, quantity } = action.payload;
      const newStepperItems = { ...state.stepperItems, [itemId]: quantity };

      // If quantity is 0, we remove it from stepper state (similar to original logic)
      if (quantity <= 0) {
        const { [itemId]: _, ...rest } = newStepperItems;
        return {
          ...state,
          stepperItems: rest,
          pendingItemId: itemId,
        };
      }

      return {
        ...state,
        stepperItems: newStepperItems,
        pendingItemId: itemId,
      };
    }

    case 'UPDATE_QUANTITY_REVERT': {
      const { itemId, quantity } = action.payload;
      // Revert to the specific quantity provided (usually the previous cart quantity)
      const newStepperItems = { ...state.stepperItems };

      if (quantity > 0) {
        newStepperItems[itemId] = quantity;
      } else {
        delete newStepperItems[itemId];
      }

      return {
        ...state,
        stepperItems: newStepperItems,
        pendingItemId: null, // Clear pending state on revert
      };
    }

    case 'REMOVE_FROM_FAVORITES_SUCCESS':
      // Just show toast, logic for removing from list is handled by query cache invalidation
      return {
        ...state,
        showToast: true,
        toastMessage: action.payload,
      };

    default:
      return state;
  }
}
