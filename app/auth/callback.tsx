import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { supabase } from '@/lib/supabase';

type OtpType =
  | 'signup'
  | 'recovery'
  | 'invite'
  | 'email_change'
  | 'email'
  | 'magiclink';

function parseSupabaseCallbackUrl(url: string) {
  // url can contain:
  // - query params: ?code=...&type=recovery
  // - hash params:  #access_token=...&refresh_token=...&type=recovery
  const u = new URL(url);

  const queryParams = Object.fromEntries(u.searchParams.entries());

  const hash = (u.hash || '').replace(/^#/, '');
  const hashParams = Object.fromEntries(new URLSearchParams(hash).entries());

  // hash params should override query params if both exist
  return { ...queryParams, ...hashParams };
}

export default function AuthCallback() {
  const router = useRouter();
  const url = ExpoLinking.useLinkingURL(); // <-- this gives you the FULL deep link, including the #fragment
  const [message, setMessage] = useState('Verifying...');

  useEffect(() => {
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    let isMounted = true;

    const run = async () => {
      try {
        if (!url) return;

        const p = parseSupabaseCallbackUrl(url);

        // 1) Implicit flow (what you're getting): access_token + refresh_token in HASH
        if (p.access_token && p.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: String(p.access_token),
            refresh_token: String(p.refresh_token),
          });

          const isRecoveryFlow = p.type === 'recovery';

          if (error) {
            if (isMounted) {
              setMessage(
                isRecoveryFlow
                  ? 'Invalid or expired reset link. Please request a new one.'
                  : 'Authentication failed. Please try again.'
              );
              timeoutIds.push(
                setTimeout(() => {
                  if (isMounted) {
                    router.replace(
                      isRecoveryFlow ? '/auth/forgot-password' : '/auth/login'
                    );
                  }
                }, 1500)
              );
            }
            return;
          }

          if (isMounted) {
            router.replace(isRecoveryFlow ? '/auth/reset-password' : '/');
          }
          return;
        }

        // 2) PKCE flow (some setups): code in QUERY
        if (p.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            String(p.code)
          );
          if (error) {
            if (isMounted) {
              setMessage(
                'Invalid or expired authentication link. Please try signing in again.'
              );
              timeoutIds.push(
                setTimeout(() => {
                  if (isMounted) {
                    router.replace('/auth/login');
                  }
                }, 1500)
              );
            }
            return;
          }

          if (isMounted) {
            if (p.type === 'recovery') router.replace('/auth/reset-password');
            else router.replace('/auth/login');
          }
          return;
        }

        // 3) OTP verification flow: token_hash + type
        if (p.token_hash && p.type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: String(p.token_hash),
            type: String(p.type) as OtpType,
          });

          if (error) {
            if (isMounted) {
              setMessage(error.message);
              timeoutIds.push(
                setTimeout(() => {
                  if (isMounted) {
                    router.replace('/auth/forgot-password');
                  }
                }, 1500)
              );
            }
            return;
          }

          if (isMounted) {
            if (p.type === 'recovery') router.replace('/auth/reset-password');
            else router.replace('/auth/login');
          }
          return;
        }

        if (isMounted) {
          setMessage('Invalid callback. Missing required parameters.');
          timeoutIds.push(
            setTimeout(() => {
              if (isMounted) {
                router.replace('/auth/login');
              }
            }, 1500)
          );
        }
      } catch (e) {
        if (isMounted) {
          setMessage(e instanceof Error ? e.message : 'Callback error.');
          timeoutIds.push(
            setTimeout(() => {
              if (isMounted) {
                router.replace('/auth/login');
              }
            }, 1500)
          );
        }
      }
    };

    run();

    return () => {
      isMounted = false;
      timeoutIds.forEach(clearTimeout);
    };
  }, [url, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { marginTop: 12, fontSize: 16 },
});
