import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAddToCart, useCart, useCartRefetchOnFocus } from '@/hooks/useCart';
import { useItems } from '@/hooks/useItems';
import { useToggleFavorite } from '@/hooks/useFavorite';
import { Toast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ITEMS_PER_PAGE = 10;

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [stepperItems, setStepperItems] = useState<Record<string, number>>({});
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: items, isLoading, error } = useItems();
  const { data: cartItems } = useCart();
  const addToCartMutation = useAddToCart();
  const toggleFavoriteMutation = useToggleFavorite();

  // Refetch cart when screen comes into focus to stay in sync with other screens
  useCartRefetchOnFocus();

  const filteredProducts =
    items?.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    }) || [];

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const hasPrevious = safePage > 1;
  const hasNext = safePage < totalPages;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Sync stepper items with cart when cart updates
  useEffect(() => {
    if (cartItems) {
      setStepperItems(prev => {
        const updated: Record<string, number> = {};
        // Sync stepper state with actual cart quantities
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
      // Show success toast
      setShowToast(true);
      // Stepper will be shown automatically when cart updates
    } catch (error) {
      // Error is already logged in the supabase function
      handleCartError(error, 'Failed to add item to cart. Please try again.');
    } finally {
      setPendingItemId(null);
    }
  };

  const handleUpdateCartQuantity = async (itemId: string, delta: number) => {
    const currentQuantity = getStepperQuantity(itemId);
    const newQuantity = Math.max(0, currentQuantity + delta);

    // If quantity would be 0 or less, allow it (will trigger removal)
    setStepperItems(prev => ({ ...prev, [itemId]: newQuantity }));

    setPendingItemId(itemId);
    try {
      // Calculate the delta needed
      const cartQuantity = getCartQuantity(itemId);
      const quantityDelta = newQuantity - cartQuantity;

      // Always call the mutation, even if delta is 0 (to handle removal case)
      // The RPC function will handle deletion when quantity becomes <= 0
      await addToCartMutation.mutateAsync({
        itemId,
        quantityDelta,
      });

      // If item was removed (quantity is now 0), clear stepper state
      if (newQuantity <= 0) {
        setStepperItems(prev => {
          const { [itemId]: _, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      handleCartError(error, 'Failed to update cart. Please try again.');
      // Revert on error - restore to current cart quantity
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
      toggleFavoriteMutation.mutate({ itemId, currentlyFavorite });
    },
    [toggleFavoriteMutation]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Toast
        message="Item added to cart!"
        type="success"
        visible={showToast}
        onHide={handleToastHide}
      />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Fresh Produce
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Order the freshest ingredients for your restaurant
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.textTertiary,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Products Grid */}
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
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyStateText, { color: colors.textSecondary }]}
            >
              No products found. Try a different search.
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {paginatedProducts.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.productCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.productImageContainer}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.productEmoji}>{'??'}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() =>
                      handleToggleFavorite(item.id, item.is_favorite)
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={item.is_favorite ? 'heart' : 'heart-outline'}
                      size={22}
                      color={
                        item.is_favorite ? '#EF4444' : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text
                      style={[
                        styles.productDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.productPriceContainer}>
                    <Text
                      style={[styles.productPrice, { color: colors.primary }]}
                    >
                      ${item.price.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.productUnit,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.unit}
                    </Text>
                  </View>

                  {/* Cart Badge */}
                  {isInCart(item.id) && (
                    <View
                      style={[
                        styles.cartBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons name="checkmark" size={12} color="white" />
                      <Text style={styles.cartBadgeText}>
                        {getCartQuantity(item.id)} in cart
                      </Text>
                    </View>
                  )}

                  {/* Add to Cart Button or Stepper */}
                  {!isStepperMode(item.id) ? (
                    <TouchableOpacity
                      style={[
                        styles.addToCartButton,
                        {
                          backgroundColor: colors.primary,
                        },
                        pendingItemId === item.id && styles.addButtonDisabled,
                      ]}
                      onPress={() => handleAddToCart(item.id)}
                      disabled={pendingItemId === item.id}
                    >
                      {pendingItemId === item.id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="cart" size={18} color="white" />
                          <Text style={styles.addToCartButtonText}>
                            Add to Cart
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={[
                        styles.stepperContainer,
                        { borderColor: colors.border },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.stepperButton,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderRightWidth: 1,
                          },
                          pendingItemId === item.id &&
                            styles.stepperButtonDisabled,
                        ]}
                        onPress={() => handleUpdateCartQuantity(item.id, -1)}
                        disabled={pendingItemId === item.id}
                      >
                        <Ionicons name="remove" size={18} color={colors.text} />
                      </TouchableOpacity>
                      <View
                        style={[
                          styles.stepperQuantity,
                          { backgroundColor: colors.surface },
                        ]}
                      >
                        {pendingItemId === item.id ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.stepperQuantityText,
                              { color: colors.text },
                            ]}
                          >
                            {getStepperQuantity(item.id)}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.stepperButton,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderLeftWidth: 1,
                          },
                          pendingItemId === item.id &&
                            styles.stepperButtonDisabled,
                        ]}
                        onPress={() => handleUpdateCartQuantity(item.id, 1)}
                        disabled={pendingItemId === item.id}
                      >
                        <Ionicons name="add" size={18} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {!isLoading && !error && filteredProducts.length > 0 && (
        <View
          style={[
            styles.paginationContainer,
            { borderColor: colors.textTertiary },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.paginationButton,
              { backgroundColor: colors.surface },
              !hasPrevious && styles.paginationButtonDisabled,
            ]}
            onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!hasPrevious}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={!hasPrevious ? colors.textTertiary : colors.text}
            />
          </TouchableOpacity>
          <Text
            style={[styles.paginationLabel, { color: colors.textSecondary }]}
          >
            Page {safePage} of {totalPages}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              { backgroundColor: colors.surface },
              !hasNext && styles.paginationButtonDisabled,
            ]}
            onPress={() =>
              setCurrentPage(prev => Math.min(prev + 1, totalPages))
            }
            disabled={!hasNext}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={!hasNext ? colors.textTertiary : colors.text}
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
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
  productCard: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    position: 'relative',
    overflow: 'hidden',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productEmoji: {
    fontSize: 48,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
    lineHeight: 16,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  productUnit: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginLeft: 4,
  },
  cartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  addToCartButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  stepperButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.5,
  },
  stepperQuantity: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQuantityText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
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
