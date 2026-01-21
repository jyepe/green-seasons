export interface TruckLoadState {
  expandedItems: Set<string>;
  pdfStatus: 'idle' | 'previewing' | 'downloading';
}

export const initialTruckLoadState: TruckLoadState = {
  expandedItems: new Set(),
  pdfStatus: 'idle',
};

export type TruckLoadAction =
  | { type: 'TOGGLE_ITEM'; payload: string }
  | { type: 'START_PDF_PREVIEW' }
  | { type: 'START_PDF_DOWNLOAD' }
  | { type: 'FINISH_PDF_ACTION' };

export function truckLoadReducer(
  state: TruckLoadState,
  action: TruckLoadAction
): TruckLoadState {
  switch (action.type) {
    case 'TOGGLE_ITEM': {
      const next = new Set(state.expandedItems);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, expandedItems: next };
    }
    case 'START_PDF_PREVIEW':
      return { ...state, pdfStatus: 'previewing' };
    case 'START_PDF_DOWNLOAD':
      return { ...state, pdfStatus: 'downloading' };
    case 'FINISH_PDF_ACTION':
      return { ...state, pdfStatus: 'idle' };
    default:
      return state;
  }
}
