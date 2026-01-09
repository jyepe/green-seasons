import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { signInUser, getCurrentUserInfo, isAdmin } from '@/lib/supabase';
import { useSetAdminStatus } from '@/hooks/useAdmin';
import { useSetEmployeeStatus } from '@/hooks/useEmployee';
import AuthBackground from './AuthBackground';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAdminStatus = useSetAdminStatus();
  const setEmployeeStatus = useSetEmployeeStatus();

  const buttonScale = useSharedValue(1);
  const inputFocus = useSharedValue(0);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      // Sign in user
      await signInUser({
        email,
        password,
      });

      // Check if user is an admin and cache the result
      let userIsAdmin = false;
      try {
        userIsAdmin = await isAdmin();
        // Cache the admin status
        setAdminStatus(userIsAdmin);
        if (userIsAdmin) {
          // Admin user - go to admin dashboard
          router.replace('/admin/(tabs)');
          return;
        }
      } catch (adminCheckError) {
        // Log the error but don't block user flow
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.error('Failed to check admin status:', adminCheckError);
        }
        // Cache as non-admin if check fails
        setAdminStatus(false);
        // If admin check fails, treat user as non-admin and continue
        // This prevents blocking legitimate users due to transient issues
      }

      // Get user info to check role and restaurant ownership
      const userInfo = await getCurrentUserInfo();

      // Check if user is an employee
      if (userInfo?.role === 'employee') {
        setEmployeeStatus(true);
        router.replace('/employee/(tabs)');
        return;
      }

      setEmployeeStatus(false);

      if (userInfo && !userInfo.owned_restaurant_id) {
        // User doesn't have a restaurant - go to onboarding
        router.replace('/onboarding/restaurant');
      } else {
        // User has a restaurant - go to main app
        router.replace('/(tabs)');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to sign in. Please check your credentials and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupPress = () => {
    router.push('/auth/signup');
  };

  const handleForgotPasswordPress = () => {
    router.push('/auth/forgot-password');
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
                  source={require('@/assets/images/green-seasons-icon-1024.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>
                <Text style={styles.titleGreen}>Green</Text>{' '}
                <Text style={styles.titleOrange}>Seasons</Text>
              </Text>
              <Text style={styles.subtitle}>
                Fresh produce for your restaurant
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
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputRow}>
                    <Ionicons
                      name="lock-closed"
                      size={18}
                      color="#9E9E9E"
                      style={styles.leftIcon}
                    />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Enter your password"
                      placeholderTextColor="#9E9E9E"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
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

                <View style={styles.forgotPasswordContainer}>
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={handleForgotPasswordPress}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>

                <Animated.View style={buttonAnimatedStyle}>
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      {
                        opacity: isLoading ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don&apos;t have an account?{' '}
              </Text>
              <TouchableOpacity onPress={handleSignupPress}>
                <Text style={styles.signupLink}>Sign Up</Text>
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
    backgroundColor: '#F9F9F9', // Light background matching SVG
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
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  eyeButtonInline: {
    padding: 6,
    marginLeft: 6,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#4CAF50',
  },
  loginButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    marginBottom: 20,
  },
  loginButtonText: {
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
  footerText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  signupLink: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#4CAF50',
  },
});
