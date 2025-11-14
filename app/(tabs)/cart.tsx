import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCart, useClearCart } from '@/hooks/useCart';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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

export default function CartScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: cartItems, isLoading, error } = useCart();
  const clearCartMutation = useClearCart();
  const [isClearing, setIsClearing] = useState(false);

  const total =
    cartItems?.reduce((sum, item) => sum + item.line_subtotal, 0) || 0;

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

  return (
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
              Cart
            </Text>
            {cartItems && cartItems.length > 0 && (
              <Text
                style={[styles.headerSubtitle, { color: colors.textSecondary }]}
              >
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </Text>
            )}
          </View>
          {cartItems && cartItems.length > 0 && (
            <TouchableOpacity
              style={[
                styles.clearButton,
                {
                  backgroundColor: colors.error,
                },
                (isClearing || clearCartMutation.isPending) &&
                  styles.clearButtonDisabled,
              ]}
              onPress={handleClearCart}
              disabled={isClearing || clearCartMutation.isPending}
            >
              {isClearing || clearCartMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={16} color="white" />
                  <Text style={styles.clearButtonText}>Clear</Text>
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
            {cartItems.map(item => (
              <View
                key={item.item_row_id}
                style={[
                  styles.cartItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cartItemContent}>
                  <View style={styles.cartItemInfo}>
                    <Text style={[styles.cartItemName, { color: colors.text }]}>
                      {item.item_name}
                    </Text>
                    <View style={styles.cartItemDetails}>
                      <Text
                        style={[
                          styles.cartItemPrice,
                          { color: colors.textSecondary },
                        ]}
                      >
                        ${item.item_price.toFixed(2)} each
                      </Text>
                      <Text
                        style={[
                          styles.cartItemQuantity,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Qty: {item.quantity}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.cartItemSubtotal, { color: colors.text }]}
                  >
                    ${item.line_subtotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Total Footer */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Total:
              </Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonDisabled: {
    opacity: 0.6,
  },
  clearButtonText: {
    color: 'white',
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
    padding: 16,
    gap: 12,
  },
  cartItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cartItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cartItemDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  cartItemPrice: {
    fontSize: 14,
  },
  cartItemQuantity: {
    fontSize: 14,
  },
  cartItemSubtotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
});
