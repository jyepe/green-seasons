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
