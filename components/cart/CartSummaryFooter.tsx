// components/cart/CartSummaryFooter.tsx
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  total: number;
  animatedTotalStyle: AnimatedStyle<TextStyle>;
  onCheckout: () => void;
};

export function CartSummaryFooter({
  total,
  animatedTotalStyle,
  onCheckout,
}: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  // On iOS the tab bar is position:'absolute' and overlays the screen — we pad
  // the footer's bottom to push content above it. On Android the screen is
  // already bounded above the tab bar, so only the safe-area inset matters.
  const extraBottomPadding =
    Platform.OS === 'ios' ? tabBarHeight : insets.bottom;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      <BlurView
        intensity={80}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[styles.content, { paddingBottom: 14 + extraBottomPadding }]}
      >
        <View style={styles.totalBlock}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Estimated total
          </Text>
          <Animated.Text
            style={[
              styles.totalValue,
              { color: colors.text },
              animatedTotalStyle,
            ]}
          >
            ${total.toFixed(2)}
          </Animated.Text>
        </View>

        <Pressable
          onPress={onCheckout}
          accessibilityRole="button"
          accessibilityLabel="Proceed to checkout"
          accessibilityHint="Reviews your order and payment details"
          style={({ pressed }) => [
            styles.checkoutBtn,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.checkoutText}>Checkout</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  totalBlock: {
    gap: 2,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '400',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.22,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
