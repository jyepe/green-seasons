import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { ProductCard, ProductItem } from './ProductCard';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface ProductsGridProps {
  products: ProductItem[];
  isLoading: boolean;
  error: unknown;
  getCartQuantity: (itemId: string) => number;
  getStepperQuantity: (itemId: string) => number;
  isStepperMode: (itemId: string) => boolean;
  pendingItemId: string | null;
  onToggleFavorite: (itemId: string, currentlyFavorite: boolean) => void;
  onAddToCart: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
}

export default function ProductsGrid({
  products,
  isLoading,
  error,
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

  return (
    <ScrollView
      style={styles.productsContainer}
      contentContainerStyle={styles.productsContent}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading products...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Failed to load products. Please try again.
          </Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text
            style={[styles.emptyStateText, { color: colors.textSecondary }]}
          >
            No products found. Try a different search.
          </Text>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {products.map(item => (
            <ProductCard
              key={item.id}
              item={item}
              quantityInCart={getCartQuantity(item.id)}
              stepperQuantity={getStepperQuantity(item.id)}
              isStepperMode={isStepperMode(item.id)}
              isPending={pendingItemId === item.id}
              onToggleFavorite={onToggleFavorite}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  productsContainer: {
    flex: 1,
  },
  productsContent: {
    paddingBottom: 24,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
