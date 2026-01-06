import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

type ColorSchemeColors = (typeof Colors)['light'];

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: ColorSchemeColors;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isActive,
  onPress,
  colors,
}) => (
  <TouchableOpacity
    style={[
      styles.filterChip,
      isActive
        ? { backgroundColor: colors.primary, borderColor: colors.primary }
        : { backgroundColor: colors.surface, borderColor: colors.border },
    ]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: isActive }}
    accessibilityLabel={`Filter by ${label}`}
    accessibilityHint={isActive ? 'Currently active filter' : 'Tap to filter'}
  >
    <Text
      style={[
        styles.filterText,
        isActive ? { color: 'white' } : { color: colors.textSecondary },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
