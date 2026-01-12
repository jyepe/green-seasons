import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
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

/**
 * Hook to refetch items when screen comes into focus.
 * Use this in screen components that display items data to ensure
 * the items stay in sync when navigating between tabs/screens.
 */
export function useItemsRefetchOnFocus() {
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    }, [queryClient])
  );
}
