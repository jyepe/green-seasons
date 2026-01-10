import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { signUpUser } from '@/lib/supabase';
import { useInvalidateUserInfo } from '@/hooks/useUserInfo';
import { validatePassword } from '@/utils/validation';
import AuthContainer from '@/components/auth/AuthContainer';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const invalidateUserInfo = useInvalidateUserInfo();

  // Refs for form fields
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextField = (currentField: string) => {
    switch (currentField) {
      case 'firstName':
        lastNameRef.current?.focus();
        break;
      case 'lastName':
        emailRef.current?.focus();
        break;
      case 'email':
        phoneRef.current?.focus();
        break;
      case 'phone':
        passwordRef.current?.focus();
        break;
      case 'password':
        confirmPasswordRef.current?.focus();
        break;
      case 'confirmPassword':
        // Last field - submit form
        handleSignup();
        break;
      default:
        break;
    }
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
        const passwordError = validatePassword(value);
        return passwordError || '';

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

    try {
      await signUpUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      // Invalidate user info cache to trigger refetch when user logs in
      invalidateUserInfo();

      Alert.alert(
        'Success',
        'Account created successfully! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create account. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.push('/auth/login');
  };

  const colors = Colors.light;

  return (
    <AuthContainer contentContainerStyle={styles.scrollContent}>
      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Join Green Seasons and start ordering fresh produce
        </Text>
      </View>

      {/* Form */}
      <AuthCard>
        <View style={styles.form}>
          {/* Name Fields */}
          <View style={styles.row}>
            <AuthInput
              ref={firstNameRef}
              label="First Name *"
              placeholder="John"
              value={formData.firstName}
              onChangeText={value => handleInputChange('firstName', value)}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => handleNextField('firstName')}
              onBlur={() => handleFieldBlur('firstName')}
              error={errors.firstName}
              containerStyle={styles.halfWidth}
            />

            <AuthInput
              ref={lastNameRef}
              label="Last Name *"
              placeholder="Doe"
              value={formData.lastName}
              onChangeText={value => handleInputChange('lastName', value)}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => handleNextField('lastName')}
              onBlur={() => handleFieldBlur('lastName')}
              error={errors.lastName}
              containerStyle={styles.halfWidth}
            />
          </View>

          {/* Email */}
          <AuthInput
            ref={emailRef}
            label="Email *"
            placeholder="john@restaurant.com"
            value={formData.email}
            onChangeText={value => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => handleNextField('email')}
            onBlur={() => handleFieldBlur('email')}
            error={errors.email}
            containerStyle={styles.inputSpacing}
          />

          {/* Phone */}
          <AuthInput
            ref={phoneRef}
            label="Phone Number *"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChangeText={value => handleInputChange('phone', value)}
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => handleNextField('phone')}
            onBlur={() => handleFieldBlur('phone')}
            error={errors.phone}
            helperText={!errors.phone ? "Enter 10 digits (e.g., 5551234567)" : undefined}
            containerStyle={styles.inputSpacing}
          />

          {/* Password */}
          <AuthInput
            ref={passwordRef}
            label="Password *"
            placeholder="Create a password"
            value={formData.password}
            onChangeText={value => handleInputChange('password', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => handleNextField('password')}
            onBlur={() => handleFieldBlur('password')}
            error={errors.password}
            containerStyle={styles.inputSpacing}
          />

          {/* Confirm Password */}
          <AuthInput
            ref={confirmPasswordRef}
            label="Confirm Password *"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChangeText={value => handleInputChange('confirmPassword', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => handleNextField('confirmPassword')}
            onBlur={() => handleFieldBlur('confirmPassword')}
            error={errors.confirmPassword}
            containerStyle={styles.inputSpacing}
          />

          <View
            style={[
              styles.passwordHint,
              { backgroundColor: colors.inputBackground },
            ]}
          >
            <Text
              style={[
                styles.passwordHintText,
                { color: colors.textSecondary },
              ]}
            >
              Password must be at least 8 characters and contain:
            </Text>
            {[
              'One uppercase letter',
              'One lowercase letter',
              'One number',
            ].map((requirement, index) => (
              <Text
                key={index}
                style={[
                  styles.passwordHintText,
                  { color: colors.textSecondary },
                ]}
              >
                {`• ${requirement}`}
              </Text>
            ))}
          </View>

          <AuthButton
            title="Create Account"
            onPress={handleSignup}
            isLoading={isLoading}
            disabled={!isFormValid()}
          />
        </View>
      </AuthCard>

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
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 20,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
    marginBottom: 0,
  },
  inputSpacing: {
    marginBottom: 20,
  },
  passwordHint: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
  },
  passwordHintText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
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
