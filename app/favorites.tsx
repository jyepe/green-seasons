import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAddToCart, useCart, useCartRefetchOnFocus } from '@/hooks/useCart';
import { useFavoriteItems, useToggleFavorite } from '@/hooks/useFavorite';
import { ProductCard } from '@/components/ProductCard';
import { Toast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  const router = useRouter();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Item added to cart!');
  const [stepperItems, setStepperItems] = useState<Record<string, number>>({});
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: favoriteItems, isLoading, error } = useFavoriteItems();
  const { data: cartItems } = useCart();
  const addToCartMutation = useAddToCart();
  const toggleFavoriteMutation = useToggleFavorite();

  // Refetch cart when screen comes into focus to stay in sync with other screens
  useCartRefetchOnFocus();

  // Sync stepper items with cart when cart updates
  useEffect(() => {
    if (cartItems) {
      setStepperItems(() => {
        const updated: Record<string, number> = {};
        cartItems.forEach(cartItem => {
          updated[cartItem.item_id] = cartItem.quantity;
        });
        return updated;
      });
    }
  }, [cartItems]);

  // Get cart quantity for an item
  const getCartQuantity = (itemId: string): number => {
    const cartItem = cartItems?.find(item => item.item_id === itemId);
    return cartItem?.quantity || 0;
  };

  // Get current quantity for stepper (either from stepper state or cart)
  const getStepperQuantity = (itemId: string): number => {
    if (stepperItems[itemId] !== undefined) {
      return stepperItems[itemId];
    }
    const cartQty = getCartQuantity(itemId);
    return cartQty > 0 ? cartQty : 1;
  };

  // Check if item is in cart
  const isInCart = (itemId: string): boolean => {
    return getCartQuantity(itemId) > 0;
  };

  // Check if item is in stepper mode (in cart or recently added)
  const isStepperMode = (itemId: string): boolean => {
    return isInCart(itemId);
  };

  // Shared error handling helper
  const handleCartError = useCallback(
    (error: unknown, defaultMessage: string) => {
      const errorMessage =
        error instanceof Error ? error.message : defaultMessage;
      Alert.alert('Error', errorMessage);
    },
    []
  );

  const handleAddToCart = async (itemId: string) => {
    setPendingItemId(itemId);
    try {
      await addToCartMutation.mutateAsync({
        itemId,
        quantityDelta: 1,
      });
      setToastMessage('Item added to cart!');
      setShowToast(true);
    } catch (err) {
      handleCartError(err, 'Failed to add item to cart. Please try again.');
    } finally {
      setPendingItemId(null);
    }
  };

  const handleUpdateCartQuantity = async (itemId: string, delta: number) => {
    const currentQuantity = getStepperQuantity(itemId);
    const newQuantity = Math.max(0, currentQuantity + delta);

    setStepperItems(prev => ({ ...prev, [itemId]: newQuantity }));

    setPendingItemId(itemId);
    try {
      const cartQuantity = getCartQuantity(itemId);
      const quantityDelta = newQuantity - cartQuantity;

      await addToCartMutation.mutateAsync({
        itemId,
        quantityDelta,
      });

      if (newQuantity <= 0) {
        setStepperItems(prev => {
          const { [itemId]: _, ...rest } = prev;
          return rest;
        });
      }
    } catch (err) {
      handleCartError(err, 'Failed to update cart. Please try again.');
      const cartQty = getCartQuantity(itemId);
      setStepperItems(prev => {
        if (cartQty > 0) {
          return { ...prev, [itemId]: cartQty };
        }
        const { [itemId]: _, ...rest } = prev;
        return rest;
      });
    } finally {
      setPendingItemId(null);
    }
  };

  const handleToastHide = useCallback(() => {
    setShowToast(false);
  }, []);

  const handleToggleFavorite = useCallback(
    (itemId: string, currentlyFavorite: boolean) => {
      toggleFavoriteMutation.mutate(
        { itemId, currentlyFavorite },
        {
          onSuccess: () => {
            // Show toast notification when removing from favorites
            if (currentlyFavorite) {
              setToastMessage('Removed from favorites');
              setShowToast(true);
            }
          },
          onError: error => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to update favorite status. Please try again.';
            Alert.alert('Error', errorMessage);
          },
        }
      );
    },
    [toggleFavoriteMutation]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Toast
        message={toastMessage}
        type="success"
        visible={showToast}
        onHide={handleToastHide}
      />

      {/* Favorites Grid */}
      <ScrollView
        style={styles.productsContainer}
        contentContainerStyle={styles.productsContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading favorites...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text }]}>
              Failed to load favorites. Please try again.
            </Text>
          </View>
        ) : !favoriteItems || favoriteItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="heart-outline"
              size={64}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No Favorites Yet
            </Text>
            <Text
              style={[styles.emptyStateText, { color: colors.textSecondary }]}
            >
              Start adding items to your favorites by tapping the heart icon on
              any product.
            </Text>
            <TouchableOpacity
              style={[styles.browseButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {favoriteItems.map(item => (
              <ProductCard
                key={item.id}
                item={item}
                quantityInCart={getCartQuantity(item.id)}
                stepperQuantity={getStepperQuantity(item.id)}
                isStepperMode={isStepperMode(item.id)}
                isPending={pendingItemId === item.id}
                onToggleFavorite={handleToggleFavorite}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateCartQuantity}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
