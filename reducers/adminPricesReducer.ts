/**
 * Admin Prices Reducer
 *
 * Why this reducer exists:
 * This reducer consolidates the state management for editing truck load prices.
 * It replaces scattered useState logic and centralized the complex input sanitization
 * (regex replacement, decimal limiting) into the UPDATE_PRICE action, keeping the
 * component's event handlers clean and focused on dispatching actions.
 */

export interface AdminPricesState {
  editedPrices: Record<string, string>;
}

export const initialAdminPricesState: AdminPricesState = {
  editedPrices: {},
};

export type AdminPricesAction =
  | { type: 'UPDATE_PRICE'; payload: { itemId: string; value: string } }
  | { type: 'RESET_PRICES' };

export function adminPricesReducer(
  state: AdminPricesState,
  action: AdminPricesAction
): AdminPricesState {
  switch (action.type) {
    case 'UPDATE_PRICE': {
      const { itemId, value } = action.payload;

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
