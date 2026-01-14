import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

  return (
    <View style={[styles.productCard, { backgroundColor: colors.surface }]}>
      <View style={styles.productImageContainer}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <Ionicons
            name="image-outline"
            size={48}
            color={colors.textSecondary}
          />
        )}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => onToggleFavorite(item.id, item.is_favorite)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={
            item.is_favorite
              ? `Remove ${item.name} from favorites`
              : `Add ${item.name} to favorites`
          }
          accessibilityRole="button"
          accessibilityState={{ selected: item.is_favorite }}
        >
          <Ionicons
            name={item.is_favorite ? 'heart' : 'heart-outline'}
            size={22}
            color={item.is_favorite ? '#EF4444' : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]}>
          {item.name}
        </Text>
        {item.description && (
          <Text
            style={[styles.productDescription, { color: colors.textSecondary }]}
          >
            {item.description}
          </Text>
        )}
        <View style={styles.productPriceContainer}>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            ${item.price.toFixed(2)}
          </Text>
          <Text style={[styles.productUnit, { color: colors.textSecondary }]}>
            {item.unit}
          </Text>
        </View>

        {/* Cart Badge */}
        {quantityInCart > 0 && (
          <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={12} color="white" />
            <Text style={styles.cartBadgeText}>{quantityInCart} in cart</Text>
          </View>
        )}

        {/* Add to Cart Button or Stepper */}
        {!isStepperMode ? (
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              {
                backgroundColor: colors.primary,
              },
              isPending && styles.addButtonDisabled,
            ]}
            onPress={() => onAddToCart(item.id)}
            disabled={isPending}
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name} to cart`}
            accessibilityState={{ disabled: isPending, busy: isPending }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="cart" size={18} color="white" />
                <Text style={styles.addToCartButtonText}>Add to Cart</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View
            style={[styles.stepperContainer, { borderColor: colors.border }]}
          >
            <TouchableOpacity
              style={[
                styles.stepperButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRightWidth: 1,
                },
                isPending && styles.stepperButtonDisabled,
              ]}
              onPress={() => onUpdateQuantity(item.id, -1)}
              disabled={isPending}
              accessibilityRole="button"
              accessibilityLabel={`Decrease quantity of ${item.name}`}
              accessibilityState={{
                disabled: isPending || stepperQuantity <= 0,
              }}
            >
              <Ionicons name="remove" size={18} color={colors.text} />
            </TouchableOpacity>
            <View
              style={[
                styles.stepperQuantity,
                { backgroundColor: colors.surface },
              ]}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text
                  style={[styles.stepperQuantityText, { color: colors.text }]}
                >
                  {stepperQuantity}
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
                isPending && styles.stepperButtonDisabled,
              ]}
              onPress={() => onUpdateQuantity(item.id, 1)}
              disabled={isPending}
              accessibilityRole="button"
              accessibilityLabel={`Increase quantity of ${item.name}`}
              accessibilityState={{ disabled: isPending }}
            >
              <Ionicons name="add" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
