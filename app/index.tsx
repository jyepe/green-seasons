import { Colors } from '@/constants/Colors';
import { ROUTES, USER_ROLES } from '@/constants/Routes';
import { useSetAdminStatus } from '@/hooks/useAdmin';
import { useSetEmployeeStatus } from '@/hooks/useEmployee';
import { useAppColorScheme } from '@/hooks/useTheme';
import { getCurrentUserInfo, isAdmin, supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const setAdminStatus = useSetAdminStatus();
  const setEmployeeStatus = useSetEmployeeStatus();

  useEffect(() => {
    const checkAuth = async () => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Auth Check: Starting...');
      }

      try {
        // Initial session check
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('Auth Check: Session found?', !!session);
        }

        if (!session) {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log('Auth Check: No session, redirecting to login');
          }
          router.replace(ROUTES.AUTH_LOGIN);
          return;
        }

        // Fetch detailed user info
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('Auth Check: Fetching user profile...');
        }
        const userInfo = await getCurrentUserInfo();
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('Auth Check: Profile loaded', userInfo?.email);
        }

        if (!userInfo) {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log('Auth Check: Profile missing (unexpected), to login');
          }
          router.replace(ROUTES.AUTH_LOGIN);
          return;
        }

        // Check Admin
        try {
          const userIsAdmin = await isAdmin();
          setAdminStatus(userIsAdmin);
          if (userIsAdmin) {
            if (__DEV__) {
              // eslint-disable-next-line no-console
              console.log(
                'Auth Check: User is Admin, redirecting to Admin Dashboard'
              );
            }
            router.replace(ROUTES.ADMIN_DASHBOARD);
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
        if (userInfo.role === USER_ROLES.EMPLOYEE) {
          setEmployeeStatus(true);
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log(
              'Auth Check: User is Employee, redirecting to Employee Dashboard'
            );
          }
          router.replace(ROUTES.EMPLOYEE_DASHBOARD);
          return;
        }
        setEmployeeStatus(false);

        // Check Restaurant Owner
        if (!userInfo.owned_restaurant_id) {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log('Auth Check: No restaurant, redirecting to onboarding');
          }
          router.replace(ROUTES.ONBOARDING_RESTAURANT);
        } else {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log(
              'Auth Check: Restaurant owner, redirecting to main app'
            );
          }
          router.replace(ROUTES.RESTAURANT_OWNER_DASHBOARD);
        }
      } catch (error) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.error('Auth check failed:', error);
        }
        router.replace(ROUTES.AUTH_LOGIN);
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
