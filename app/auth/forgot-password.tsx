import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { changePassword } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const buttonScale = useSharedValue(1);
  const inputFocus = useSharedValue(0);

  const validatePassword = (pwd: string): string | null => {
    if (!pwd) {
      return 'Password is required';
    }
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleChangePassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      await changePassword({ password });
      Alert.alert('Success', 'Your password has been changed successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/auth/login'),
        },
      ]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to change password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(inputFocus.value, [0, 1], [1, 1.02]),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Background with radial gradients */}
      <Svg
        width={width}
        height={height}
        style={styles.svgBackground}
        pointerEvents="none"
      >
        <Defs>
          {/* Top-left gradient */}
          <RadialGradient
            id="gradient1"
            cx="0"
            cy="0"
            r={Math.max(width, height) * 0.55}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#7FD8B5" stopOpacity="0.7" />
            <Stop offset="25%" stopColor="#7FD8B5" stopOpacity="0.45" />
            <Stop offset="45%" stopColor="#7FD8B5" stopOpacity="0.25" />
            <Stop offset="60%" stopColor="#7FD8B5" stopOpacity="0.1" />
            <Stop offset="75%" stopColor="#7FD8B5" stopOpacity="0" />
          </RadialGradient>
          {/* Bottom-right gradient */}
          <RadialGradient
            id="gradient2"
            cx={width}
            cy={height}
            r={Math.max(width, height) * 0.55}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#FFBE88" stopOpacity="0.7" />
            <Stop offset="25%" stopColor="#FFBE88" stopOpacity="0.45" />
            <Stop offset="45%" stopColor="#FFBE88" stopOpacity="0.25" />
            <Stop offset="60%" stopColor="#FFBE88" stopOpacity="0.1" />
            <Stop offset="75%" stopColor="#FFBE88" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="#F9F9F9" />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="url(#gradient1)"
        />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="url(#gradient2)"
        />
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/cl.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>
                <Text style={styles.titleGreen}>Reset</Text>{' '}
                <Text style={styles.titleOrange}>Password</Text>
              </Text>
              <Text style={styles.subtitle}>
                Enter your email and new password to reset your account
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <View style={styles.form}>
                <Animated.View style={inputAnimatedStyle}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputRow}>
                    <Ionicons
                      name="mail"
                      size={18}
                      color="#9E9E9E"
                      style={styles.leftIcon}
                    />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Enter your email"
                      placeholderTextColor="#9E9E9E"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      onFocus={() => {
                        inputFocus.value = withTiming(1, { duration: 200 });
                      }}
                      onBlur={() => {
                        inputFocus.value = withTiming(0, { duration: 200 });
                      }}
                    />
                  </View>
                </Animated.View>

                <Animated.View style={inputAnimatedStyle}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputRow}>
                    <Ionicons
                      name="lock-closed"
                      size={18}
                      color="#9E9E9E"
                      style={styles.leftIcon}
                    />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Enter your new password"
                      placeholderTextColor="#9E9E9E"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      onFocus={() => {
                        inputFocus.value = withTiming(1, { duration: 200 });
                      }}
                      onBlur={() => {
                        inputFocus.value = withTiming(0, { duration: 200 });
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeButtonInline}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#9E9E9E"
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                <Animated.View style={inputAnimatedStyle}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputRow}>
                    <Ionicons
                      name="lock-closed"
                      size={18}
                      color="#9E9E9E"
                      style={styles.leftIcon}
                    />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Confirm your new password"
                      placeholderTextColor="#9E9E9E"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      onFocus={() => {
                        inputFocus.value = withTiming(1, { duration: 200 });
                      }}
                      onBlur={() => {
                        inputFocus.value = withTiming(0, { duration: 200 });
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeButtonInline}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#9E9E9E"
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                <View style={styles.passwordHint}>
                  <Text style={styles.passwordHintText}>
                    Password must be at least 8 characters and contain:
                  </Text>
                  <Text style={styles.passwordHintText}>
                    • One uppercase letter
                  </Text>
                  <Text style={styles.passwordHintText}>
                    • One lowercase letter
                  </Text>
                  <Text style={styles.passwordHintText}>• One number</Text>
                </View>

                <Animated.View style={buttonAnimatedStyle}>
                  <TouchableOpacity
                    style={[
                      styles.resetButton,
                      {
                        opacity: isLoading ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleChangePassword}
                    disabled={isLoading}
                  >
                    <Text style={styles.resetButtonText}>
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.backLink}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Inter_700Bold',
  },
  titleGreen: {
    color: '#4CAF50',
  },
  titleOrange: {
    color: '#FF9800',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#666',
    paddingHorizontal: 20,
  },
  formCard: {
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
  form: {
    marginBottom: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  inputRow: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  leftIcon: {
    marginRight: 10,
  },
  eyeButtonInline: {
    padding: 6,
    marginLeft: 6,
  },
  passwordHint: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  passwordHintText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    lineHeight: 18,
  },
  resetButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    marginTop: 8,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backLink: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#4CAF50',
  },
});
