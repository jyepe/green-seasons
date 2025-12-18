import { useQuery } from '@tanstack/react-query';
import { getOrderDetails } from '@/lib/supabase';

export const ORDER_DETAILS_QUERY_KEY = ['orderDetails'] as const;

export function useOrderDetails(orderId: string | undefined) {
  return useQuery({
    queryKey: [...ORDER_DETAILS_QUERY_KEY, orderId],
    queryFn: () => getOrderDetails(orderId!),
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
