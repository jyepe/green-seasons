import { Stepper } from '@/components/ui/Stepper';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import ProductTile from './ProductTile';

export type ProductItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  image_url: string | null;
  is_favorite: boolean;
};

interface ProductCardProps {
  item: ProductItem;
  quantityInCart: number;
  stepperQuantity: number;
  isStepperMode: boolean;
  isPending: boolean;
  onToggleFavorite: (itemId: string, currentlyFavorite: boolean) => void;
  onAddToCart: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
}

export function ProductCard({
  item,
  quantityInCart,
  stepperQuantity,
  isStepperMode,
  isPending,
  onToggleFavorite,
  onAddToCart,
  onUpdateQuantity,
}: ProductCardProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const bumpY = useSharedValue(0);
  const prevQty = useRef(quantityInCart);
  useEffect(() => {
    if (quantityInCart > prevQty.current) {
      bumpY.value = withSequence(
        withTiming(-2, { duration: 110 }),
        withTiming(0, { duration: 110 })
      );
    }
    prevQty.current = quantityInCart;
  }, [quantityInCart, bumpY]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bumpY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.surface, shadowColor: '#000' },
        cardAnimStyle,
      ]}
    >
      <View style={styles.tileWrap}>
        <ProductTile imageUrl={item.image_url} fallbackSeed={item.name} />
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => onToggleFavorite(item.id, item.is_favorite)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityState={{ selected: item.is_favorite }}
          accessibilityLabel={
            item.is_favorite
              ? `Remove ${item.name} from favorites`
              : `Add ${item.name} to favorites`
          }
        >
          <Ionicons
            name={item.is_favorite ? 'heart' : 'heart-outline'}
            size={18}
            color={item.is_favorite ? '#EF4444' : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.text }]}>
            ${item.price.toFixed(2)}
          </Text>
          <Text style={[styles.unit, { color: colors.textSecondary }]}>
            {' '}
            / {item.unit}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {isStepperMode ? (
            <Stepper
              qty={stepperQuantity}
              busy={isPending}
              onInc={() => onUpdateQuantity(item.id, 1)}
              onDec={() => onUpdateQuantity(item.id, -1)}
              decLabel={`Decrease quantity of ${item.name}`}
              incLabel={`Increase quantity of ${item.name}`}
            />
          ) : (
            <Pressable
              onPress={() => onAddToCart(item.id)}
              disabled={isPending}
              style={({ pressed }) => [
                styles.addBtn,
                {
                  borderColor: colors.primary,
                  backgroundColor: pressed ? colors.primary : 'transparent',
                },
                isPending && styles.addBtnDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name} to cart`}
              accessibilityState={{ disabled: isPending, busy: isPending }}
            >
              {({ pressed }) =>
                isPending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.addBtnText,
                      { color: pressed ? 'white' : colors.primary },
                    ]}
                  >
                    + Add
                  </Text>
                )
              }
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  tileWrap: {
    position: 'relative',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  body: {
    padding: 12,
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  unit: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  actionRow: {
    marginTop: 4,
  },
  addBtn: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  addBtnDisabled: {
    opacity: 0.6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});
