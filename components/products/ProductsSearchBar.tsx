import { ThemedSearchBar } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet } from 'react-native';

interface ProductsSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function ProductsSearchBar({
  searchQuery,
  setSearchQuery,
}: ProductsSearchBarProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ThemedSearchBar
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Search products..."
      style={[styles.container, { borderColor: colors.textTertiary }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
});
