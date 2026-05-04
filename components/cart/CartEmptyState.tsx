// components/cart/CartEmptyState.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = { onBrowse: () => void };

export function CartEmptyState({ onBrowse }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${colors.primary}24` /* ~14% alpha */ },
        ]}
      >
        <Ionicons name="basket-outline" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        Your cart is empty
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Browse this week&apos;s harvest and start filling up your kitchen.
      </Text>
      <Pressable
        onPress={onBrowse}
        accessibilityRole="button"
        accessibilityLabel="Browse produce"
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.ctaText}>Browse produce</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  cta: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.33,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
