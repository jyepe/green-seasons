import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCart, useClearCart, useAddToCart } from '@/hooks/useCart';
import { useItems } from '@/hooks/useItems';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CartItem } from '@/lib/supabase';

export default function CartScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: cartItems, isLoading, error } = useCart();
  const { data: items } = useItems();
  const { data: userInfo } = useUserInfo();
  const { data: restaurant } = useRestaurant(userInfo?.owned_restaurant_id);
  const clearCartMutation = useClearCart();
  const addToCartMutation = useAddToCart();
  const [isClearing, setIsClearing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{
    item_id: string;
    item_name: string;
    quantity: number;
    item_price: number;
  } | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  // Animation for total
  const totalScale = useSharedValue(1);
  const totalOpacity = useSharedValue(1);
  const prevTotalRef = useRef(0);

  // Create a lookup map for item images
  const itemImageMap = useMemo(() => {
    if (!items) return new Map<string, string | null>();
    const map = new Map<string, string | null>();
    items.forEach(item => {
      map.set(item.id, item.image_url);
    });
    return map;
  }, [items]);

  const total =
    cartItems?.reduce((sum, item) => sum + item.line_subtotal, 0) || 0;

  // Animate total when it changes
  useEffect(() => {
    if (prevTotalRef.current !== total && prevTotalRef.current > 0) {
      totalScale.value = withSpring(1.1, { damping: 10 }, () => {
        totalScale.value = withSpring(1, { damping: 10 });
      });
      totalOpacity.value = withTiming(0.5, { duration: 100 }, () => {
        totalOpacity.value = withTiming(1, { duration: 200 });
      });
    }
    prevTotalRef.current = total;
  }, [total, totalScale, totalOpacity]);

  const animatedTotalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: totalScale.value }],
    opacity: totalOpacity.value,
  }));

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearCartMutation.mutateAsync();
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Failed to clear cart. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    if (updatingItemId) {
      return;
    }
    setUpdatingItemId(itemId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCartMutation
      .mutateAsync({ itemId, quantityDelta: delta })
      .catch(error => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unable to update quantity. Please try again.';
        Alert.alert('Error', errorMessage);
      })
      .finally(() => {
        setUpdatingItemId(null);
      });
  };

  const handleDeleteItem = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Set quantity to negative of current quantity to remove item
    const item = cartItems?.find(i => i.item_id === itemId);
    if (item) {
      handleQuantityChange(itemId, -item.quantity);
    }
  };

  const handleItemPress = (item: {
    item_id: string;
    item_name: string;
    quantity: number;
    item_price: number;
  }) => {
    setEditingItem(item);
    setEditQuantity(item.quantity.toString());
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const newQuantity = parseInt(editQuantity, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      Alert.alert(
        'Invalid Quantity',
        'Please enter a valid quantity (1 or more)'
      );
      return;
    }
    const delta = newQuantity - editingItem.quantity;
    if (delta !== 0) {
      // Capture the item_id at the start of the mutation to prevent race conditions
      const mutationItemId = editingItem.item_id;
      setUpdatingItemId(mutationItemId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addToCartMutation
        .mutateAsync({ itemId: mutationItemId, quantityDelta: delta })
        .catch(error => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Unable to update quantity. Please try again.';
          Alert.alert('Error', errorMessage);
        })
        .finally(() => {
          setUpdatingItemId(null);
          // Only close modal if still editing the same item that initiated the mutation
          setEditingItem(prev => {
            if (prev && prev.item_id === mutationItemId) {
              return null;
            }
            return prev;
          });
        });
    } else {
      setEditingItem(null);
    }
  };

  const handleCheckout = () => {
    Alert.alert(
      'Checkout',
      'Checkout is not available yet. Stay tuned for updates!'
    );
  };

  // Swipeable row component
  const SwipeableRow = ({ item, index }: { item: CartItem; index: number }) => {
    const translateX = useSharedValue(0);

    const panGesture = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onUpdate(e => {
        const deltaX = e.translationX;
        // Allow smooth movement in both directions
        if (deltaX < 0) {
          // Swiping left (reveal delete)
          translateX.value = Math.max(deltaX, -90);
        } else if (deltaX > 0 && translateX.value < 0) {
          // Swiping right (hide delete) - only if delete is currently visible
          translateX.value = Math.min(deltaX, 0);
        }
      })
      .onEnd(e => {
        const velocity = e.velocityX;
        const currentTranslate = translateX.value;

        // If swiping right with velocity, or already close to 0, snap to 0
        if (velocity > 500 || currentTranslate > -20) {
          translateX.value = withSpring(0, {
            damping: 15,
            stiffness: 200,
          });
        } else if (currentTranslate < -45) {
          // Swipe left enough to reveal delete
          translateX.value = withSpring(-90, {
            damping: 15,
            stiffness: 200,
          });
        } else {
          // Not enough movement, snap back
          translateX.value = withSpring(0, {
            damping: 15,
            stiffness: 200,
          });
        }
      });

    const animatedRowStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    const animatedDeleteStyle = useAnimatedStyle(() => ({
      opacity: translateX.value < -20 ? 1 : 0,
      transform: [{ translateX: translateX.value + 90 }],
    }));

    return (
      <View>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={animatedRowStyle}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                handleItemPress({
                  item_id: item.item_id,
                  item_name: item.item_name,
                  quantity: item.quantity,
                  item_price: item.item_price,
                })
              }
            >
              <View style={styles.cartItem}>
                {/* Thumbnail */}
                <View
                  style={[
                    styles.thumbnailContainer,
                    { backgroundColor: colors.border },
                  ]}
                >
                  {itemImageMap.get(item.item_id) ? (
                    <Image
                      source={{
                        uri: itemImageMap.get(item.item_id) as string,
                      }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name="image-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                  )}
                </View>
                <View style={styles.cartItemLeft}>
                  <View style={styles.cartItemInfo}>
                    <Text style={[styles.cartItemName, { color: colors.text }]}>
                      {item.item_name}
                    </Text>
                    <Text
                      style={[
                        styles.cartItemUnitPrice,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ${item.item_price.toFixed(2)} each
                    </Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={[
                        styles.stepperButton,
                        { borderColor: colors.border },
                        (item.quantity <= 1 ||
                          updatingItemId === item.item_id) &&
                          styles.stepperButtonDisabled,
                      ]}
                      onPress={() => handleQuantityChange(item.item_id, -1)}
                      disabled={
                        item.quantity <= 1 || updatingItemId === item.item_id
                      }
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.quantityValueContainer}>
                      {updatingItemId === item.item_id ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : (
                        <Text
                          style={[styles.quantityValue, { color: colors.text }]}
                        >
                          {item.quantity}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.stepperButton,
                        { borderColor: colors.border },
                        updatingItemId === item.item_id &&
                          styles.stepperButtonDisabled,
                      ]}
                      onPress={() => handleQuantityChange(item.item_id, 1)}
                      disabled={updatingItemId === item.item_id}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.cartItemSubtotal, { color: colors.text }]}>
                  ${item.line_subtotal.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
        <Animated.View
          style={[
            styles.deleteAction,
            { backgroundColor: colors.error },
            animatedDeleteStyle,
          ]}
        >
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              translateX.value = withSpring(0);
              handleDeleteItem(item.item_id);
            }}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
        {cartItems && index < cartItems.length - 1 && (
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Cart{restaurant ? ` • ${restaurant.name}` : ''}
              </Text>
              {cartItems && cartItems.length > 0 && (
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </Text>
              )}
            </View>
            {cartItems && cartItems.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCart}
                disabled={isClearing || clearCartMutation.isPending}
              >
                {isClearing || clearCartMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <>
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.error}
                    />
                    <Text
                      style={[styles.clearButtonText, { color: colors.error }]}
                    >
                      Clear
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading cart...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={colors.error}
              style={styles.errorIcon}
            />
            <Text style={[styles.errorText, { color: colors.text }]}>
              Failed to load cart. Please try again.
            </Text>
          </View>
        ) : !cartItems || cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="cart-outline"
              size={80}
              color={colors.textTertiary}
              style={styles.icon}
            />
            <Text style={[styles.title, { color: colors.text }]}>
              Your cart is empty
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Start adding products to your cart to get started
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.cartContainer}
              contentContainerStyle={styles.cartContent}
            >
              {cartItems.map((item, index) => (
                <SwipeableRow
                  key={item.item_row_id}
                  item={item}
                  index={index}
                />
              ))}
            </ScrollView>

            {/* Total Footer */}
            <View style={styles.footerSpacer} />
            <View
              style={[
                styles.checkoutBar,
                {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={styles.totalRow}>
                <View>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    Total
                  </Text>
                  <Animated.Text
                    style={[
                      styles.totalAmount,
                      { color: colors.primary },
                      animatedTotalStyle,
                    ]}
                  >
                    ${total.toFixed(2)}
                  </Animated.Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutButtonText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Edit Item Modal */}
        <Modal
          visible={editingItem !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingItem(null)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Edit Quantity
                </Text>
                <TouchableOpacity
                  onPress={() => setEditingItem(null)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {editingItem && (
                <>
                  <Text style={[styles.modalItemName, { color: colors.text }]}>
                    {editingItem.item_name}
                  </Text>
                  <Text
                    style={[
                      styles.modalItemPrice,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ${editingItem.item_price.toFixed(2)} each
                  </Text>
                  <View style={styles.modalQuantityContainer}>
                    <Text style={[styles.modalLabel, { color: colors.text }]}>
                      Quantity
                    </Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      value={editQuantity}
                      onChangeText={setEditQuantity}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      autoFocus
                    />
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.modalButtonCancel,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => setEditingItem(null)}
                    >
                      <Text
                        style={[styles.modalButtonText, { color: colors.text }]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.modalButtonSave,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={handleSaveEdit}
                      disabled={updatingItemId === editingItem.item_id}
                    >
                      {updatingItemId === editingItem.item_id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.modalButtonTextSave}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  cartContainer: {
    flex: 1,
  },
  cartContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 160,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  thumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  cartItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 16,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cartItemUnitPrice: {
    fontSize: 13,
    fontWeight: '400',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  quantityValueContainer: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  cartItemSubtotal: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginRight: 12,
  },
  separator: {
    height: 1,
    marginLeft: 0,
  },
  footerSpacer: {
    height: 8,
  },
  checkoutBar: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  checkoutButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalItemName: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalItemPrice: {
    fontSize: 14,
    marginTop: -8,
  },
  modalQuantityContainer: {
    marginTop: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonSave: {
    // backgroundColor set inline
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
