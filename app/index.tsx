import { Colors } from '@/constants/Colors';
import { useAdmin, useSetAdminStatus } from '@/hooks/useAdmin';
import { useSetEmployeeStatus } from '@/hooks/useEmployee';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getCurrentUserInfo, isAdmin } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const setAdminStatus = useSetAdminStatus();
  const setEmployeeStatus = useSetEmployeeStatus();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is logged in
        const userInfo = await getCurrentUserInfo();

        if (!userInfo) {
          router.replace('/auth/login');
          return;
        }

        // Check if user is an admin
        try {
          const userIsAdmin = await isAdmin();
          setAdminStatus(userIsAdmin);
          if (userIsAdmin) {
            router.replace('/admin/(tabs)');
            return;
          }
        } catch (error) {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.error('Failed to check admin status:', error);
          }
          setAdminStatus(false);
        }

        // Check if user is an employee
        if (userInfo.role === 'employee') {
          setEmployeeStatus(true);
          router.replace('/employee/(tabs)');
          return;
        }
        setEmployeeStatus(false);

        // Check restaurant ownership for regular users
        if (!userInfo.owned_restaurant_id) {
          router.replace('/onboarding/restaurant');
        } else {
          router.replace('/(tabs)');
        }
      } catch (error) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.error('Auth check failed:', error);
        }
        router.replace('/auth/login');
      }
    };

    checkAuth();
  }, [router, setAdminStatus, setEmployeeStatus]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
