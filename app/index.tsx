import { Colors } from '@/constants/Colors';
import { useSetAdminStatus } from '@/hooks/useAdmin';
import { useSetEmployeeStatus } from '@/hooks/useEmployee';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getCurrentUserInfo, isAdmin, supabase } from '@/lib/supabase';
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
      // eslint-disable-next-line no-console
      console.log('Auth Check: Starting...');

      try {
        // Initial session check
        const {
          data: { session },
        } = await supabase.auth.getSession();
        // eslint-disable-next-line no-console
        console.log('Auth Check: Session found?', !!session);

        if (!session) {
          // eslint-disable-next-line no-console
          console.log('Auth Check: No session, redirecting to login');
          router.replace('/auth/login');
          return;
        }

        // Fetch detailed user info
        // eslint-disable-next-line no-console
        console.log('Auth Check: Fetching user profile...');
        const userInfo = await getCurrentUserInfo();
        // eslint-disable-next-line no-console
        console.log('Auth Check: Profile loaded', userInfo?.email);

        if (!userInfo) {
          // eslint-disable-next-line no-console
          console.log('Auth Check: Profile missing (unexpected), to login');
          router.replace('/auth/login');
          return;
        }

        // Check Admin
        try {
          const userIsAdmin = await isAdmin();
          setAdminStatus(userIsAdmin);
          if (userIsAdmin) {
            // eslint-disable-next-line no-console
            console.log('Auth Check: User is Admin, redirecting to Admin Dashboard');
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

        // Check Employee
        if (userInfo.role === 'employee') {
          setEmployeeStatus(true);
          // eslint-disable-next-line no-console
          console.log('Auth Check: User is Employee, redirecting to Employee Dashboard');
          router.replace('/employee/(tabs)');
          return;
        }
        setEmployeeStatus(false);

        // Check Restaurant Owner
        if (!userInfo.owned_restaurant_id) {
          // eslint-disable-next-line no-console
          console.log('Auth Check: No restaurant, redirecting to onboarding');
          router.replace('/onboarding/restaurant');
        } else {
          // eslint-disable-next-line no-console
          console.log('Auth Check: Restaurant owner, redirecting to main app');
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
