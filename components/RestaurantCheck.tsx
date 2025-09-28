import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useUserInfo } from '@/hooks/useUserInfo';

export default function RestaurantCheck() {
  const { data: userInfo, isLoading, error } = useUserInfo();
  const router = useRouter();

  useEffect(() => {
    // Only check if user info is loaded and user is authenticated
    if (!isLoading && userInfo && !error) {
      // Check if user doesn't have a restaurant
      if (!userInfo.owned_restaurant_id) {
        // Redirect to restaurant onboarding
        router.replace('/onboarding/restaurant');
      }
    }
  }, [userInfo, isLoading, error, router]);

  // This component doesn't render anything - it just handles the redirect logic
  return null;
}
