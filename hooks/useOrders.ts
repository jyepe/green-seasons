import { useQuery } from '@tanstack/react-query';
import { getOrdersForUser, type Order } from '@/lib/supabase';

export const ORDERS_QUERY_KEY = ['orders'] as const;

export function useOrders(userId: string | undefined) {
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, userId],
    queryFn: () => getOrdersForUser(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
