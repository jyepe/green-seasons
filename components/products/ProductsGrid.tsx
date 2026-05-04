import { LoadingView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { ProductCard, ProductItem } from './ProductCard';

interface ProductsGridProps {
  products: ProductItem[];
  isLoading: boolean;
  error: unknown;
  cartBarVisible: boolean;
  searchActive: boolean;
  onClearSearch: () => void;
  getCartQuantity: (itemId: string) => number;
  getStepperQuantity: (itemId: string) => number;
  isStepperMode: (itemId: string) => boolean;
  pendingItemId: string | null;
  onToggleFavorite: (itemId: string, currentlyFavorite: boolean) => void;
  onAddToCart: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
}

const COLUMN_GAP = 12;

export default function ProductsGrid({
  products,
  isLoading,
  error,
  cartBarVisible,
  searchActive,
  onClearSearch,
  getCartQuantity,
  getStepperQuantity,
  isStepperMode,
  pendingItemId,
  onToggleFavorite,
  onAddToCart,
  onUpdateQuantity,
}: ProductsGridProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  if (isLoading) {
    return <LoadingView message="Loading products..." />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
        <Text style={[styles.bodyText, { color: colors.text }]}>
          Failed to load products. Please try again.
        </Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="basket-outline" size={36} color={colors.textTertiary} />
        <Text style={[styles.emptyHeadline, { color: colors.text }]}>
          No products found
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Try a different search.
        </Text>
        {searchActive ? (
          <Pressable
            onPress={onClearSearch}
            style={({ pressed }) => [
              styles.clearBtn,
              {
                borderColor: colors.primary,
                backgroundColor: pressed ? colors.primary : 'transparent',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            {({ pressed }) => (
              <Text
                style={[
                  styles.clearBtnText,
                  { color: pressed ? 'white' : colors.primary },
                ]}
              >
                Clear search
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    );
  }

  const renderItem: ListRenderItem<ProductItem> = ({ item }) => (
    <View style={styles.cell}>
      <ProductCard
        item={item}
        quantityInCart={getCartQuantity(item.id)}
        stepperQuantity={getStepperQuantity(item.id)}
        isStepperMode={isStepperMode(item.id)}
        isPending={pendingItemId === item.id}
        onToggleFavorite={onToggleFavorite}
        onAddToCart={onAddToCart}
        onUpdateQuantity={onUpdateQuantity}
      />
    </View>
  );

  return (
    <FlatList
      data={products}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: cartBarVisible ? 96 : 24 },
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  row: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  cell: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyHeadline: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  bodyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  clearBtn: {
    marginTop: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});
