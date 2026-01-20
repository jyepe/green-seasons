export interface EmployeeManagementState {
  employeeDropdownVisible: boolean;
  restaurantDropdownVisible: boolean;
  selectedEmployeeId: string | null;
  selectedRestaurantId: string | null;
}

export const initialEmployeeManagementState: EmployeeManagementState = {
  employeeDropdownVisible: false,
  restaurantDropdownVisible: false,
  selectedEmployeeId: null,
  selectedRestaurantId: null,
};

export type EmployeeManagementAction =
  | { type: 'TOGGLE_EMPLOYEE_DROPDOWN' }
  | { type: 'TOGGLE_RESTAURANT_DROPDOWN' }
  | { type: 'SELECT_EMPLOYEE'; payload: string | null }
  | { type: 'SELECT_RESTAURANT'; payload: string | null }
  | { type: 'CLOSE_DROPDOWNS' };

/**
 * Reducer for Employee Management Screen
 *
 * Why:
 * - Centralizes dropdown visibility logic (mutual exclusivity).
 * - Manages selection state alongside UI state.
 * - Simplifies event handlers in the component.
 */
export function employeeManagementReducer(
  state: EmployeeManagementState,
  action: EmployeeManagementAction
): EmployeeManagementState {
  switch (action.type) {
    case 'TOGGLE_EMPLOYEE_DROPDOWN':
      return {
        ...state,
        employeeDropdownVisible: !state.employeeDropdownVisible,
        restaurantDropdownVisible: false, // Close other dropdown
      };

    case 'TOGGLE_RESTAURANT_DROPDOWN':
      return {
        ...state,
        restaurantDropdownVisible: !state.restaurantDropdownVisible,
        employeeDropdownVisible: false, // Close other dropdown
      };

    case 'SELECT_EMPLOYEE':
      return {
        ...state,
        selectedEmployeeId: action.payload,
        employeeDropdownVisible: false, // Auto-close on selection
      };

    case 'SELECT_RESTAURANT':
      return {
        ...state,
        selectedRestaurantId: action.payload,
        restaurantDropdownVisible: false, // Auto-close on selection
      };

    case 'CLOSE_DROPDOWNS':
      return {
        ...state,
        employeeDropdownVisible: false,
        restaurantDropdownVisible: false,
      };

    default:
      return state;
  }
}
