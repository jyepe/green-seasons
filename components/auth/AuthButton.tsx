import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function AuthButton({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
}: AuthButtonProps) {
  const buttonScale = useSharedValue(1);
  const colors = Colors.light;

  const handlePress = () => {
    if (disabled || isLoading) return;
    
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });
    
    onPress();
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const getBackgroundColor = () => {
    if (disabled) return colors.textTertiary;
    if (variant === 'primary') return colors.primary;
    if (variant === 'secondary') return colors.accent;
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'outline') return colors.primary;
    return 'white';
  };

  return (
    <Animated.View style={[buttonAnimatedStyle, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: variant === 'outline' ? colors.primary : 'transparent',
            borderWidth: variant === 'outline' ? 1 : 0,
            opacity: isLoading ? 0.8 : 1,
          },
        ]}
        onPress={handlePress}
        disabled={disabled || isLoading}
        activeOpacity={0.9}
      >
        {isLoading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52, // Standard height
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2, // Slightly reduced shadow
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
