import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
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
import { signUpUser } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const buttonScale = useSharedValue(1);
  const inputFocus = useSharedValue(0);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldBlur = (field: string) => {
    const error = validateField(
      field,
      formData[field as keyof typeof formData]
    );
    setErrors(prev => ({ ...prev, [field]: error }));

    // Special case for confirm password - also validate when password changes
    if (field === 'password') {
      const confirmPasswordError = validateField(
        'confirmPassword',
        formData.confirmPassword
      );
      setErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }));
    }
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2)
          return 'First name must be at least 2 characters';
        return '';

      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2)
          return 'Last name must be at least 2 characters';
        return '';

      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value))
          return 'Please enter a valid email address';
        return '';

      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        // Remove all non-digit characters
        const cleanPhone = value.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
          return 'Phone number must be exactly 10 digits';
        }
        return '';

      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        if (value.length > 50)
          return 'Password must be less than 50 characters';
        return '';

      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';

      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach(field => {
      const error = validateField(
        field,
        formData[field as keyof typeof formData]
      );
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const isFormValid = (): boolean => {
    return Object.keys(formData).every(field => {
      const error = validateField(
        field,
        formData[field as keyof typeof formData]
      );
      return !error;
    });
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      await signUpUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      Alert.alert(
        'Success',
        'Account created successfully! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.push('/auth/login');
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

  const colors = Colors.light;

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
          {/* Fixed Header */}
          <View style={styles.fixedHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View
                style={[styles.logoIcon, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="leaf" size={24} color="white" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Create Account
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Subtitle */}
            <View style={styles.subtitleContainer}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Join Green Seasons and start ordering fresh produce
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Fields */}
              <View style={styles.row}>
                <Animated.View style={[inputAnimatedStyle, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    First Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        borderColor: errors.firstName
                          ? colors.error
                          : colors.textTertiary,
                        color: colors.text,
                      },
                    ]}
                    placeholder="John"
                    placeholderTextColor={colors.textTertiary}
                    value={formData.firstName}
                    onChangeText={value =>
                      handleInputChange('firstName', value)
                    }
                    autoCapitalize="words"
                    onFocus={() => {
                      inputFocus.value = withTiming(1, { duration: 200 });
                    }}
                    onBlur={() => {
                      inputFocus.value = withTiming(0, { duration: 200 });
                      handleFieldBlur('firstName');
                    }}
                  />
                  {errors.firstName && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.firstName}
                    </Text>
                  )}
                </Animated.View>

                <Animated.View style={[inputAnimatedStyle, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Last Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        borderColor: errors.lastName
                          ? colors.error
                          : colors.textTertiary,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Doe"
                    placeholderTextColor={colors.textTertiary}
                    value={formData.lastName}
                    onChangeText={value => handleInputChange('lastName', value)}
                    autoCapitalize="words"
                    onFocus={() => {
                      inputFocus.value = withTiming(1, { duration: 200 });
                    }}
                    onBlur={() => {
                      inputFocus.value = withTiming(0, { duration: 200 });
                      handleFieldBlur('lastName');
                    }}
                  />
                  {errors.lastName && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.lastName}
                    </Text>
                  )}
                </Animated.View>
              </View>

              {/* Email */}
              <Animated.View style={inputAnimatedStyle}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Email *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: errors.email
                        ? colors.error
                        : colors.textTertiary,
                      color: colors.text,
                    },
                  ]}
                  placeholder="john@restaurant.com"
                  placeholderTextColor={colors.textTertiary}
                  value={formData.email}
                  onChangeText={value => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => {
                    inputFocus.value = withTiming(1, { duration: 200 });
                  }}
                  onBlur={() => {
                    inputFocus.value = withTiming(0, { duration: 200 });
                    handleFieldBlur('email');
                  }}
                />
                {errors.email && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.email}
                  </Text>
                )}
              </Animated.View>

              {/* Phone */}
              <Animated.View style={inputAnimatedStyle}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Phone Number *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: errors.phone
                        ? colors.error
                        : colors.textTertiary,
                      color: colors.text,
                    },
                  ]}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={colors.textTertiary}
                  value={formData.phone}
                  onChangeText={value => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                  onFocus={() => {
                    inputFocus.value = withTiming(1, { duration: 200 });
                  }}
                  onBlur={() => {
                    inputFocus.value = withTiming(0, { duration: 200 });
                    handleFieldBlur('phone');
                  }}
                />
                {errors.phone ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.phone}
                  </Text>
                ) : (
                  <Text
                    style={[styles.helpText, { color: colors.textTertiary }]}
                  >
                    Enter 10 digits (e.g., 5551234567)
                  </Text>
                )}
              </Animated.View>

              {/* Password */}
              <Animated.View style={inputAnimatedStyle}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Password *
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: errors.password
                          ? colors.error
                          : colors.textTertiary,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Create a password"
                    placeholderTextColor={colors.textTertiary}
                    value={formData.password}
                    onChangeText={value => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => {
                      inputFocus.value = withTiming(1, { duration: 200 });
                    }}
                    onBlur={() => {
                      inputFocus.value = withTiming(0, { duration: 200 });
                      handleFieldBlur('password');
                    }}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.password}
                  </Text>
                ) : (
                  <Text
                    style={[styles.helpText, { color: colors.textTertiary }]}
                  >
                    Must be at least 6 characters
                  </Text>
                )}
              </Animated.View>

              {/* Confirm Password */}
              <Animated.View style={inputAnimatedStyle}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Confirm Password *
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: errors.confirmPassword
                          ? colors.error
                          : colors.textTertiary,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.textTertiary}
                    value={formData.confirmPassword}
                    onChangeText={value =>
                      handleInputChange('confirmPassword', value)
                    }
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => {
                      inputFocus.value = withTiming(1, { duration: 200 });
                    }}
                    onBlur={() => {
                      inputFocus.value = withTiming(0, { duration: 200 });
                      handleFieldBlur('confirmPassword');
                    }}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.confirmPassword}
                  </Text>
                )}
              </Animated.View>

              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.signupButton,
                    {
                      backgroundColor:
                        isFormValid() && !isLoading
                          ? colors.primary
                          : colors.textTertiary,
                      opacity: isLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleSignup}
                  disabled={isLoading || !isFormValid()}
                >
                  <Text style={styles.signupButtonText}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text
                style={[styles.footerText, { color: colors.textSecondary }]}
              >
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={handleLoginPress}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>
                  Sign In
                </Text>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    fontFamily: 'Inter_400Regular',
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Inter_400Regular',
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Inter_400Regular',
  },
  signupButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signupButtonText: {
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
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
