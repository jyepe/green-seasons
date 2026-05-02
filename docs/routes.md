# Routes & Reducers

## Route Constants (`constants/Routes.ts`)

```ts
ROUTES.LOGIN                      // /auth/login
ROUTES.ADMIN_DASHBOARD            // /admin/(tabs)
ROUTES.EMPLOYEE_DASHBOARD         // /employee/(tabs)
ROUTES.RESTAURANT_OWNER_DASHBOARD // /(tabs)
ROUTES.ONBOARDING_RESTAURANT      // /onboarding/restaurant

USER_ROLES.ADMIN                  // 'admin'
USER_ROLES.EMPLOYEE               // 'employee'
USER_ROLES.RESTAURANT_OWNER       // 'restaurant_owner'
```

---

## Access Control Summary

| Route pattern | Who can access |
|---------------|---------------|
| `/auth/*` | Unauthenticated |
| `/` (index) | Any — redirects by role |
| `/onboarding/restaurant` | Authenticated user without a restaurant |
| `/admin/**` | Admin |
| `/employee/**` | Employee role |
| `/(tabs)/**` | Restaurant owner |
| `/checkout` | Restaurant owner or admin |
| `/order/[id]` | Order owner, any employee, or admin |
| `/favorites`, `/orders` | Restaurant owner |
| `/profile/edit` | Restaurant owner or employee (own screen) |

---

## Screen Map

### Root

**`app/index.tsx`** — Auth gate and role router. Checks session → redirects to login if none; to onboarding if no restaurant; to role-appropriate dashboard otherwise.

---

### Auth (`app/auth/`)

Stack with hidden headers.

| File | Screen | Notes |
|------|--------|-------|
| `login.tsx` | Sign in | Email + password |
| `signup.tsx` | Sign up | Uses `signupReducer` |
| `forgot-password.tsx` | Forgot password | Sends reset email |
| `reset-password.tsx` | Reset password | Uses `resetPasswordReducer` |
| `callback.tsx` | OAuth callback | Handles magic link / OAuth tokens |

---

### Onboarding (`app/onboarding/`)

| File | Screen | Notes |
|------|--------|-------|
| `restaurant.tsx` | Create restaurant | Uses `restaurantOnboardingReducer`; validates Miami-Dade address |

---

### Restaurant Owner (`app/(tabs)/`)

Tabs: **Dashboard · Products · Cart · Profile**

| File | Tab / Screen | Notes |
|------|-------------|-------|
| `(tabs)/index.tsx` | Dashboard | Summary cards, recent orders, quick actions |
| `(tabs)/explore.tsx` | Products | `ProductsScreenComponent` |
| `(tabs)/cart.tsx` | Cart | `CartScreenComponent` |
| `(tabs)/profile.tsx` | Profile | `UserProfile` |
| `checkout.tsx` | Checkout | Uses `checkoutReducer`; admin can select restaurant via dropdown |
| `favorites.tsx` | Favorites | Uses `favoritesReducer`; stepper + add to cart |
| `orders.tsx` | Order history | Status filter tabs |
| `order/[id].tsx` | Order detail | Uses `orderReducer`; status dropdown + date picker for admin/employee |
| `profile/edit.tsx` | Edit profile | `EditProfileForm` |

---

### Admin (`app/admin/`)

Stack wrapping a nested tab set. Admin also shares `/checkout`, `/order/[id]`, `/favorites`, and `/orders` with restaurant owners.

**Tabs:** Dashboard · Prices · Truck Load · Products · Cart · Profile

| File | Tab / Screen | Notes |
|------|-------------|-------|
| `(tabs)/index.tsx` | Dashboard | KPIs, charts, top items, recent orders; month selector |
| `(tabs)/prices.tsx` | Prices | Set final delivery-day prices; uses `adminPricesReducer` |
| `(tabs)/truck-load.tsx` | Truck Load | `TruckLoadScreen` |
| `(tabs)/explore.tsx` | Products | `ProductsScreenComponent` |
| `(tabs)/cart.tsx` | Cart | `CartScreenComponent` |
| `(tabs)/profile.tsx` | Profile | `UserProfile` |
| `orders.tsx` | All orders | Infinite scroll, status filter, cursor pagination |
| `items.tsx` | Item management | Search + pagination + create/edit/delete; uses `adminItemsReducer` |
| `employees.tsx` | Employee management | Assign restaurants to employees; uses `employeeManagementReducer` |
| `restaurants.tsx` | Revenue by restaurant | Full dataset (linked from dashboard card) |
| `revenue-by-day.tsx` | Revenue by day | Full dataset (linked from dashboard card) |
| `orders-by-day.tsx` | Orders by day | Full dataset (linked from dashboard card) |
| `top-items.tsx` | Top items | Full dataset (linked from dashboard card) |

