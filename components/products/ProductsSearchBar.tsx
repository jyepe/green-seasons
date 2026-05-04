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
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
  const [menuOpen, setMenuOpen] = useState(false);

  // Animate border color on the native side to avoid a synchronous React
  // re-render during the native focus event, which can cause immediate blur
  // in the New Architecture.
  const focusProgress = useSharedValue(0);
  const inputWrapAnimStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [colors.border, colors.primary]
    ),
  }));

  return (
    <View style={styles.row}>
      <Animated.View
        style={[
          styles.inputWrap,
          { backgroundColor: colors.surface },
          inputWrapAnimStyle,
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
          onFocus={() => {
            focusProgress.value = withTiming(1, { duration: 150 });
          }}
          onBlur={() => {
            focusProgress.value = withTiming(0, { duration: 150 });
          }}
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
      </Animated.View>

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
