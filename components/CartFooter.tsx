import {
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type CartFooterProps = {
  total: number;
  animatedTotalStyle: AnimatedStyle<TextStyle>;
  onCheckout: () => void;
};

export function CartFooter({
  total,
  animatedTotalStyle,
  onCheckout,
}: CartFooterProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <>
      <View style={styles.footerSpacer} />
      <View
        style={[
          styles.checkoutBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'ios' ? 16 + tabBarHeight : 16,
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
        <View
          style={[
            styles.disclaimerContainer,
            { borderColor: colors.textTertiary },
          ]}
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text
            style={[styles.disclaimerText, { color: colors.textSecondary }]}
          >
            This total does not reflect the final price. The final price will be
            determined when item prices are set on the scheduled delivery day.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
          onPress={onCheckout}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Proceed to checkout"
          accessibilityHint="Reviews your order and payment details"
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
