import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SortKey } from './ProductsScreenState';

type SortOption = { key: SortKey; label: string };

export const SORT_OPTIONS: SortOption[] = [
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'price-asc', label: 'Price (low → high)' },
  { key: 'price-desc', label: 'Price (high → low)' },
];

export const SORT_LABELS: Record<SortKey, string> = {
  name: 'Name A–Z',
  'price-asc': 'Price low→high',
  'price-desc': 'Price high→low',
};

type ProductsSortMenuProps = {
  visible: boolean;
  sortBy: SortKey;
  onSelect: (next: SortKey) => void;
  onDismiss: () => void;
};

export default function ProductsSortMenu({
  visible,
  sortBy,
  onSelect,
  onDismiss,
}: ProductsSortMenuProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  if (!visible) return null;

  return (
    <>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View
        style={[
          styles.menu,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: '#000',
          },
        ]}
        accessibilityRole="menu"
      >
        {SORT_OPTIONS.map(opt => {
          const active = opt.key === sortBy;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                onSelect(opt.key);
                onDismiss();
              }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.inputBackground },
              ]}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Sort by ${opt.label}${active ? ', selected' : ''}`}
            >
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {opt.label}
              </Text>
              {active ? (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: 52,
    right: 0,
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
