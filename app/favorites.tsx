import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useAddToCart, useCart, useCartRefetchOnFocus } from '@/hooks/useCart';
import { useFavoriteItems, useToggleFavorite } from '@/hooks/useFavorite';
import { ProductCard } from '@/components/products/ProductCard';
import { Toast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useReducer } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingView } from '@/components/ThemedView';
import {
  favoritesReducer,
  initialFavoritesState,
} from '@/reducers/favoritesReducer';

export default function FavoritesScreen() {
  const router = useRouter();

  // Use reducer to manage interrelated state (cart sync, stepper, toast, pending items)
  // This replaces multiple useState calls and consolidates update logic
  const [state, dispatch] = useReducer(favoritesReducer, initialFavoritesState);
  const { pendingItemId, showToast, toastMessage, stepperItems } = state;

  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { data: favoriteItems, isLoading, error } = useFavoriteItems();
  const { data: cartItems } = useCart();
  const addToCartMutation = useAddToCart();
  const toggleFavoriteMutation = useToggleFavorite();

  // Refetch cart when screen comes into focus to stay in sync with other screens
  useCartRefetchOnFocus();

  // Sync stepper items with cart when cart updates
  useEffect(() => {
    if (cartItems) {
      dispatch({ type: 'SYNC_CART_ITEMS', payload: cartItems });
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
    dispatch({ type: 'SET_PENDING_ITEM', payload: itemId });
    try {
      await addToCartMutation.mutateAsync({
        itemId,
        quantityDelta: 1,
      });
      dispatch({ type: 'SHOW_TOAST', payload: 'Item added to cart!' });
    } catch (err) {
      handleCartError(err, 'Failed to add item to cart. Please try again.');
    } finally {
      dispatch({ type: 'SET_PENDING_ITEM', payload: null });
    }
  };

  const handleUpdateCartQuantity = async (itemId: string, delta: number) => {
    const currentQuantity = getStepperQuantity(itemId);
    const newQuantity = Math.max(0, currentQuantity + delta);

    // Optimistically update
    dispatch({
      type: 'UPDATE_QUANTITY_OPTIMISTIC',
      payload: { itemId, quantity: newQuantity },
    });

    try {
      const cartQuantity = getCartQuantity(itemId);
      const quantityDelta = newQuantity - cartQuantity;

      await addToCartMutation.mutateAsync({
        itemId,
        quantityDelta,
      });
    } catch (err) {
      handleCartError(err, 'Failed to update cart. Please try again.');
      const cartQty = getCartQuantity(itemId);
      // Revert to original cart quantity
      dispatch({
        type: 'UPDATE_QUANTITY_REVERT',
        payload: { itemId, quantity: cartQty },
      });
    } finally {
      dispatch({ type: 'SET_PENDING_ITEM', payload: null });
    }
  };

  const handleToastHide = useCallback(() => {
    dispatch({ type: 'HIDE_TOAST' });
  }, []);

  const handleToggleFavorite = useCallback(
    (itemId: string, currentlyFavorite: boolean) => {
      toggleFavoriteMutation.mutate(
        { itemId, currentlyFavorite },
        {
          onSuccess: () => {
            // Show toast notification when removing from favorites
            if (currentlyFavorite) {
              dispatch({
                type: 'REMOVE_FROM_FAVORITES_SUCCESS',
                payload: 'Removed from favorites',
              });
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

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My Favorites
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Favorites Grid */}
      <ScrollView
        style={styles.productsContainer}
        contentContainerStyle={styles.productsContent}
      >
        {isLoading ? (
          <LoadingView message="Loading favorites..." />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