---

### Employee (`app/employee/`)

Stack wrapping a nested tab set.

**Tabs:** Dashboard · Truck Load · Profile

| File | Tab / Screen | Notes |
|------|-------------|-------|
| `(tabs)/index.tsx` | Dashboard | Last 5 orders with "View all" |
| `(tabs)/truck-load.tsx` | Truck Load | `TruckLoadScreen` |
| `(tabs)/profile/index.tsx` | Profile | `UserProfile` |
| `(tabs)/profile/edit.tsx` | Edit profile | `EditProfileForm` |
| `orders.tsx` | All orders | Cursor-paginated; filter by status + assigned restaurant |

---

## Reducers

Each reducer owns local/UI state for one screen or feature. They live in `reducers/`.

### `signupReducer`
**Used by:** `auth/signup.tsx`

| Field | Type |
|-------|------|
| `formData.firstName/lastName/email/password/confirmPassword/phone` | string |
| `errors` | `Record<string, string>` |
| `isLoading` | boolean |

Actions: `SET_FIELD`, `SET_ERROR`, `SET_ALL_ERRORS`, `SUBMIT_START`, `SUBMIT_END`, `RESET_FORM`

---

### `resetPasswordReducer`
**Used by:** `auth/reset-password.tsx`

| Field | Type |
|-------|------|
| `password`, `confirmPassword` | string |
| `isLoading` | boolean |
| `isAuthenticated` | `boolean \| null` |

Actions: `SET_PASSWORD`, `SET_CONFIRM_PASSWORD`, `AUTH_SUCCESS`, `AUTH_FAILURE`, `SUBMIT_START`, `SUBMIT_END`

---

### `restaurantOnboardingReducer`
**Used by:** `onboarding/restaurant.tsx`

| Field | Type |
|-------|------|
| `formData.name/address_line1/address_line2/city/postal_code/country` | string |
| `errors` | `Record<string, string>` |
| `isLoading` | boolean |
| `addressValidationError` | `string \| null` |

Actions: `SET_FIELD`, `SET_ERROR`, `SET_ERRORS`, `CLEAR_ERROR`, `START_SUBMISSION`, `SET_SUBMISSION_ERROR`, `RESET_SUBMISSION`

---

### `checkoutReducer`
**Used by:** `checkout.tsx`

| Field | Type |
|-------|------|
| `selectedRestaurantId` | `string \| null` |
| `restaurantName`, `contactPerson`, `phoneNumber`, `email`, `deliveryAddress` | string |
| `dropdownVisible` | boolean |
| `deliveryDate` | `Date \| null` |
| `specialInstructions` | string |
| `iosPickerVisible` | boolean |
| `iosTempDate` | Date |
| `paymentMethod` | `'net30' \| 'credit' \| 'cash'` |

Actions: `SET_SELECTED_RESTAURANT_ID`, `TOGGLE_DROPDOWN`, `SET_EMAIL`, `SET_DELIVERY_DATE`, `SET_SPECIAL_INSTRUCTIONS`, `SET_PAYMENT_METHOD`, `OPEN_IOS_PICKER`, `CONFIRM_IOS_DATE`, `CANCEL_IOS_DATE`, `SELECT_ADMIN_RESTAURANT`, `SYNC_RESTAURANT_DATA`, `SYNC_CONTACT_DATA`

---

### `favoritesReducer`
**Used by:** `favorites.tsx`

| Field | Type |
|-------|------|
| `pendingItemId` | `string \| null` |
| `showToast`, `toastMessage` | boolean, string |
| `stepperItems` | `Record<string, number>` |

