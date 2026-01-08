import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCart, useClearCart, useAddToCart } from '@/hooks/useCart';
import { useItems } from '@/hooks/useItems';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAdmin } from '@/hooks/useAdmin';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
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

export default function CartScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: cartItems, isLoading, error } = useCart();
  const { data: items } = useItems();
  const { data: userInfo } = useUserInfo();
  const { data: isUserAdmin } = useAdmin();
  const { data: restaurant } = useRestaurant(userInfo?.owned_restaurant_id);
  const clearCartMutation = useClearCart();
  const addToCartMutation = useAddToCart();

  const [isClearing, setIsClearing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

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
            setIsClearing(true);
            try {
              await clearCartMutation.mutateAsync();
            } catch (e) {
              const errorMessage =
                e instanceof Error
                  ? e.message
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

  const handleUpdateCartItem = async (
    itemId: string,
    quantityDelta: number
  ) => {
    if (updatingItemId) return;

    setUpdatingItemId(itemId);
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
      setUpdatingItemId(null);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const item = cartItems?.find(i => i.item_id === itemId);
    if (item) {
      handleUpdateCartItem(itemId, -item.quantity);
    }
  };

  const handleItemPress = (item: CartItem) => {
    const editing: EditingItem = {
      item_id: item.item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      item_price: item.item_price,
    };
    setEditingItem(editing);
    setEditQuantity(editing.quantity.toString());
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
    }
    setEditingItem(null);
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
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
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
          setEditQuantity={setEditQuantity}
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
