import { Ionicons } from '@expo/vector-icons';
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
import { resetPassword } from '@/lib/supabase';
import AuthContainer from '@/components/auth/AuthContainer';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
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

    setIsLoading(true);

    try {
      await resetPassword({ email });
      setEmailSent(true);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to send reset email. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
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
          <Text style={styles.titleGreen}>Reset</Text>{' '}
          <Text style={styles.titleOrange}>Password</Text>
        </Text>
        <Text style={styles.subtitle}>
          {emailSent
            ? 'Check your email for reset instructions'
            : 'Enter your email to receive a password reset link'}
        </Text>
      </View>

      {/* Form */}
      {!emailSent ? (
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
              editable={!isLoading}
              icon="mail"
              containerStyle={styles.inputContainer}
            />

            <AuthButton
              title="Send Reset Link"
              onPress={handleResetPassword}
              isLoading={isLoading}
              style={styles.resetButton}
            />
          </View>
        </AuthCard>
      ) : (
        <AuthCard>
          <View style={styles.successContainer}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color="#4CAF50"
              style={styles.successIcon}
            />
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successText}>
              We&apos;ve sent a password reset link to{' '}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
            <Text style={styles.successSubtext}>
              Please check your inbox and follow the instructions to reset
              your password.
            </Text>
          </View>
        </AuthCard>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleBackToLogin}>
          <Text style={styles.backLink}>Back to Login</Text>
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
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 0,
  },
  inputContainer: {
    marginBottom: 20,
  },
  resetButton: {
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#333',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emailText: {
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  successSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
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
