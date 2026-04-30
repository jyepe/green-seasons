import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useAddToCart, useCart, useCartRefetchOnFocus } from '@/hooks/useCart';
import { useItems, useItemsRefetchOnFocus } from '@/hooks/useItems';
import { useToggleFavorite } from '@/hooks/useFavorite';
import { Toast } from '@/components/ui/Toast';
import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { Alert, StyleSheet, AccessibilityInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductsScreenHeader from './ProductsScreenHeader';
import ProductsDisclaimer from './ProductsDisclaimer';
import ProductsSearchBar from './ProductsSearchBar';
import ProductsGrid from './ProductsGrid';
import PaginationControls from './PaginationControls';
import { initialState, productsScreenReducer } from './ProductsScreenState';

const ITEMS_PER_PAGE = 10;

export default function ProductsScreenComponent() {
  // Use a reducer to manage complex state transitions and avoid synchronization issues
  // between search query, pagination, and optimistic cart updates.
  const [state, dispatch] = useReducer(productsScreenReducer, initialState);
  const { searchQuery, currentPage, pendingItemId, showToast, stepperItems } =
    state;

  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { data: items, isLoading, error } = useItems();
  const { data: cartItems } = useCart();
  const addToCartMutation = useAddToCart();
  const toggleFavoriteMutation = useToggleFavorite();

  // Refetch cart when screen comes into focus to stay in sync with other screens
  useCartRefetchOnFocus();

  // Refetch items when screen comes into focus to get the latest information
  useItemsRefetchOnFocus();

  const { filteredProducts, paginatedProducts, totalPages, safePage } =
    useMemo(() => {
      const filtered =
        items?.filter(item => {
          const matchesSearch = item.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          return matchesSearch;
        }) || [];

      const total = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
      const safe = Math.min(Math.max(currentPage, 1), total);
      const paginated = filtered.slice(
        (safe - 1) * ITEMS_PER_PAGE,
        safe * ITEMS_PER_PAGE
      );

      return {
        filteredProducts: filtered,
        paginatedProducts: paginated,
        totalPages: total,
        safePage: safe,
      };
    }, [items, searchQuery, currentPage]);

  // Sync state with props/external data
  useEffect(() => {
    // If page becomes invalid (e.g. items filtered out), clamp it
    if (currentPage > totalPages) {
      dispatch({ type: 'SET_PAGE', payload: totalPages });
    }
  }, [currentPage, totalPages]);

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
    dispatch({ type: 'ADD_TO_CART_START', payload: itemId });
    try {
      await addToCartMutation.mutateAsync({
        itemId,
        quantityDelta: 1,
      });
      // Show success toast
      dispatch({ type: 'ADD_TO_CART_SUCCESS' });
      AccessibilityInfo.announceForAccessibility('Item added to cart');
      // Stepper will be shown automatically when cart updates
    } catch (error) {
      // Error is already logged in the supabase function
      dispatch({ type: 'ADD_TO_CART_ERROR' });
      handleCartError(error, 'Failed to add item to cart. Please try again.');
    }
  };

  const handleUpdateCartQuantity = async (itemId: string, delta: number) => {
    const currentQuantity = getStepperQuantity(itemId);
    const newQuantity = Math.max(0, currentQuantity + delta);
    const cartQty = getCartQuantity(itemId);

    // Optimistically update
    dispatch({
      type: 'UPDATE_QUANTITY_OPTIMISTIC',
      payload: { itemId, quantity: newQuantity },
    });

    try {
      // Calculate the delta needed
      const quantityDelta = newQuantity - cartQty;

      // Always call the mutation, even if delta is 0 (to handle removal case)
      // The RPC function will handle deletion when quantity becomes <= 0
      await addToCartMutation.mutateAsync({
        itemId,
        quantityDelta,
      });

      // If item was removed (quantity is now 0), Accessibility announcement
      if (newQuantity <= 0) {
        AccessibilityInfo.announceForAccessibility('Item removed from cart');
      }
    } catch (error) {
      handleCartError(error, 'Failed to update cart. Please try again.');
      // Revert on error
      dispatch({
        type: 'UPDATE_QUANTITY_ERROR',
        payload: { itemId, quantity: cartQty },
      });
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
          onError: error => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to update favorite status. Please try again.';
            Alert.alert('Error', errorMessage);
          },
          onSuccess: () => {
            AccessibilityInfo.announceForAccessibility(
              currentlyFavorite
                ? 'Removed from favorites'
                : 'Added to favorites'
            );
          },
        }
      );
    },
    [toggleFavoriteMutation]
  );

  const handlePageChange = (newPage: number) => {
    dispatch({ type: 'SET_PAGE', payload: newPage });
    AccessibilityInfo.announceForAccessibility(
      `Page ${newPage} of ${totalPages}`
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityLabel="Explore Products Screen"
    >
      <Toast
        message="Item added to cart!"
        type="success"
        visible={showToast}
        onHide={handleToastHide}
      />
      <ProductsScreenHeader />

      <ProductsDisclaimer />

      <ProductsSearchBar
        searchQuery={searchQuery}
        setSearchQuery={query =>
          dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
        }
      />

      <ProductsGrid
        products={paginatedProducts}
        isLoading={isLoading}
        error={error}
        getCartQuantity={getCartQuantity}
        getStepperQuantity={getStepperQuantity}
        isStepperMode={isStepperMode}
        pendingItemId={pendingItemId}
        onToggleFavorite={handleToggleFavorite}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateCartQuantity}
      />

      {!isLoading && !error && filteredProducts.length > 0 && (
        <PaginationControls
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
