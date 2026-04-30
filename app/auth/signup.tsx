import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import React, { useReducer, useRef } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { signUpUser } from '@/lib/supabase';
import { useInvalidateUserInfo } from '@/hooks/useUserInfo';
import { validatePassword } from '@/utils/validation';
import AuthContainer, { AuthFooter } from '@/components/auth/AuthContainer';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import PasswordRequirements from '@/components/auth/PasswordRequirements';
import {
  initialSignupState,
  signupReducer,
  type SignupFormData,
} from '@/reducers/signupReducer';

export default function SignupScreen() {
  const [state, dispatch] = useReducer(signupReducer, initialSignupState);
  const router = useRouter();
  const invalidateUserInfo = useInvalidateUserInfo();

  // Refs for form fields
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    dispatch({ type: 'SET_FIELD', field, value });
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
        if (value !== state.formData.password) return 'Passwords do not match';
        return '';

      default:
        return '';
    }
  };

  const handleFieldBlur = (field: string) => {
    const error = validateField(
      field,
      state.formData[field as keyof typeof state.formData]
    );
    dispatch({ type: 'SET_ERROR', field, error });

    // Special case for confirm password - also validate when password changes
    if (field === 'password') {
      const confirmPasswordError = validateField(
        'confirmPassword',
        state.formData.confirmPassword
      );
      dispatch({
        type: 'SET_ERROR',
        field: 'confirmPassword',
        error: confirmPasswordError,
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(state.formData).forEach(field => {
      const error = validateField(
        field,
        state.formData[field as keyof typeof state.formData]
      );
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    dispatch({ type: 'SET_ALL_ERRORS', errors: newErrors });
    return isValid;
  };

  const isFormValid = (): boolean => {
    return Object.keys(state.formData).every(field => {
      const error = validateField(
        field,
        state.formData[field as keyof typeof state.formData]
      );
      return !error;
    });
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    try {
      await signUpUser({
        email: state.formData.email,
        password: state.formData.password,
        firstName: state.formData.firstName,
        lastName: state.formData.lastName,
        phone: state.formData.phone,
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
      dispatch({ type: 'SUBMIT_END' });
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
          Create an account to start ordering fresh produce
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
              value={state.formData.firstName}
              onChangeText={value => handleInputChange('firstName', value)}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => handleNextField('firstName')}
              onBlur={() => handleFieldBlur('firstName')}
              error={state.errors.firstName}
              containerStyle={styles.halfWidth}
            />

            <AuthInput
              ref={lastNameRef}
              label="Last Name *"
              placeholder="Doe"
              value={state.formData.lastName}
              onChangeText={value => handleInputChange('lastName', value)}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => handleNextField('lastName')}
              onBlur={() => handleFieldBlur('lastName')}
              error={state.errors.lastName}
              containerStyle={styles.halfWidth}
            />
          </View>

          {/* Email */}
          <AuthInput
            ref={emailRef}
            label="Email *"
            placeholder="john@restaurant.com"
            value={state.formData.email}
            onChangeText={value => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => handleNextField('email')}
            onBlur={() => handleFieldBlur('email')}
            error={state.errors.email}
            containerStyle={styles.inputSpacing}
          />

          {/* Phone */}
          <AuthInput
            ref={phoneRef}
            label="Phone Number *"
            placeholder="(555) 123-4567"
            value={state.formData.phone}
            onChangeText={value => handleInputChange('phone', value)}
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => handleNextField('phone')}
            onBlur={() => handleFieldBlur('phone')}
            error={state.errors.phone}
            helperText={
              !state.errors.phone
                ? 'Enter 10 digits (e.g., 5551234567)'
                : undefined
            }
            containerStyle={styles.inputSpacing}
          />

          {/* Password */}
          <AuthInput
            ref={passwordRef}
            label="Password *"
            placeholder="Create a password"
            value={state.formData.password}
            onChangeText={value => handleInputChange('password', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => handleNextField('password')}
            onBlur={() => handleFieldBlur('password')}
            error={state.errors.password}
            containerStyle={styles.inputSpacing}
          />

          {/* Confirm Password */}
          <AuthInput
            ref={confirmPasswordRef}
            label="Confirm Password *"
            placeholder="Confirm your password"
            value={state.formData.confirmPassword}
            onChangeText={value => handleInputChange('confirmPassword', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => handleNextField('confirmPassword')}
            onBlur={() => handleFieldBlur('confirmPassword')}
            error={state.errors.confirmPassword}
            containerStyle={styles.inputSpacing}
          />

          <PasswordRequirements />

          <AuthButton
            title="Create Account"
            onPress={handleSignup}
            isLoading={state.isLoading}
            disabled={!isFormValid()}
          />
        </View>
      </AuthCard>

      {/* Footer */}
      <AuthFooter
        text="Already have an account? "
        linkText="Sign In"
        onLinkPress={handleLoginPress}
      />
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
});
