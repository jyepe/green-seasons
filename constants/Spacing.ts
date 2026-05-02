/**
 * Green Seasons Spacing & Layout
 * Spacing scale, radii, and shadow tokens.
 * Source of truth: project/colors_and_type.css
 */

import type { ViewStyle } from 'react-native';

export const Spacing = {
  s1: 4,
  s2: 8, // compact gap
  s3: 12, // standard gap
  s4: 16, // loose / section gap
  s5: 20, // screen horizontal pad
  s6: 24, // large gap
  s8: 32, // hero gap
} as const;

export const Radius = {
  sm: 8, // inputs, small chips
  md: 12, // cards, buttons
  lg: 16, // modals
  xl: 20, // auth card
  pill: 999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  toast: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
} as const satisfies Record<string, ViewStyle>;
