/**
 * Validates a password against the application's password requirements.
 * Password must:
 * - Be at least 8 characters long
 * - Contain at least one lowercase letter
 * - Contain at least one uppercase letter
 * - Contain at least one number
 *
 * @param password - The password string to validate
 * @returns An error message if validation fails, or null if password is valid
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/(?=.*\d)/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}
