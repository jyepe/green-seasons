## 2024-05-23 - Syncing Server State vs Local Optimistic State
**Learning:** "Sync from server" effects often conflict with local optimistic updates. When `cartItems` (server) and `stepperItems` (local) are managed separately, an incoming background refetch can overwrite a pending optimistic update, causing UI jumps.
**Action:** When moving to a reducer, explicit actions like `SYNC_CART_ITEMS` and `UPDATE_QUANTITY_OPTIMISTIC` make this conflict visible. Future improvement: inhibit `SYNC_CART_ITEMS` if a transaction is `pending`, or merge states intelligently.
