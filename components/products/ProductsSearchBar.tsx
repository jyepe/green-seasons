import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ProductsSortMenu from './ProductsSortMenu';
import type { SortKey } from './ProductsScreenState';

interface ProductsSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortKey;
  onSortChange: (next: SortKey) => void;
}

export default function ProductsSearchBar({
  searchQuery,
  setSearchQuery,
  sortBy,
  onSortChange,
}: ProductsSearchBarProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const borderColor = focused ? colors.primary : colors.border;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surface,
            borderColor,
          },
          focused && {
            shadowColor: colors.primary,
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
            elevation: 0,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={colors.textSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search products..."
          placeholderTextColor={colors.textSecondary + '99'}
          style={[styles.input, { color: colors.text }]}
          accessibilityLabel="Search products"
          accessibilityRole="search"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.sortAnchor}>
        <Pressable
          onPress={() => setMenuOpen(o => !o)}
          style={({ pressed }) => [
            styles.sortBtn,
            {
              backgroundColor: colors.surface,
              borderColor: menuOpen ? colors.primary : colors.border,
            },
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sort products"
          accessibilityState={{ expanded: menuOpen }}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.text} />
        </Pressable>
        <ProductsSortMenu
          visible={menuOpen}
          sortBy={sortBy}
          onSelect={onSortChange}
          onDismiss={() => setMenuOpen(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
    zIndex: 10,
  },
  inputWrap: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  sortAnchor: {
    position: 'relative',
  },
  sortBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
