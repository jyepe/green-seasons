import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface PasswordRequirementsProps {
  style?: StyleProp<ViewStyle>;
}

export default function PasswordRequirements({
  style,
}: PasswordRequirementsProps) {
  const colors = Colors.light;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.inputBackground },
        style,
      ]}
    >
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        Password must be at least 8 characters and contain:
      </Text>
      {['One uppercase letter', 'One lowercase letter', 'One number'].map(
        (requirement, index) => (
          <Text
            key={index}
            style={[styles.text, { color: colors.textSecondary }]}
          >
            {`• ${requirement}`}
          </Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
