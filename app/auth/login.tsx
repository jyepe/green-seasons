import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { signInUser, getCurrentUserInfo, isAdmin } from '@/lib/supabase';
import { useSetAdminStatus } from '@/hooks/useAdmin';
import { useSetEmployeeStatus } from '@/hooks/useEmployee';
import AuthContainer, {
  AuthFooter,
  AuthHeader,
} from '@/components/auth/AuthContainer';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAdminStatus = useSetAdminStatus();
  const setEmployeeStatus = useSetEmployeeStatus();

  const handleChange = (
    setter: (val: string) => void,
    field: keyof typeof errors,
    val: string
  ) => {
    setter(val);
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    }
  };

  const handleLogin = async () => {
    // Reset errors
    setErrors({});

    let hasError = false;
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
      hasError = true;
    }
    if (!password) {
      newErrors.password = 'Password is required';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

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
      setErrors({ general: errorMessage });
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

  return (
    <AuthContainer>
      <AuthHeader
        firstWord="Green"
        secondWord="Seasons"
        subtitle="Fresh produce for your restaurant"
      />

      {/* Form */}
      <AuthCard>
        <View style={styles.form}>
          <AuthInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(t) => handleChange(setEmail, 'email', t)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail"
            error={errors.email}
            containerStyle={styles.inputContainer}
          />

          <AuthInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => handleChange(setPassword, 'password', t)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            icon="lock-closed"
            error={errors.password}
            containerStyle={styles.inputContainer}
          />

          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPasswordPress}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {errors.general && (
            <View style={styles.errorContainer}>
              <Text
                style={styles.generalErrorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {errors.general}
              </Text>
            </View>
          )}

          <AuthButton
            title="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.loginButton}
          />
        </View>
      </AuthCard>

      {/* Footer */}
      <AuthFooter
        text="Don't have an account? "
        linkText="Sign Up"
        onLinkPress={handleSignupPress}
      />
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    marginBottom: 0,
  },
  inputContainer: {
    marginBottom: 20,
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
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  generalErrorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },
  loginButton: {
    marginBottom: 20,
  },
});
