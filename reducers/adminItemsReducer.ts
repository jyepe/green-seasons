import type { Item } from '@/lib/supabase';

export interface AdminItemsState {
  searchQuery: string;
  currentPage: number;
  isFormModalVisible: boolean;
  editingItem: Item | null;
}

export const initialAdminItemsState: AdminItemsState = {
  searchQuery: '',
  currentPage: 1,
  isFormModalVisible: false,
  editingItem: null,
};

export type AdminItemsAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'OPEN_CREATE_MODAL' }
  | { type: 'OPEN_EDIT_MODAL'; payload: Item }
  | { type: 'CLOSE_MODAL' };

/**
 * Reducer for Admin Items Screen
 *
 * Why:
 * - Centralizes search, pagination, and modal state
 * - Eliminates "sync" effects (resetting page on search)
 * - Enforces correct modal state (clearing item on close/create)
 */
export function adminItemsReducer(
  state: AdminItemsState,
  action: AdminItemsAction
): AdminItemsState {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
        currentPage: 1, // Reset page on search change
      };

    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };

    case 'OPEN_CREATE_MODAL':
      return {
        ...state,
        editingItem: null,
        isFormModalVisible: true,
      };

    case 'OPEN_EDIT_MODAL':
      return {
        ...state,
        editingItem: action.payload,
        isFormModalVisible: true,
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        isFormModalVisible: false,
        editingItem: null,
      };

    default:
      return state;
  }
}
