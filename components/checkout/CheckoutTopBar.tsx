import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type Props = {
  colors: (typeof Colors)['light'];
  step: 0 | 1 | 2 | 3;
  onBack: () => void;
};

const TITLES = ['Delivery', 'Payment', 'Review', 'Confirmed'] as const;

export function CheckoutTopBar({ colors, step, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const showBack = step < 3;

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      {showBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.backButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text
        style={[styles.title, { color: colors.text }]}
        accessibilityRole="header"
      >
        {TITLES[step]}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.075,
  },
});
