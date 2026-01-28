/**
 * AdminPricesReducer
 *
 * Replaces complex state management for price editing.
 * Centralizes the input sanitization logic (regex, decimal limits) that was previously
 * mixed into the component's event handlers.
 *
 * Complexity removed:
 * - Scattered imperative sanitization logic in handlePriceChange
 * - Direct state mutations mixed with validation
 */
export interface AdminPricesState {
  editedPrices: Record<string, string>;
}

export const initialAdminPricesState: AdminPricesState = {
  editedPrices: {},
};

export type AdminPricesAction =
  | { type: 'UPDATE_PRICE'; itemId: string; value: string }
  | { type: 'RESET_PRICES' };

export function adminPricesReducer(
  state: AdminPricesState,
  action: AdminPricesAction
): AdminPricesState {
  switch (action.type) {
    case 'UPDATE_PRICE': {
      const { itemId, value } = action;

      // Allow only valid decimal input with max 2 decimal places
      let sanitized = value.replace(/[^0-9.]/g, '');

      // Ensure only one decimal point
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('');
      }

      // Limit to 2 decimal places
      if (parts.length === 2 && parts[1].length > 2) {
        sanitized = parts[0] + '.' + parts[1].slice(0, 2);
      }

      return {
        ...state,
        editedPrices: {
          ...state.editedPrices,
          [itemId]: sanitized,
        },
      };
    }

    case 'RESET_PRICES':
      return {
        ...state,
        editedPrices: {},
      };

    default:
      return state;
  }
}
