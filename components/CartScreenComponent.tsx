import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useCart, useClearCart, useAddToCart } from '@/hooks/useCart';
import { useItems } from '@/hooks/useItems';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAdmin } from '@/hooks/useAdmin';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useReducer } from 'react';
import { Alert, StyleSheet, AccessibilityInfo } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { CartItem } from '@/lib/supabase';
import { CartHeader } from '@/components/CartHeader';
import { CartList } from '@/components/CartList';
import { CartFooter } from '@/components/CartFooter';
import { EditQuantityModal, EditingItem } from '@/components/EditQuantityModal';
import { cartReducer, initialCartState } from '@/reducers/cartReducer';

export default function CartScreenComponent() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { data: cartItems, isLoading, error } = useCart();
  const { data: items } = useItems();
  const { data: userInfo } = useUserInfo();
  const { data: isUserAdmin } = useAdmin();
  const { data: restaurant } = useRestaurant(userInfo?.owned_restaurant_id);
  const clearCartMutation = useClearCart();
  const addToCartMutation = useAddToCart();

  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const { isClearing, updatingItemId, editingItem, editQuantity } = state;

  const totalScale = useSharedValue(1);
  const totalOpacity = useSharedValue(1);
  const prevTotalRef = useRef(0);

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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            dispatch({ type: 'START_CLEARING' });
            try {
              await clearCartMutation.mutateAsync();
              AccessibilityInfo.announceForAccessibility('Cart cleared');
            } catch (e) {
              const errorMessage =
                e instanceof Error
                  ? e.message
                  : 'Failed to clear cart. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              dispatch({ type: 'FINISH_CLEARING' });
            }
          },
        },
      ]
    );
  };

  const handleUpdateCartItem = async (
    itemId: string,
    quantityDelta: number
  ) => {
    if (updatingItemId) return;

    dispatch({ type: 'START_UPDATING_ITEM', payload: itemId });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await addToCartMutation.mutateAsync({ itemId, quantityDelta });
    } catch (e) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : 'Unable to update quantity. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      dispatch({ type: 'FINISH_UPDATING_ITEM' });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const item = cartItems?.find(i => i.item_id === itemId);
    if (item) {
      handleUpdateCartItem(itemId, -item.quantity);
      AccessibilityInfo.announceForAccessibility('Item removed from cart');
    }
  };

  const handleItemPress = (item: CartItem) => {
    const editing: EditingItem = {
      item_id: item.item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      item_price: item.item_price,
    };
    dispatch({ type: 'START_EDITING_ITEM', payload: editing });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    const newQuantity = parseInt(editQuantity, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      Alert.alert(
        'Invalid Quantity',
        'Please enter a valid quantity (1 or more).'
      );
      return;
    }

    const delta = newQuantity - editingItem.quantity;
    if (delta !== 0) {
      handleUpdateCartItem(editingItem.item_id, delta);
      AccessibilityInfo.announceForAccessibility(
        `Quantity updated to ${newQuantity}`
      );
    }
    dispatch({ type: 'CLOSE_EDIT_MODAL' });
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLabel="Shopping Cart Screen"
      >
        <CartHeader
          restaurantName={isUserAdmin ? undefined : restaurant?.name}
          itemCount={cartItems?.length || 0}
          onClearCart={handleClearCart}
          isClearing={isClearing || clearCartMutation.isPending}
        />

        <CartList
          cartItems={cartItems || []}
          isLoading={isLoading}
          error={error}
          updatingItemId={updatingItemId}
          itemImageMap={itemImageMap}
          onQuantityChange={handleUpdateCartItem}
          onDeleteItem={handleDeleteItem}
          onItemPress={handleItemPress}
        />

        {cartItems && cartItems.length > 0 && (
          <CartFooter
            total={total}
            animatedTotalStyle={animatedTotalStyle}
            onCheckout={handleCheckout}
          />
        )}

        <EditQuantityModal
          editingItem={editingItem}
          editQuantity={editQuantity}
          updatingItemId={updatingItemId}
          onClose={() => dispatch({ type: 'CLOSE_EDIT_MODAL' })}
          onSave={handleSaveEdit}
          setEditQuantity={q =>
            dispatch({ type: 'SET_EDIT_QUANTITY', payload: q })
          }
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
