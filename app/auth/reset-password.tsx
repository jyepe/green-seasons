import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, updateUserPassword } from '@/lib/supabase';
import { validatePassword } from '@/utils/validation';
import AuthContainer from '@/components/auth/AuthContainer';
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
          <Text style={styles.titleGreen}>New</Text>{' '}
          <Text style={styles.titleOrange}>Password</Text>
        </Text>
        <Text style={styles.subtitle}>Enter your new password below</Text>
      </View>

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
});
