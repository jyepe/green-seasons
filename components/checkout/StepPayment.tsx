// components/checkout/StepPayment.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SectionLabel } from './SectionLabel';

type Props = {
  colors: (typeof Colors)['light'];
};

export function StepPayment({ colors }: Props) {
  return (
    <View>
      <SectionLabel colors={colors}>Pay with</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.tile, { backgroundColor: colors.primary + '1F' }]}
          >
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.body}>
            <Text style={[styles.title, { color: colors.text }]}>
              Cash on delivery
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Pay your driver in cash when your order arrives. More payment
              options coming soon.
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  tile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
});
