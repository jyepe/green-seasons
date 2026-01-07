import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
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
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, updateUserPassword } from '@/lib/supabase';
import { validatePassword } from '@/utils/validation';
import AuthBackground from './AuthBackground';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  const buttonScale = useSharedValue(1);
  const inputFocus = useSharedValue(0);

  useEffect(() => {
    // Check if user is authenticated (from password reset link)
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        Alert.alert(
          'Error',
          'Invalid or expired reset link. Please request a new password reset.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/forgot-password'),
            },
          ]
        );
      }
    };
    checkAuth();
  }, [router]);

  const handleResetPassword = async () => {
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
      await updateUserPassword(password);

      Alert.alert('Success', 'Your password has been reset successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/auth/login'),
        },
      ]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to reset password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
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

  if (isAuthenticated !== true) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuthBackground style={styles.svgBackground} />

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
                <Text style={styles.titleGreen}>New</Text>{' '}
                <Text style={styles.titleOrange}>Password</Text>
              </Text>
              <Text style={styles.subtitle}>Enter your new password below</Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <View style={styles.form}>
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
                    onPress={handleResetPassword}
                    disabled={isLoading}
                  >
                    <Text style={styles.resetButtonText}>
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
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
});
