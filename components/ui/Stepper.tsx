import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type StepperProps = {
  qty: number;
  onInc: () => void;
  onDec: () => void;
  disabled?: boolean;
  busy?: boolean;
  decLabel?: string;
  incLabel?: string;
};

export function Stepper({
  qty,
  onInc,
  onDec,
  disabled = false,
  busy = false,
  decLabel = 'Decrease quantity',
  incLabel = 'Increase quantity',
}: StepperProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const isInert = disabled || busy;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.primary, shadowColor: colors.primary },
      ]}
    >
      <Pressable
        onPress={onDec}
        disabled={isInert}
        style={({ pressed }) => [
          styles.button,
          isInert ? styles.disabled : pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={decLabel}
        accessibilityState={{ disabled: isInert }}
      >
        <Ionicons name="remove" size={18} color="white" />
      </Pressable>
      <View
        style={styles.qtyContainer}
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={busy ? 'Updating quantity' : `Quantity: ${qty}`}
      >
        {busy ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.qty}>{qty}</Text>
        )}
      </View>
      <Pressable
        onPress={onInc}
        disabled={isInert}
        style={({ pressed }) => [
          styles.button,
          isInert ? styles.disabled : pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={incLabel}
        accessibilityState={{ disabled: isInert }}
      >
        <Ionicons name="add" size={18} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  qtyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
  },
  qty: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});
