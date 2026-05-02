// components/profile/utils.ts

/**
 * Convert a #RRGGBB hex string + alpha (0–1) into an `rgba(r, g, b, a)` string.
 * Used for icon-tile backgrounds where we want a transparent tint of the icon's
 * own color in a way that works in both light and dark mode.
 */
export function withAlpha(hex: string, alpha: number): string {
  const trimmed = hex.replace('#', '');
  const r = parseInt(trimmed.slice(0, 2), 16);
  const g = parseInt(trimmed.slice(2, 4), 16);
  const b = parseInt(trimmed.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
