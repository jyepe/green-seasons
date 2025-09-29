import { useQuery } from '@tanstack/react-query';
import { getItems } from '@/lib/supabase';

export const ITEMS_QUERY_KEY = ['items'] as const;

export function useItems() {
  return useQuery({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: getItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
