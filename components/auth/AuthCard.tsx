import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface AuthCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function AuthCard({ children, style }: AuthCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});
