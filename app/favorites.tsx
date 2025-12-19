import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAddToCart, useCart } from '@/hooks/useCart';
import { useFavoriteItems, useToggleFavorite } from '@/hooks/useFavorite';
import { Toast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  const [stepperItems, setStepperItems] = useState<Record<string, number>>({});
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: favoriteItems, isLoading, error } = useFavoriteItems();
  const { data: cartItems } = useCart();
  const addToCartMutation = useAddToCart();
  const toggleFavoriteMutation = useToggleFavorite();

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
                    <Text style={styles.productEmoji}>{'🥬'}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() =>
                      handleToggleFavorite(item.id, item.is_favorite)
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="heart" size={22} color="#EF4444" />
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
