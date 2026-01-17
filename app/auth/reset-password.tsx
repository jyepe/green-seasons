import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, updateUserPassword } from '@/lib/supabase';
import { validatePassword } from '@/utils/validation';
import AuthContainer, { AuthHeader } from '@/components/auth/AuthContainer';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import PasswordRequirements from '@/components/auth/PasswordRequirements';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

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

    setIsLoading(true);

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
    <AuthContainer>
      <AuthHeader
        firstWord="New"
        secondWord="Password"
        subtitle="Enter your new password below"
      />

      {/* Form */}
      <AuthCard>
        <View style={styles.form}>
          <AuthInput
            label="New Password"
            placeholder="Enter your new password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            icon="lock-closed"
            containerStyle={styles.inputContainer}
          />

          <AuthInput
            label="Confirm Password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            icon="lock-closed"
            containerStyle={styles.inputContainer}
          />

          <PasswordRequirements />

          <AuthButton
            title="Reset Password"
            onPress={handleResetPassword}
            isLoading={isLoading}
            style={styles.resetButton}
          />
        </View>
      </AuthCard>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
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
  form: {
    marginBottom: 0,
  },
  inputContainer: {
    marginBottom: 20,
  },
  resetButton: {
    marginTop: 8,
  },
});
