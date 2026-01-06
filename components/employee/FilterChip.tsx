import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: {
    primary: string;
    surface: string;
    border: string;
    textSecondary: string;
  };
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
    fontWeight: '500',
    fontFamily: 'Inter_600SemiBold',
  },
});
