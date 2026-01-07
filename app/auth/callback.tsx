import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const params = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
    access_token?: string;
    refresh_token?: string;
  }>();

  const router = useRouter();
  const [message, setMessage] = useState('Verifying...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have access_token and refresh_token (from password reset link)
        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });

          if (sessionError) {
            setMessage(
              'Invalid or expired reset link. Please request a new one.'
            );
            setTimeout(() => {
              router.replace('/auth/forgot-password');
            }, 3000);
            return;
          }

          // Session set successfully, redirect to reset password page
          router.replace('/auth/reset-password');
          return;
        }

        // Fallback: Check for token_hash and type (OTP verification)
        if (params.token_hash && params.type) {
          type OtpType =
            | 'signup'
            | 'recovery'
            | 'invite'
            | 'email_change'
            | 'email'
            | 'magiclink';

          const { error } = await supabase.auth.verifyOtp({
            token_hash: String(params.token_hash),
            type: String(params.type) as OtpType,
          });

          if (error) {
            setMessage(error.message);
            setTimeout(() => {
              router.replace('/auth/forgot-password');
            }, 3000);
            return;
          }

          // If it's a recovery (password reset), redirect to reset password page
          if (params.type === 'recovery') {
            router.replace('/auth/reset-password');
          } else {
            router.replace('/auth/login');
          }
          return;
        }

        // No valid parameters found
        setMessage('Invalid callback. Missing required parameters.');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 3000);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'An error occurred during verification.'
        );
        setTimeout(() => {
          router.replace('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 20,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
  },
});
