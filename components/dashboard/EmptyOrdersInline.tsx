import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  onBrowseProduce: () => void;
};

export function EmptyOrdersInline({ onBrowseProduce }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.wrapper}>
      <Ionicons name="leaf-outline" size={36} color={colors.textTertiary} />
      <Text style={[styles.title, { color: colors.text }]}>No orders yet</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Place your first order to see it here
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onBrowseProduce}
        accessibilityRole="button"
        accessibilityLabel="Browse produce"
        activeOpacity={0.85}
      >
        <Text style={styles.buttonLabel}>Browse produce</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  button: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  buttonLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
