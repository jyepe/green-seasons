/**
 * Application route constants
 * Centralized route paths for consistent navigation
 */

export const ROUTES = {
  // Authentication
  AUTH_LOGIN: '/auth/login',

  // Dashboard routes
  ADMIN_DASHBOARD: '/admin/(tabs)',
  EMPLOYEE_DASHBOARD: '/employee/(tabs)',
  RESTAURANT_OWNER_DASHBOARD: '/(tabs)',

  // Onboarding
  ONBOARDING_RESTAURANT: '/onboarding/restaurant',
} as const;

/**
 * User role constants
 */
export const USER_ROLES = {
  EMPLOYEE: 'employee',
  ADMIN: 'admin',
  RESTAURANT_OWNER: 'restaurant_owner',
} as const;
