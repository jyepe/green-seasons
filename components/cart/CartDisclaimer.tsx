// components/cart/CartDisclaimer.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

export function CartDisclaimer() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons
        name="information-circle-outline"
        size={14}
        color={colors.textSecondary}
        importantForAccessibility="no-hide-descendants"
      />
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        This total does not reflect the final price. The final price will be
        determined when item prices are set on the scheduled delivery day.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 16,
  },
  text: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
