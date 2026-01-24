import { Item } from '@/lib/supabase';

export type ItemFormData = {
  name: string;
  description: string;
  price: string;
  unit: string;
  image_url: string;
};

export type ItemFormState = {
  data: ItemFormData;
  errors: Record<string, string>;
};

export type ItemFormAction =
  | { type: 'INITIALIZE'; item: Item | null }
  | { type: 'SET_FIELD'; field: keyof ItemFormData; value: string }
  | { type: 'SET_ERRORS'; errors: Record<string, string> };

export const initialItemFormState: ItemFormState = {
  data: {
    name: '',
    description: '',
    price: '',
    unit: '',
    image_url: '',
  },
  errors: {},
};

/**
 * itemFormReducer
 * Refactoring motivation:
 * Originally, `ItemFormModal` used two separate `useState` hooks (`formData` and `errors`)
 * and a `useEffect` to sync them with props (`item`). This led to split state updates
 * and manual syncing logic.
 *
 * This reducer consolidates the form state, making the "Reset/Initialize" logic
 * explicit and atomic, and ensuring field updates automatically clear related errors.
 */
export function itemFormReducer(
  state: ItemFormState,
  action: ItemFormAction
): ItemFormState {
  switch (action.type) {
    case 'INITIALIZE': {
      const item = action.item;
      if (item) {
        return {
          data: {
            name: item.name,
            description: item.description || '',
            price: item.price.toString(),
            unit: item.unit,
            image_url: item.image_url || '',
          },
          errors: {},
        };
      }
      return initialItemFormState;
    }
    case 'SET_FIELD': {
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
        // Clear error for the field being edited
        errors: { ...state.errors, [action.field]: '' },
      };
    }
    case 'SET_ERRORS': {
      return {
        ...state,
        errors: action.errors,
      };
    }
    default:
      return state;
  }
}