Actions: `SET_PENDING_ITEM`, `SHOW_TOAST`, `HIDE_TOAST`, `SYNC_CART_ITEMS`, `UPDATE_QUANTITY_OPTIMISTIC`, `UPDATE_QUANTITY_REVERT`, `REMOVE_FROM_FAVORITES_SUCCESS`

---

### `cartReducer`
**Used by:** `(tabs)/cart.tsx`, `admin/(tabs)/cart.tsx`

| Field | Type |
|-------|------|
| `isClearing` | boolean |
| `updatingItemId` | `string \| null` |
| `editingItem` | `EditingItem \| null` |
| `editQuantity` | string |

Actions: `START_CLEARING`, `FINISH_CLEARING`, `START_UPDATING_ITEM`, `FINISH_UPDATING_ITEM`, `START_EDITING_ITEM`, `SET_EDIT_QUANTITY`, `CLOSE_EDIT_MODAL`

---

### `orderReducer`
**Used by:** `order/[id].tsx`

| Field | Type |
|-------|------|
| `status.isUpdating`, `status.isDropdownOpen`, `status.showToast` | boolean |
| `date.isUpdating`, `date.showPicker` | boolean |
| `date.tempDate` | `Date \| null` |
| `pdf.isPreviewing`, `pdf.isDownloading` | boolean |

Actions: `SET_STATUS_UPDATING`, `SET_STATUS_DROPDOWN_OPEN`, `SET_SHOW_STATUS_TOAST`, `SET_DATE_UPDATING`, `SET_SHOW_DATE_PICKER`, `SET_TEMP_DATE`, `SET_PDF_PREVIEWING`, `SET_PDF_DOWNLOADING`

---

### `adminItemsReducer`
**Used by:** `admin/items.tsx`

| Field | Type |
|-------|------|
| `searchQuery` | string |
| `currentPage` | number (resets on search change) |
| `isFormModalVisible` | boolean |
| `editingItem` | `Item \| null` (null = create mode) |

Actions: `SET_SEARCH_QUERY`, `SET_PAGE`, `OPEN_CREATE_MODAL`, `OPEN_EDIT_MODAL`, `CLOSE_MODAL`

---

### `adminPricesReducer`
**Used by:** `admin/(tabs)/prices.tsx`

State is a flat `Record<itemId, string>` of sanitized price inputs.

Actions: `SET_PRICE`, `CLEAR_PRICES`

Sanitization: strips non-numeric except decimal, limits to 2dp, prepends `0` if string starts with `.`.

---

### `employeeManagementReducer`
**Used by:** `admin/employees.tsx`

| Field | Type |
|-------|------|
| `employeeDropdownVisible`, `restaurantDropdownVisible` | boolean |
| `selectedEmployeeId`, `selectedRestaurantId` | `string \| null` |

Actions: `TOGGLE_EMPLOYEE_DROPDOWN`, `TOGGLE_RESTAURANT_DROPDOWN`, `SELECT_EMPLOYEE`, `SELECT_RESTAURANT`, `CLOSE_DROPDOWNS`

Dropdowns are mutually exclusive; selecting from one auto-closes the other.

---

### `itemFormReducer`
**Used by:** `ItemFormModal` (inside `admin/items.tsx`)

| Field | Type |
|-------|------|
| `data.name/description/price/unit/image_url` | string |
| `errors` | `Record<string, string>` |

Actions: `INITIALIZE`, `SET_FIELD`, `SET_ERRORS`. Setting a field auto-clears its error.

---

### `editProfileReducer`
**Used by:** `EditProfileForm` component

| Field | Type |
|-------|------|
| `email`, `firstName`, `lastName`, `phone` | string |
| `isInitialized` | boolean |

Actions: `INITIALIZE`, `SET_EMAIL`, `SET_FIRST_NAME`, `SET_LAST_NAME`, `SET_PHONE`

---

### `truckLoadReducer`
**Used by:** `TruckLoadScreen` component

| Field | Type |
|-------|------|
| `expandedItems` | `Set<string>` |
| `pdfStatus` | `'idle' \| 'previewing' \| 'downloading'` |

Actions: `TOGGLE_ITEM`, `START_PDF_PREVIEW`, `START_PDF_DOWNLOAD`, `FINISH_PDF_ACTION`
