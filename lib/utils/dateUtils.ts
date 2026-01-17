/**
 * Parses a date string in YYYY-MM-DD format to a local Date object at midnight.
 * This avoids timezone conversion issues when working with date-only strings.
 *
 * @param dayStr - Date string in YYYY-MM-DD format
 * @returns Date object at local midnight
 */
export function parseLocalDate(dayStr: string): Date {
  const [y, m, d] = dayStr.split('-').map(Number);
  return new Date(y, m - 1, d); // local midnight
}

/**
 * Formats a Date object to a YYYY-MM-DD string using local time.
 * This is the inverse of parseLocalDate and avoids UTC timezone issues.
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format (local time)
 */
export function formatLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string in YYYY-MM-DD format to a readable string.
 *
 * @param dayStr - Date string in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Mon, Jan 15")
 */
export function formatDate(dayStr: string): string {
  const date = parseLocalDate(dayStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
