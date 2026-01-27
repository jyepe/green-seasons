export type AdminPricesState = Record<string, string>;

export type AdminPricesAction =
  | { type: 'SET_PRICE'; itemId: string; value: string }
  | { type: 'CLEAR_PRICES' };

export const initialAdminPricesState: AdminPricesState = {};

export function adminPricesReducer(
  state: AdminPricesState,
  action: AdminPricesAction
): AdminPricesState {
  switch (action.type) {
    case 'SET_PRICE': {
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
        [itemId]: sanitized,
      };
    }
    case 'CLEAR_PRICES':
      return {};
    default:
      return state;
  }
}
