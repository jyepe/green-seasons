import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { signInUser, getCurrentUserInfo, isAdmin } from '@/lib/supabase';
import { useSetAdminStatus } from '@/hooks/useAdmin';
import { useSetEmployeeStatus } from '@/hooks/useEmployee';
import AuthContainer from '@/components/auth/AuthContainer';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAdminStatus = useSetAdminStatus();
  const setEmployeeStatus = useSetEmployeeStatus();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
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

  return (
    <AuthContainer>
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
      <AuthCard>
        <View style={styles.form}>
          <AuthInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail"
            containerStyle={styles.inputContainer}
          />

          <AuthInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            icon="lock-closed"
            containerStyle={styles.inputContainer}
          />

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

          <AuthButton
            title="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.loginButton}
          />
        </View>
      </AuthCard>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don&apos;t have an account?{' '}
        </Text>
        <TouchableOpacity onPress={handleSignupPress}>
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
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
  loginButton: {
    marginBottom: 20,
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
