// components/profile/ProfileAvatar.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  initials: string;
  size?: number;
};

export function ProfileAvatar({ initials, size = 76 }: Props) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  // Light: forest green → mid-green tint. Dark: mid-green → mint-soft for visible contrast.
  const gradientEnd =
    colorScheme === 'dark' ? colors.mintSoft : colors.primaryTint;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.27,
        shadowRadius: 16,
        elevation: 6,
      }}
      accessibilityRole="image"
      accessibilityLabel={`Avatar with initials ${initials}`}
    >
      <LinearGradient
        colors={[colors.primary, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: size / 2 }]}
      >
        <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
});
