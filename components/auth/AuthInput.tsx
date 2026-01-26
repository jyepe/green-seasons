import React, { forwardRef, useState } from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: StyleProp<ViewStyle>;
  helperText?: string;
}

const AuthInput = forwardRef<TextInput, AuthInputProps>(
  (
    {
      label,
      error,
      icon,
      containerStyle,
      secureTextEntry,
      onFocus,
      onBlur,
      helperText,
      ...props
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const inputFocus = useSharedValue(0);
    const colors = Colors.light; // Using light theme for auth screens as they have fixed white/light backgrounds

    const handleFocus = (e: any) => {
      inputFocus.value = withTiming(1, { duration: 200 });
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      inputFocus.value = withTiming(0, { duration: 200 });
      onBlur?.(e);
    };

    const inputAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: interpolate(inputFocus.value, [0, 1], [1, 1.02]),
        },
      ],
    }));

    const isPassword = !!secureTextEntry;
    const showPassword = isPassword && isPasswordVisible;

    return (
      <Animated.View
        style={[styles.container, inputAnimatedStyle, containerStyle]}
      >
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.inputBackground,
              borderColor: error ? colors.error : colors.border,
            },
          ]}
        >
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={colors.textTertiary}
              style={styles.leftIcon}
            />
          )}

          <TextInput
            ref={ref}
            style={[
              styles.inputField,
              { color: colors.text },
              // If no icon, add left padding to look balanced
              !icon && styles.noIconInput,
            ]}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={isPassword && !isPasswordVisible}
            onFocus={handleFocus}
            onBlur={handleBlur}
            accessibilityLabel={label}
            {...props}
          />

          {isPassword && (
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              accessibilityLabel={
                showPassword ? 'Hide password' : 'Show password'
              }
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {error ? (
          <Text
            style={[styles.errorText, { color: colors.error }]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {error}
          </Text>
        ) : helperText ? (
          <Text style={[styles.helperText, { color: colors.textTertiary }]}>
            {helperText}
          </Text>
        ) : null}
      </Animated.View>
    );
  }
);

AuthInput.displayName = 'AuthInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: 0, // Controlled by parent
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  inputRow: {
    height: 52, // Standard height from Login screen
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  noIconInput: {
    paddingHorizontal: 4,
  },
  leftIcon: {
    marginRight: 10,
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Inter_400Regular',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Inter_400Regular',
  },
});

export default AuthInput;
