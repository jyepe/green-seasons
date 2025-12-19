import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addToCart,
  clearCart,
  getCartWithItems,
  type AddToCartParams,
} from '@/lib/supabase';

export const CART_QUERY_KEY = ['cart'] as const;

export function useCart() {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCartWithItems,
    staleTime: 0, // Always consider stale to ensure cart is in sync across screens
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to refetch cart when screen comes into focus.
 * Use this in screen components that display cart data to ensure
 * the cart stays in sync when navigating between tabs/screens.
 */
export function useCartRefetchOnFocus() {
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    }, [queryClient])
  );
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AddToCartParams) => addToCart(params),
    onSuccess: () => {
      // Invalidate cart query to refresh cart data
      queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEY,
      });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      // Invalidate cart query to refresh cart data
      queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEY,
      });
    },
  });
}
