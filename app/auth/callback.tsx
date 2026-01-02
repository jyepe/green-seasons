import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const { token_hash, type } = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
  }>();

  type OtpType =
    | 'signup'
    | 'recovery'
    | 'invite'
    | 'email_change'
    | 'email'
    | 'magiclink';
  const router = useRouter();
  const [msg, setMsg] = useState('Verifying…');

  useEffect(() => {
    (async () => {
      if (!token_hash || !type) {
        setMsg('Missing verification data.');
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: String(token_hash),
        type: String(type) as OtpType,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      router.replace('/auth/login');
    })();
  }, [token_hash, type, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{msg}</Text>
    </View>
  );
}
