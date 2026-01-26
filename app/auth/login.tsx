import { useRouter } from 'expo-router';
import React, { useReducer } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { initialLoginState, loginReducer } from '@/reducers/loginReducer';

export default function LoginScreen() {
  const [state, dispatch] = useReducer(loginReducer, initialLoginState);
  const { email, password, isLoading } = state;

  const router = useRouter();
  const setAdminStatus = useSetAdminStatus();
  const setEmployeeStatus = useSetEmployeeStatus();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: 'LOGIN_START' });

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
          dispatch({ type: 'LOGIN_SUCCESS' });
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
        dispatch({ type: 'LOGIN_SUCCESS' });
        router.replace('/employee/(tabs)');
        return;
      }

      setEmployeeStatus(false);

      if (userInfo && !userInfo.owned_restaurant_id) {
        // User doesn't have a restaurant - go to onboarding
        dispatch({ type: 'LOGIN_SUCCESS' });
        router.replace('/onboarding/restaurant');
      } else {
        // User has a restaurant - go to main app
        dispatch({ type: 'LOGIN_SUCCESS' });
        router.replace('/(tabs)');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to sign in. Please check your credentials and try again.';

      dispatch({ type: 'LOGIN_FAILURE' });
      Alert.alert('Error', errorMessage);
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
            onChangeText={text =>
              dispatch({ type: 'SET_EMAIL', payload: text })
            }
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
            onChangeText={text =>
              dispatch({ type: 'SET_PASSWORD', payload: text })
            }
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
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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
  loginButton: {
    marginBottom: 20,
  },
});
