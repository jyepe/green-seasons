// components/cart/CartHeader.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  productCount: number;
  unitCount: number;
  restaurantName?: string;
};

export function CartHeader({ productCount, unitCount, restaurantName }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const productLabel = productCount === 1 ? 'product' : 'products';
  const subtitleParts = [
    `${productCount} ${productLabel}`,
    `${unitCount} units`,
  ];
  if (restaurantName) subtitleParts.push(restaurantName);
  const subtitle = subtitleParts.join(' · ');

  const a11yLabel = restaurantName
    ? `Cart, ${productCount} ${productLabel}, ${unitCount} units, ${restaurantName}`
    : `Cart, ${productCount} ${productLabel}, ${unitCount} units`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text
        accessibilityRole="header"
        accessibilityLabel={a11yLabel}
        style={[styles.title, { color: colors.text }]}
      >
        Cart
      </Text>
      <Text
        style={[styles.subtitle, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.26,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '400',
  },
});
