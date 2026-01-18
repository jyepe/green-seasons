import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { resetPassword } from '@/lib/supabase';
import AuthContainer, {
  AuthFooter,
  AuthHeader,
} from '@/components/auth/AuthContainer';
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
      <AuthHeader
        firstWord="Reset"
        secondWord="Password"
        subtitle={
          emailSent
            ? 'Check your email for reset instructions'
            : 'Enter your email to receive a password reset link'
        }
      />

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
              Please check your inbox and follow the instructions to reset your
              password.
            </Text>
          </View>
        </AuthCard>
      )}

      {/* Footer */}
      <AuthFooter linkText="Back to Login" onLinkPress={handleBackToLogin} />
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
});
