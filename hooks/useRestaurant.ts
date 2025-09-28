import { useQuery } from '@tanstack/react-query';
import { getRestaurantById, type Restaurant } from '@/lib/supabase';

export const RESTAURANT_QUERY_KEY = ['restaurant'] as const;

export function useRestaurant(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [...RESTAURANT_QUERY_KEY, restaurantId],
    queryFn: () => getRestaurantById(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
