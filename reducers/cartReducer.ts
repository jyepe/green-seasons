import { EditingItem } from '@/components/EditQuantityModal';

export type CartState = {
  isClearing: boolean;
  updatingItemId: string | null;
  editingItem: EditingItem | null;
  editQuantity: string;
};

export const initialCartState: CartState = {
  isClearing: false,
  updatingItemId: null,
  editingItem: null,
  editQuantity: '',
};

export type CartAction =
  | { type: 'START_CLEARING' }
  | { type: 'FINISH_CLEARING' }
  | { type: 'START_UPDATING_ITEM'; payload: string }
  | { type: 'FINISH_UPDATING_ITEM' }
  | { type: 'START_EDITING_ITEM'; payload: EditingItem }
  | { type: 'SET_EDIT_QUANTITY'; payload: string }
  | { type: 'CLOSE_EDIT_MODAL' };

/**
 * Reducer for managing Cart screen state.
 * Replaces scattered useState calls for isClearing, updatingItemId, editingItem, and editQuantity.
 * Centralizes state transitions for clearing cart, updating items, and editing quantities.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'START_CLEARING':
      return { ...state, isClearing: true };
    case 'FINISH_CLEARING':
      return { ...state, isClearing: false };
    case 'START_UPDATING_ITEM':
      return { ...state, updatingItemId: action.payload };
    case 'FINISH_UPDATING_ITEM':
      return { ...state, updatingItemId: null };
    case 'START_EDITING_ITEM':
      return {
        ...state,
        editingItem: action.payload,
        editQuantity: action.payload.quantity.toString(),
      };
    case 'SET_EDIT_QUANTITY':
      return { ...state, editQuantity: action.payload };
    case 'CLOSE_EDIT_MODAL':
      return { ...state, editingItem: null, editQuantity: '' };
    default:
      return state;
  }
}
