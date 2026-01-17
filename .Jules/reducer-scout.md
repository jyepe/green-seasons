## 2024-05-23 - Syncing Server State vs Local Optimistic State
**Learning:** "Sync from server" effects often conflict with local optimistic updates. When `cartItems` (server) and `stepperItems` (local) are managed separately, an incoming background refetch can overwrite a pending optimistic update, causing UI jumps.
**Action:** When moving to a reducer, explicit actions like `SYNC_CART_ITEMS` and `UPDATE_QUANTITY_OPTIMISTIC` make this conflict visible. Future improvement: inhibit `SYNC_CART_ITEMS` if a transaction is `pending`, or merge states intelligently.

## 2024-05-25 - Form Validation Logic and Reducers
**Learning:** Validation logic often requires access to the current state (e.g., confirming passwords). When moving to a reducer, validation logic that depends on `state` can be tricky if kept inside event handlers because of closure staleness if not careful, or if moved to the reducer, it makes the reducer "thick".
**Action:** Kept validation logic in the component as a helper function that accepts `value` and `formData` explicitly, rather than relying on `state` closure. This allows the validator to be pure and easily tested, while the reducer stays focused on state updates. The reducer receives the *result* of validation (`SET_ERROR`), not the raw event to validate.
