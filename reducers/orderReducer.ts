export type OrderState = {
  status: {
    isUpdating: boolean;
    isDropdownOpen: boolean;
    showToast: boolean;
  };
  date: {
    isUpdating: boolean;
    showPicker: boolean;
    tempDate: Date | null;
  };
  pdf: {
    isPreviewing: boolean;
    isDownloading: boolean;
  };
};

export type OrderAction =
  | { type: 'SET_STATUS_UPDATING'; payload: boolean }
  | { type: 'SET_STATUS_DROPDOWN_OPEN'; payload: boolean }
  | { type: 'SET_SHOW_STATUS_TOAST'; payload: boolean }
  | { type: 'SET_DATE_UPDATING'; payload: boolean }
  | { type: 'SET_SHOW_DATE_PICKER'; payload: boolean }
  | { type: 'SET_TEMP_DATE'; payload: Date | null }
  | { type: 'SET_PDF_PREVIEWING'; payload: boolean }
  | { type: 'SET_PDF_DOWNLOADING'; payload: boolean };

export const initialState: OrderState = {
  status: { isUpdating: false, isDropdownOpen: false, showToast: false },
  date: { isUpdating: false, showPicker: false, tempDate: null },
  pdf: { isPreviewing: false, isDownloading: false },
};

export function orderReducer(
  state: OrderState,
  action: OrderAction
): OrderState {
  switch (action.type) {
    case 'SET_STATUS_UPDATING':
      return {
        ...state,
        status: { ...state.status, isUpdating: action.payload },
      };
    case 'SET_STATUS_DROPDOWN_OPEN':
      return {
        ...state,
        status: { ...state.status, isDropdownOpen: action.payload },
      };
    case 'SET_SHOW_STATUS_TOAST':
      return {
        ...state,
        status: { ...state.status, showToast: action.payload },
      };
    case 'SET_DATE_UPDATING':
      return { ...state, date: { ...state.date, isUpdating: action.payload } };
    case 'SET_SHOW_DATE_PICKER':
      return { ...state, date: { ...state.date, showPicker: action.payload } };
    case 'SET_TEMP_DATE':
      return { ...state, date: { ...state.date, tempDate: action.payload } };
    case 'SET_PDF_PREVIEWING':
      return { ...state, pdf: { ...state.pdf, isPreviewing: action.payload } };
    case 'SET_PDF_DOWNLOADING':
      return { ...state, pdf: { ...state.pdf, isDownloading: action.payload } };
    default:
      return state;
  }
}
