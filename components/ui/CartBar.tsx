import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type CartBarProps = {
  itemCount: number;
  totalCents: number;
  onPress: () => void;
  bottomOffset?: number;
};

const formatCents = (cents: number) =>
  `$${(Math.max(0, cents) / 100).toFixed(2)}`;

/**
 * Sticky floating cart preview. Must be mounted inside a screen of a
 * BottomTabNavigator (Expo Router `(tabs)`), because it calls
 * `useBottomTabBarHeight()` to anchor itself above the tab bar. If you
 * need this outside tabs, pass an explicit `bottomOffset`.
 */
export function CartBar({
  itemCount,
  totalCents,
  onPress,
  bottomOffset,
}: CartBarProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const tabBarHeight = useBottomTabBarHeight();
  const computedBottom = bottomOffset ?? tabBarHeight + 12;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  const [visible, setVisible] = useState(itemCount > 0);

  useEffect(() => {
    if (itemCount > 0) {
      setVisible(true);
      opacity.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, { damping: 18 });
      return;
    }
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(40, { duration: 180 });
    const t = setTimeout(() => setVisible(false), 200);
    return () => clearTimeout(t);
  }, [itemCount, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const itemWord = itemCount === 1 ? 'item' : 'items';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, animatedStyle, { bottom: computedBottom }]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.bar,
          {
            backgroundColor: colors.primaryDark,
            shadowColor: colors.primaryDark,
          },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View cart with ${itemCount} ${itemWord}, total ${formatCents(totalCents)}`}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="cart" size={20} color="white" />
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.total}>{formatCents(totalCents)}</Text>
          <Text style={styles.subtitle}>
            {itemCount} {itemWord}
          </Text>
        </View>
        <Text style={styles.cta}>View cart →</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    // Badge always renders on amber accent; #111 ensures AA contrast in
    // both light and dark themes. Do not theme-token this color.
    color: '#111',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  textCol: { flex: 1 },
  total: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  cta: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
