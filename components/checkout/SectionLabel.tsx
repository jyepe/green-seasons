// components/checkout/SectionLabel.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';

type Props = {
  colors: (typeof Colors)['light'];
  children: string;
  action?: string;
  onAction?: () => void;
};

export function SectionLabel({ colors, children, action, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text
        style={[styles.title, { color: colors.text }]}
        accessibilityRole="header"
      >
        {children}
      </Text>
      {action && (
        <TouchableOpacity
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={action}
        >
          <Text style={[styles.action, { color: colors.primary }]}>
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.075,
  },
  action: {
    fontSize: 12,
    fontWeight: '600',
  },
});
