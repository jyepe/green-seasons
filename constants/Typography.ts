/**
 * Green Seasons Typography
 * Font families, type scale, weights, and line heights.
 * Source of truth: project/colors_and_type.css
 */

import type { TextStyle } from 'react-native';

export const FontFamily = {
  sans: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  mono: 'SpaceMono',
} as const;

export const FontSize = {
  title: 32, // Auth title, screen titles
  h1: 28, // Welcome / cart header
  h2: 24, // KPI value, totals
  h3: 20, // Section heading, subtitle
  body: 16, // Default body, button label
  label: 14, // Labels, filter chips
  small: 12, // Meta, KPI label, status badge
  micro: 10, // Disclaimers
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const LineHeight = {
  tight: 1.0,
  snug: 1.25,
  normal: 1.5,
} as const;

// RN's `letterSpacing` style is absolute px (not em), so values here are
// pre-computed against the font size they apply to in the CSS source.
export const LetterSpacing = {
  title: -0.32, // -0.01em at FontSize.title (32px)
  h1: -0.14, // -0.005em at FontSize.h1 (28px)
  normal: 0,
} as const;
