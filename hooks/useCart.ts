import { useQuery } from '@tanstack/react-query';
import { getCartWithItems } from '@/lib/supabase';

export const CART_QUERY_KEY = ['cart'] as const;

export function useCart() {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCartWithItems,
    staleTime: 1 * 60 * 1000, // 1 minute (cart changes frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
