import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrderFromCart, getOrdersForUser } from '@/lib/supabase';
import { CART_QUERY_KEY } from './useCart';

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

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      deliveryAt,
      paymentMethod,
    }: {
      restaurantId: string;
      deliveryAt: Date;
      paymentMethod: string;
    }) => createOrderFromCart(restaurantId, deliveryAt, paymentMethod),
    onSuccess: () => {
      // Invalidate cart query since cart is cleared after order creation
      queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEY,
      });
      // Invalidate orders query to refresh orders list
      queryClient.invalidateQueries({
        queryKey: ORDERS_QUERY_KEY,
      });
    },
  });
}
